'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const shiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  breakMinutes: z.number().min(0).default(0),
  isOvernight: z.boolean().default(false),
  color: z.string().optional(),
})

export type ShiftFormData = z.infer<typeof shiftSchema>

export async function getShifts() {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        _count: {
          select: { 
            schedules: true,
            attendances: true 
          }
        }
      },
      orderBy: { startTime: 'asc' }
    })
    return { success: true, data: shifts }
  } catch (error) {
    console.error('Failed to fetch shifts:', error)
    return { success: false, error: 'Failed to fetch shifts' }
  }
}

export async function getShiftById(id: string) {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id },
    })
    if (!shift) {
      return { success: false, error: 'Shift not found' }
    }
    return { success: true, data: shift }
  } catch (error) {
    console.error('Failed to fetch shift:', error)
    return { success: false, error: 'Failed to fetch shift' }
  }
}

export async function createShift(data: ShiftFormData) {
  try {
    const validated = shiftSchema.parse(data)
    
    const shift = await prisma.shift.create({
      data: validated
    })
    
    revalidatePath('/dashboard/shifts')
    return { success: true, data: shift }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to create shift:', error)
    return { success: false, error: 'Failed to create shift' }
  }
}

export async function updateShift(id: string, data: ShiftFormData) {
  try {
    const validated = shiftSchema.parse(data)
    
    const shift = await prisma.shift.update({
      where: { id },
      data: validated
    })
    
    revalidatePath('/dashboard/shifts')
    return { success: true, data: shift }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to update shift:', error)
    return { success: false, error: 'Failed to update shift' }
  }
}

export async function deleteShift(id: string) {
  try {
    // Check if shift has schedules or attendances
    const [scheduleCount, attendanceCount] = await Promise.all([
      prisma.employeeSchedule.count({ where: { shiftId: id } }),
      prisma.attendance.count({ where: { shiftId: id } })
    ])
    
    if (scheduleCount > 0 || attendanceCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete shift with ${scheduleCount} schedule(s) and ${attendanceCount} attendance record(s).` 
      }
    }
    
    await prisma.shift.delete({
      where: { id }
    })
    
    revalidatePath('/dashboard/shifts')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete shift:', error)
    return { success: false, error: 'Failed to delete shift' }
  }
}

/**
 * Auto-detect shift based on check-in time
 */
export async function detectShiftByTime(checkInTime: Date) {
  try {
    const shifts = await prisma.shift.findMany()
    
    const checkInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes()
    
    for (const shift of shifts) {
      const [startH, startM] = shift.startTime.split(':').map(Number)
      const [endH, endM] = shift.endTime.split(':').map(Number)
      
      const startMinutes = startH * 60 + startM
      let endMinutes = endH * 60 + endM
      
      // Handle overnight shifts (e.g., 22:00 - 06:00)
      if (shift.isOvernight) {
        // If end time is "smaller" than start time, it crosses midnight
        if (checkInMinutes >= startMinutes || checkInMinutes <= endMinutes) {
          return { success: true, data: shift }
        }
      } else {
        // Normal shift within same day
        if (checkInMinutes >= startMinutes && checkInMinutes <= endMinutes) {
          return { success: true, data: shift }
        }
      }
    }
    
    return { success: false, error: 'No matching shift found for this time' }
  } catch (error) {
    console.error('Failed to detect shift:', error)
    return { success: false, error: 'Failed to detect shift' }
  }
}
