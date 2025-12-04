'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Calculate PPh 21 (Income Tax) - Simplified Indonesian tax calculation
 */
export function calculateTax(grossSalary: number): number {
  const yearlyGross = grossSalary * 12
  const ptkp = 54000000 // PTKP for single (TK/0)
  const taxableIncome = Math.max(0, yearlyGross - ptkp)
  
  let yearlyTax = 0
  
  if (taxableIncome <= 60000000) {
    yearlyTax = taxableIncome * 0.05
  } else if (taxableIncome <= 250000000) {
    yearlyTax = 60000000 * 0.05 + (taxableIncome - 60000000) * 0.15
  } else if (taxableIncome <= 500000000) {
    yearlyTax = 60000000 * 0.05 + 190000000 * 0.15 + (taxableIncome - 250000000) * 0.25
  } else {
    yearlyTax = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + (taxableIncome - 500000000) * 0.30
  }
  
  return Math.round(yearlyTax / 12) // Monthly tax
}

/**
 * Calculate BPJS Kesehatan (Health Insurance)
 */
export function calculateBPJSKesehatan(basicSalary: number): { employee: number; employer: number } {
  const maxSalary = 12000000 // Maximum salary for BPJS calculation
  const baseSalary = Math.min(basicSalary, maxSalary)
  
  return {
    employee: Math.round(baseSalary * 0.01), // 1% employee
    employer: Math.round(baseSalary * 0.04)  // 4% employer
  }
}

/**
 * Calculate BPJS Ketenagakerjaan (Employment Insurance)
 */
export function calculateBPJSKetenagakerjaan(basicSalary: number): { employee: number; employer: number } {
  const maxSalary = 12000000
  const baseSalary = Math.min(basicSalary, maxSalary)
  
  return {
    employee: Math.round(baseSalary * 0.02), // 2% employee (JHT)
    employer: Math.round(baseSalary * 0.0524) // 5.24% employer (JHT + JKK + JKM)
  }
}

/**
 * Generate payroll for a single employee
 */
export async function generatePayroll(employeeId: string, month: number, year: number) {
  try {
    // Check if payroll already exists
    const existing = await prisma.payroll.findFirst({
      where: {
        employeeId,
        month,
        year
      }
    })

    if (existing) {
      return { success: false, error: 'Payroll already exists for this period' }
    }

    // Get employee with position
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        position: true,
        branch: true
      }
    })

    if (!employee) {
      return { success: false, error: 'Employee not found' }
    }

    // Get attendance data for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate attendance metrics
    const presentDays = attendances.filter(a => a.status === 'PRESENT').length
    const lateDays = attendances.filter(a => a.status === 'LATE').length
    const absentDays = attendances.filter(a => a.status === 'ABSENT').length

    // Calculate salary components
    const basicSalary = employee.position.baseSalary || 5000000 // Default if not set
    const positionAllowance = employee.position.allowance || 0
    const transportAllowance = 500000 // Fixed transport allowance
    const mealAllowance = presentDays * 50000 // Rp 50k per present day
    
    // Calculate overtime (simplified - would need actual overtime records)
    const overtimeHours = 0 // TODO: Get from overtime records
    const overtimePay = overtimeHours * (basicSalary / 173) * 1.5

    const grossSalary = basicSalary + positionAllowance + transportAllowance + mealAllowance + overtimePay

    // Calculate deductions
    const tax = calculateTax(grossSalary)
    const bpjsKesehatan = calculateBPJSKesehatan(basicSalary)
    const bpjsKetenagakerjaan = calculateBPJSKetenagakerjaan(basicSalary)
    
    const lateDeduction = lateDays * 50000 // Rp 50k per late
    const absentDeduction = absentDays * (basicSalary / 30) // Pro-rated daily salary

    const totalDeductions = tax + bpjsKesehatan.employee + bpjsKetenagakerjaan.employee + 
                           lateDeduction + absentDeduction

    const netSalary = grossSalary - totalDeductions

    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        month,
        year,
        basicSalary,
        allowances: positionAllowance + transportAllowance + mealAllowance,
        overtime: overtimePay,
        grossSalary,
        tax,
        bpjsKesehatan: bpjsKesehatan.employee,
        bpjsKetenagakerjaan: bpjsKetenagakerjaan.employee,
        otherDeductions: lateDeduction + absentDeduction,
        totalDeductions,
        netSalary,
        status: 'PENDING'
      },
      include: {
        employee: {
          include: {
            branch: true,
            position: {
              include: {
                department: true
              }
            }
          }
        }
      }
    })

    revalidatePath('/dashboard/payroll')
    return { success: true, data: payroll, message: 'Payroll generated successfully' }
  } catch (error) {
    console.error('Failed to generate payroll:', error)
    return { success: false, error: 'Failed to generate payroll' }
  }
}

/**
 * Generate payroll for all active employees
 */
export async function generateBulkPayroll(month: number, year: number) {
  try {
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' }
    })

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const employee of employees) {
      const result = await generatePayroll(employee.id, month, year)
      results.push({ employeeId: employee.id, result })
      
      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
    }

    revalidatePath('/dashboard/payroll')
    return { 
      success: true, 
      message: `Generated ${successCount} payrolls, ${errorCount} errors`,
      data: { successCount, errorCount, results }
    }
  } catch (error) {
    console.error('Failed to generate bulk payroll:', error)
    return { success: false, error: 'Failed to generate bulk payroll' }
  }
}

/**
 * Get payroll records
 */
export async function getPayrollByPeriod(month: number, year: number) {
  try {
    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: {
        employee: {
          include: {
            branch: true,
            position: {
              include: {
                department: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: payrolls }
  } catch (error) {
    console.error('Failed to fetch payroll:', error)
    return { success: false, error: 'Failed to fetch payroll' }
  }
}

/**
 * Get payroll for employee
 */
export async function getPayrollByEmployee(employeeId: string, month?: number, year?: number) {
  try {
    const where: any = { employeeId }
    
    if (month && year) {
      where.month = month
      where.year = year
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    return { success: true, data: payrolls }
  } catch (error) {
    console.error('Failed to fetch payroll:', error)
    return { success: false, error: 'Failed to fetch payroll' }
  }
}

/**
 * Approve payroll
 */
export async function approvePayroll(id: string) {
  try {
    const payroll = await prisma.payroll.update({
      where: { id },
      data: {
        status: 'APPROVED',
        paidAt: new Date()
      }
    })

    revalidatePath('/dashboard/payroll')
    return { success: true, data: payroll, message: 'Payroll approved' }
  } catch (error) {
    console.error('Failed to approve payroll:', error)
    return { success: false, error: 'Failed to approve payroll' }
  }
}

/**
 * Delete payroll (only if pending)
 */
export async function deletePayroll(id: string) {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id }
    })

    if (!payroll) {
      return { success: false, error: 'Payroll not found' }
    }

    if (payroll.status !== 'PENDING') {
      return { success: false, error: 'Can only delete pending payroll' }
    }

    await prisma.payroll.delete({
      where: { id }
    })

    revalidatePath('/dashboard/payroll')
    return { success: true, message: 'Payroll deleted' }
  } catch (error) {
    console.error('Failed to delete payroll:', error)
    return { success: false, error: 'Failed to delete payroll' }
  }
}
