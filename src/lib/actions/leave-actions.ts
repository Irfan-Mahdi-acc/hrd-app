'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  leaveType: z.enum(['ANNUAL', 'SICK', 'PERMISSION', 'MONTHLY', 'UNPAID', 'EMERGENCY']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
})

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>

/**
 * Calculate working days between two dates (excluding weekends)
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const day = current.getDay()
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (day !== 0 && day !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

/**
 * Get leave balance for employee
 */
export async function getLeaveBalance(employeeId: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return { success: false, error: 'Employee not found' }
    }

    // Get current year
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59)

    // Get approved leave requests for this year
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: {
          gte: yearStart,
          lte: yearEnd
        }
      }
    })

    // Calculate used days by type
    const usedAnnual = approvedLeaves
      .filter(l => l.leaveType === 'ANNUAL')
      .reduce((sum, l) => sum + l.duration, 0)

    const usedMonthly = approvedLeaves
      .filter(l => l.leaveType === 'MONTHLY')
      .reduce((sum, l) => sum + l.duration, 0)

    return {
      success: true,
      data: {
        annualLeaveQuota: employee.annualLeaveQuota,
        monthlyLeaveQuota: employee.monthlyLeaveQuota,
        usedAnnual,
        usedMonthly,
        remainingAnnual: employee.annualLeaveQuota - usedAnnual,
        remainingMonthly: employee.monthlyLeaveQuota - usedMonthly,
      }
    }
  } catch (error) {
    console.error('Failed to get leave balance:', error)
    return { success: false, error: 'Failed to get leave balance' }
  }
}

/**
 * Create leave request
 */
export async function createLeaveRequest(data: LeaveRequestFormData) {
  try {
    const validated = leaveRequestSchema.parse(data)
    
    const startDate = new Date(validated.startDate)
    const endDate = new Date(validated.endDate)

    // Validate dates
    if (startDate > endDate) {
      return { success: false, error: 'End date must be after start date' }
    }

    // Calculate duration
    const duration = calculateWorkingDays(startDate, endDate)

    // Check quota for ANNUAL and MONTHLY leave types
    if (validated.leaveType === 'ANNUAL' || validated.leaveType === 'MONTHLY') {
      const balanceResult = await getLeaveBalance(validated.employeeId)
      
      if (!balanceResult.success || !balanceResult.data) {
        return { success: false, error: 'Failed to check leave balance' }
      }

      const balance = balanceResult.data
      
      if (validated.leaveType === 'ANNUAL' && duration > balance.remainingAnnual) {
        return { 
          success: false, 
          error: `Insufficient annual leave quota. You have ${balance.remainingAnnual} days remaining.` 
        }
      }

      if (validated.leaveType === 'MONTHLY' && duration > balance.remainingMonthly) {
        return { 
          success: false, 
          error: `Insufficient monthly leave quota. You have ${balance.remainingMonthly} days remaining.` 
        }
      }
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: validated.employeeId,
        leaveType: validated.leaveType,
        startDate,
        endDate,
        duration,
        reason: validated.reason,
        status: 'PENDING',
      },
      include: {
        employee: {
          include: {
            branch: true,
            position: true
          }
        }
      }
    })

    revalidatePath('/dashboard/leaves')
    return { success: true, data: leaveRequest, message: 'Leave request submitted successfully' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to create leave request:', error)
    return { success: false, error: 'Failed to create leave request' }
  }
}

/**
 * Get leave requests (filtered by employee or status)
 */
export async function getLeaveRequests(employeeId?: string, status?: string) {
  try {
    const where: any = {}
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            branch: true,
            position: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: leaveRequests }
  } catch (error) {
    console.error('Failed to fetch leave requests:', error)
    return { success: false, error: 'Failed to fetch leave requests' }
  }
}

/**
 * Approve leave request
 */
export async function approveLeaveRequest(id: string, approverId: string, notes?: string) {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id }
    })

    if (!leaveRequest) {
      return { success: false, error: 'Leave request not found' }
    }

    if (leaveRequest.status !== 'PENDING') {
      return { success: false, error: 'Leave request is not pending' }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
        notes
      },
      include: {
        employee: {
          include: {
            branch: true,
            position: true
          }
        }
      }
    })

    revalidatePath('/dashboard/leaves')
    return { success: true, data: updated, message: 'Leave request approved' }
  } catch (error) {
    console.error('Failed to approve leave request:', error)
    return { success: false, error: 'Failed to approve leave request' }
  }
}

/**
 * Reject leave request
 */
export async function rejectLeaveRequest(id: string, reason: string) {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id }
    })

    if (!leaveRequest) {
      return { success: false, error: 'Leave request not found' }
    }

    if (leaveRequest.status !== 'PENDING') {
      return { success: false, error: 'Leave request is not pending' }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        notes: reason
      },
      include: {
        employee: {
          include: {
            branch: true,
            position: true
          }
        }
      }
    })

    revalidatePath('/dashboard/leaves')
    return { success: true, data: updated, message: 'Leave request rejected' }
  } catch (error) {
    console.error('Failed to reject leave request:', error)
    return { success: false, error: 'Failed to reject leave request' }
  }
}

/**
 * Cancel leave request (by employee)
 */
export async function cancelLeaveRequest(id: string, employeeId: string) {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id }
    })

    if (!leaveRequest) {
      return { success: false, error: 'Leave request not found' }
    }

    if (leaveRequest.employeeId !== employeeId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (leaveRequest.status !== 'PENDING') {
      return { success: false, error: 'Can only cancel pending requests' }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    })

    revalidatePath('/dashboard/leaves')
    return { success: true, data: updated, message: 'Leave request cancelled' }
  } catch (error) {
    console.error('Failed to cancel leave request:', error)
    return { success: false, error: 'Failed to cancel leave request' }
  }
}
