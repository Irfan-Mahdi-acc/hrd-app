'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const employeeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nik: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(), // ISO date string
  joinDate: z.string().min(1, 'Join date is required'), // ISO date string
  branchId: z.string().min(1, 'Branch is required'),
  positionId: z.string().min(1, 'Position is required'),
  status: z.enum(['ACTIVE', 'RESIGNED', 'TERMINATED']).default('ACTIVE'),
  annualLeaveQuota: z.number().min(0).default(12),
  monthlyLeaveQuota: z.number().min(0).default(0),
})

export type EmployeeFormData = z.infer<typeof employeeSchema>

export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        branch: true,
        position: {
          include: {
            department: true
          }
        },
        user: {
          select: {
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: employees }
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return { success: false, error: 'Failed to fetch employees' }
  }
}

export async function getEmployeeById(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        branch: true,
        position: {
          include: {
            department: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            attendances: true,
            leaves: true,
            payrolls: true
          }
        }
      }
    })
    if (!employee) {
      return { success: false, error: 'Employee not found' }
    }
    return { success: true, data: employee }
  } catch (error) {
    console.error('Failed to fetch employee:', error)
    return { success: false, error: 'Failed to fetch employee' }
  }
}

export async function getEmployeesByBranch(branchId: string) {
  try {
    const employees = await prisma.employee.findMany({
      where: { branchId },
      include: {
        position: {
          include: {
            department: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })
    return { success: true, data: employees }
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return { success: false, error: 'Failed to fetch employees' }
  }
}

export async function createEmployee(data: EmployeeFormData) {
  try {
    const validated = employeeSchema.parse(data)
    
    // Check for duplicate NIK if provided
    if (validated.nik) {
      const existing = await prisma.employee.findUnique({
        where: { nik: validated.nik }
      })
      if (existing) {
        return { success: false, error: 'NIK already exists' }
      }
    }
    
    const employee = await prisma.employee.create({
      data: {
        fullName: validated.fullName,
        nik: validated.nik || null,
        phone: validated.phone || null,
        address: validated.address || null,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
        joinDate: new Date(validated.joinDate),
        branchId: validated.branchId,
        positionId: validated.positionId,
        status: validated.status,
        annualLeaveQuota: validated.annualLeaveQuota,
        monthlyLeaveQuota: validated.monthlyLeaveQuota,
      },
      include: {
        branch: true,
        position: {
          include: {
            department: true
          }
        }
      }
    })
    
    revalidatePath('/dashboard/employees')
    return { success: true, data: employee }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to create employee:', error)
    return { success: false, error: 'Failed to create employee' }
  }
}

export async function updateEmployee(id: string, data: EmployeeFormData) {
  try {
    const validated = employeeSchema.parse(data)
    
    // Check for duplicate NIK if provided and changed
    if (validated.nik) {
      const existing = await prisma.employee.findFirst({
        where: { 
          nik: validated.nik,
          NOT: { id }
        }
      })
      if (existing) {
        return { success: false, error: 'NIK already exists' }
      }
    }
    
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        fullName: validated.fullName,
        nik: validated.nik || null,
        phone: validated.phone || null,
        address: validated.address || null,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
        joinDate: new Date(validated.joinDate),
        branchId: validated.branchId,
        positionId: validated.positionId,
        status: validated.status,
        annualLeaveQuota: validated.annualLeaveQuota,
        monthlyLeaveQuota: validated.monthlyLeaveQuota,
      },
      include: {
        branch: true,
        position: {
          include: {
            department: true
          }
        }
      }
    })
    
    revalidatePath('/dashboard/employees')
    return { success: true, data: employee }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to update employee:', error)
    return { success: false, error: 'Failed to update employee' }
  }
}

export async function deleteEmployee(id: string) {
  try {
    // Check if employee has attendance, leave, or payroll records
    const [attendanceCount, leaveCount, payrollCount] = await Promise.all([
      prisma.attendance.count({ where: { employeeId: id } }),
      prisma.leaveRequest.count({ where: { employeeId: id } }),
      prisma.payroll.count({ where: { employeeId: id } })
    ])
    
    if (attendanceCount > 0 || leaveCount > 0 || payrollCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete employee with ${attendanceCount} attendance(s), ${leaveCount} leave(s), and ${payrollCount} payroll record(s).` 
      }
    }
    
    await prisma.employee.delete({
      where: { id }
    })
    
    revalidatePath('/dashboard/employees')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete employee:', error)
    return { success: false, error: 'Failed to delete employee' }
  }
}

/**
 * Create user account for employee
 */
export async function createUserAccount(employeeId: string, email: string, password: string) {
  try {
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    })
    
    if (!employee) {
      return { success: false, error: 'Employee not found' }
    }
    
    if (employee.user) {
      return { success: false, error: 'Employee already has a user account' }
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return { success: false, error: 'Email already exists' }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user and link to employee
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        employee: {
          connect: { id: employeeId }
        }
      }
    })
    
    revalidatePath('/dashboard/employees')
    return { success: true, data: user }
  } catch (error) {
    console.error('Failed to create user account:', error)
    return { success: false, error: 'Failed to create user account' }
  }
}
