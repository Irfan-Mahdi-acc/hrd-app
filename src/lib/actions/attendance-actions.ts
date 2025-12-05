'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { detectShiftByTime } from './shift-actions'
import { calculateDistance } from '@/lib/utils/attendance-utils'

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

/**
 * Get attendance logs with advanced filtering
 */
export async function getAttendanceLogsWithFilters(filters: {
  branchId?: string
  employeeId?: string
  status?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  try {
    const { branchId, employeeId, status, startDate, endDate, page = 1, limit = 50 } = filters
    
    const where: any = {}
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (branchId) {
      where.employee = {
        branchId
      }
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
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
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.attendance.count({ where })
    ])

    return { 
      success: true, 
      data: attendances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Failed to fetch attendance logs:', error)
    return { success: false, error: 'Failed to fetch attendance logs' }
  }
}

/**
 * Correct attendance record (manual correction by admin)
 */
export async function correctAttendance(
  id: string,
  data: {
    checkIn?: Date
    checkOut?: Date
    status?: 'PRESENT' | 'LATE' | 'ABSENT' | 'SICK' | 'PERMISSION' | 'LEAVE'
    notes?: string
  }
) {
  try {
    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...data,
        method: 'MANUAL' // Mark as manually corrected
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
    revalidatePath('/dashboard/attendance/logs')
    return { success: true, data: attendance, message: 'Attendance corrected successfully' }
  } catch (error) {
    console.error('Failed to correct attendance:', error)
    return { success: false, error: 'Failed to correct attendance' }
  }
}

/**
 * Get attendance statistics
 */
export async function getAttendanceStats(filters: {
  branchId?: string
  employeeId?: string
  startDate?: Date
  endDate?: Date
}) {
  try {
    const { branchId, employeeId, startDate, endDate } = filters
    
    const where: any = {}
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (branchId) {
      where.employee = {
        branchId
      }
    }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const [total, present, late, absent, sick, permission, leave] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.count({ where: { ...where, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { ...where, status: 'LATE' } }),
      prisma.attendance.count({ where: { ...where, status: 'ABSENT' } }),
      prisma.attendance.count({ where: { ...where, status: 'SICK' } }),
      prisma.attendance.count({ where: { ...where, status: 'PERMISSION' } }),
      prisma.attendance.count({ where: { ...where, status: 'LEAVE' } })
    ])

    return {
      success: true,
      data: {
        total,
        present,
        late,
        absent,
        sick,
        permission,
        leave,
        presentPercentage: total > 0 ? ((present / total) * 100).toFixed(1) : '0',
        latePercentage: total > 0 ? ((late / total) * 100).toFixed(1) : '0',
        absentPercentage: total > 0 ? ((absent / total) * 100).toFixed(1) : '0'
      }
    }
  } catch (error) {
    console.error('Failed to fetch attendance stats:', error)
    return { success: false, error: 'Failed to fetch attendance stats' }
  }
}
