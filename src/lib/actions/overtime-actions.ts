'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { OvertimeStatus } from '@prisma/client'

/**
 * Create overtime request
 */
export async function createOvertimeRequest(data: {
  employeeId: string
  date: Date
  startTime: Date
  endTime: Date
  reason?: string
}) {
  try {
    // Calculate duration in hours
    const duration = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60)

    const overtime = await prisma.overtime.create({
      data: {
        ...data,
        duration,
      },
      include: {
        employee: {
          include: {
            position: true,
            branch: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/overtime')
    return { success: true, data: overtime }
  } catch (error) {
    console.error('Failed to create overtime request:', error)
    return { success: false, error: 'Failed to create overtime request' }
  }
}

/**
 * Get overtime requests with filters
 */
export async function getOvertimeRequests(filters?: {
  employeeId?: string
  status?: OvertimeStatus
  startDate?: Date
  endDate?: Date
}) {
  try {
    const where: any = {}

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) where.date.gte = filters.startDate
      if (filters.endDate) where.date.lte = filters.endDate
    }

    const overtimes = await prisma.overtime.findMany({
      where,
      include: {
        employee: {
          include: {
            position: true,
            branch: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return { success: true, data: overtimes }
  } catch (error) {
    console.error('Failed to fetch overtime requests:', error)
    return { success: false, error: 'Failed to fetch overtime requests' }
  }
}

/**
 * Approve overtime request
 */
export async function approveOvertime(
  id: string,
  data: {
    rate: number
    approvedBy: string
  }
) {
  try {
    const overtime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    })

    if (!overtime) {
      return { success: false, error: 'Overtime request not found' }
    }

    // Calculate overtime pay
    const hourlyRate = overtime.employee.hourlyRate || 0
    const amount = overtime.duration * hourlyRate * data.rate

    const updated = await prisma.overtime.update({
      where: { id },
      data: {
        status: OvertimeStatus.APPROVED,
        rate: data.rate,
        amount,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
      },
      include: {
        employee: {
          include: {
            position: true,
            branch: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/overtime')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Failed to approve overtime:', error)
    return { success: false, error: 'Failed to approve overtime' }
  }
}

/**
 * Reject overtime request
 */
export async function rejectOvertime(id: string, rejectedBy: string) {
  try {
    const overtime = await prisma.overtime.update({
      where: { id },
      data: {
        status: OvertimeStatus.REJECTED,
        approvedBy: rejectedBy,
        approvedAt: new Date(),
      },
      include: {
        employee: {
          include: {
            position: true,
            branch: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/overtime')
    return { success: true, data: overtime }
  } catch (error) {
    console.error('Failed to reject overtime:', error)
    return { success: false, error: 'Failed to reject overtime' }
  }
}

/**
 * Get overtime summary statistics
 */
export async function getOvertimeSummary(filters?: {
  employeeId?: string
  startDate?: Date
  endDate?: Date
}) {
  try {
    const where: any = {}

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) where.date.gte = filters.startDate
      if (filters.endDate) where.date.lte = filters.endDate
    }

    const [total, pending, approved, rejected, totalHours, totalAmount] = await Promise.all([
      prisma.overtime.count({ where }),
      prisma.overtime.count({ where: { ...where, status: OvertimeStatus.PENDING } }),
      prisma.overtime.count({ where: { ...where, status: OvertimeStatus.APPROVED } }),
      prisma.overtime.count({ where: { ...where, status: OvertimeStatus.REJECTED } }),
      prisma.overtime.aggregate({
        where: { ...where, status: OvertimeStatus.APPROVED },
        _sum: { duration: true },
      }),
      prisma.overtime.aggregate({
        where: { ...where, status: OvertimeStatus.APPROVED },
        _sum: { amount: true },
      }),
    ])

    return {
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        totalHours: totalHours._sum.duration || 0,
        totalAmount: totalAmount._sum.amount || 0,
      },
    }
  } catch (error) {
    console.error('Failed to fetch overtime summary:', error)
    return { success: false, error: 'Failed to fetch overtime summary' }
  }
}

/**
 * Get overtime by ID
 */
export async function getOvertimeById(id: string) {
  try {
    const overtime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            position: true,
            branch: true,
          },
        },
      },
    })

    if (!overtime) {
      return { success: false, error: 'Overtime request not found' }
    }

    return { success: true, data: overtime }
  } catch (error) {
    console.error('Failed to fetch overtime:', error)
    return { success: false, error: 'Failed to fetch overtime' }
  }
}

/**
 * Delete overtime request
 */
export async function deleteOvertime(id: string) {
  try {
    await prisma.overtime.delete({
      where: { id },
    })

    revalidatePath('/dashboard/overtime')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete overtime:', error)
    return { success: false, error: 'Failed to delete overtime' }
  }
}

/**
 * Get approved overtime for payroll period
 */
export async function getApprovedOvertimeForPeriod(
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const overtimes = await prisma.overtime.findMany({
      where: {
        employeeId,
        status: OvertimeStatus.APPROVED,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const totalHours = overtimes.reduce((sum, ot) => sum + ot.duration, 0)
    const totalAmount = overtimes.reduce((sum, ot) => sum + (ot.amount || 0), 0)

    return {
      success: true,
      data: {
        overtimes,
        totalHours,
        totalAmount,
      },
    }
  } catch (error) {
    console.error('Failed to fetch approved overtime:', error)
    return { success: false, error: 'Failed to fetch approved overtime' }
  }
}
