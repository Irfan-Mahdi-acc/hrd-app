'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { detectShiftByTime } from './shift-actions'

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Check if employee is within branch geofence
 */
async function validateLocation(employeeId: string, latitude: number, longitude: number) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { branch: true }
  })

  if (!employee) {
    return { valid: false, error: 'Employee not found' }
  }

  if (!employee.branch.latitude || !employee.branch.longitude) {
    return { valid: false, error: 'Branch location not configured' }
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    employee.branch.latitude,
    employee.branch.longitude
  )

  const isWithinRadius = distance <= employee.branch.radius

  return {
    valid: isWithinRadius,
    distance,
    branchRadius: employee.branch.radius,
    branchName: employee.branch.name,
    error: isWithinRadius ? null : `You are ${Math.round(distance)}m away from ${employee.branch.name}. Maximum allowed: ${employee.branch.radius}m`
  }
}

/**
 * Check-in with geolocation
 */
export async function checkIn(employeeId: string, latitude: number, longitude: number) {
  try {
    // Check if already checked in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today
        }
      }
    })

    if (existingAttendance) {
      return { success: false, error: 'You have already checked in today' }
    }

    // Validate location
    const locationCheck = await validateLocation(employeeId, latitude, longitude)
    if (!locationCheck.valid) {
      return { success: false, error: locationCheck.error }
    }

    // Detect shift based on current time
    const now = new Date()
    const shiftResult = await detectShiftByTime(now)
    
    // Determine status (PRESENT or LATE)
    let status: 'PRESENT' | 'LATE' = 'PRESENT'
    if (shiftResult.success && shiftResult.data) {
      const shift = shiftResult.data
      const [startHour, startMinute] = shift.startTime.split(':').map(Number)
      const shiftStart = new Date()
      shiftStart.setHours(startHour, startMinute, 0, 0)
      
      if (now > shiftStart) {
        status = 'LATE'
      }
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: now,
        checkIn: now,
        checkInLat: latitude,
        checkInLong: longitude,
        method: 'GPS',
        status,
        shiftId: shiftResult.success && shiftResult.data ? shiftResult.data.id : null,
      },
      include: {
        shift: true,
        employee: {
          include: {
            branch: true,
            position: true
          }
        }
      }
    })

    revalidatePath('/dashboard/attendance')
    return { 
      success: true, 
      data: attendance,
      message: `Check-in successful! ${status === 'LATE' ? 'You are late.' : ''}`
    }
  } catch (error) {
    console.error('Check-in error:', error)
    return { success: false, error: 'Failed to check in' }
  }
}

/**
 * Check-out with geolocation
 */
export async function checkOut(attendanceId: string, latitude: number, longitude: number) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { employee: true }
    })

    if (!attendance) {
      return { success: false, error: 'Attendance record not found' }
    }

    if (attendance.checkOut) {
      return { success: false, error: 'You have already checked out' }
    }

    // Validate location
    const locationCheck = await validateLocation(attendance.employeeId, latitude, longitude)
    if (!locationCheck.valid) {
      return { success: false, error: locationCheck.error }
    }

    // Update attendance record
    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkOut: new Date(),
        checkOutLat: latitude,
        checkOutLong: longitude,
      },
      include: {
        shift: true,
        employee: {
          include: {
            branch: true,
            position: true
          }
        }
      }
    })

    revalidatePath('/dashboard/attendance')
    return { success: true, data: updated, message: 'Check-out successful!' }
  } catch (error) {
    console.error('Check-out error:', error)
    return { success: false, error: 'Failed to check out' }
  }
}

/**
 * Get today's attendance for employee
 */
export async function getTodayAttendance(employeeId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today
        }
      },
      include: {
        shift: true,
        employee: {
          include: {
            branch: true,
            position: true
          }
        }
      }
    })

    return { success: true, data: attendance }
  } catch (error) {
    console.error('Failed to fetch attendance:', error)
    return { success: false, error: 'Failed to fetch attendance' }
  }
}

/**
 * Get attendance history for employee
 */
export async function getAttendanceByEmployee(
  employeeId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const where: any = { employeeId }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        shift: true,
      },
      orderBy: { date: 'desc' }
    })

    return { success: true, data: attendances }
  } catch (error) {
    console.error('Failed to fetch attendance:', error)
    return { success: false, error: 'Failed to fetch attendance' }
  }
}

/**
 * Get all attendance for a specific date (for admin/HR)
 */
export async function getAttendanceByDate(date: Date, branchId?: string) {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const where: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (branchId) {
      where.employee = {
        branchId
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        shift: true,
        employee: {
          include: {
            branch: true,
            position: true
          }
        }
      },
      orderBy: { checkIn: 'asc' }
    })

    return { success: true, data: attendances }
  } catch (error) {
    console.error('Failed to fetch attendance:', error)
    return { success: false, error: 'Failed to fetch attendance' }
  }
}

/**
 * Calculate work hours from attendance
 */
export function calculateWorkHours(checkIn: Date, checkOut: Date | null): number {
  if (!checkOut) return 0
  
  const diff = checkOut.getTime() - checkIn.getTime()
  return diff / (1000 * 60 * 60) // Convert to hours
}

/**
 * Update attendance status (manual correction by admin)
 */
export async function updateAttendanceStatus(
  id: string,
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'SICK' | 'PERMISSION' | 'LEAVE',
  notes?: string
) {
  try {
    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        status,
        notes
      }
    })

    revalidatePath('/dashboard/attendance')
    return { success: true, data: attendance }
  } catch (error) {
    console.error('Failed to update attendance:', error)
    return { success: false, error: 'Failed to update attendance' }
  }
}
