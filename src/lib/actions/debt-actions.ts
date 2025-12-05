'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { DebtorType, DebtStatus, PaymentMethod } from '@prisma/client'

/**
 * Create a new debtor
 */
export async function createDebtor(data: {
  name: string
  phone?: string
  email?: string
  address?: string
  employeeId?: string
  type: DebtorType
}) {
  try {
    const debtor = await prisma.debtor.create({
      data,
      include: {
        employee: true,
      },
    })

    revalidatePath('/dashboard/debts')
    return { success: true, data: debtor }
  } catch (error) {
    console.error('Failed to create debtor:', error)
    return { success: false, error: 'Failed to create debtor' }
  }
}

/**
 * Get all debtors with optional filters
 */
export async function getDebtors(filters?: {
  type?: DebtorType
  search?: string
}) {
  try {
    const where: any = {}
    
    if (filters?.type) {
      where.type = filters.type
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const debtors = await prisma.debtor.findMany({
      where,
      include: {
        employee: {
          include: {
            position: true,
            branch: true,
          },
        },
        debts: {
          where: {
            status: DebtStatus.ACTIVE,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate total debt and remaining for each debtor
    const debtorsWithTotals = debtors.map((debtor) => ({
      ...debtor,
      totalDebt: debtor.debts.reduce((sum, debt) => sum + debt.amount, 0),
      totalRemaining: debtor.debts.reduce((sum, debt) => sum + debt.remaining, 0),
    }))

    return { success: true, data: debtorsWithTotals }
  } catch (error) {
    console.error('Failed to fetch debtors:', error)
    return { success: false, error: 'Failed to fetch debtors' }
  }
}

/**
 * Get debtor by ID with all debts
 */
export async function getDebtorById(id: string) {
  try {
    const debtor = await prisma.debtor.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            position: true,
            branch: true,
          },
        },
        debts: {
          include: {
            payments: {
              orderBy: {
                paymentDate: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!debtor) {
      return { success: false, error: 'Debtor not found' }
    }

    return { success: true, data: debtor }
  } catch (error) {
    console.error('Failed to fetch debtor:', error)
    return { success: false, error: 'Failed to fetch debtor' }
  }
}

/**
 * Update debtor
 */
export async function updateDebtor(
  id: string,
  data: {
    name?: string
    phone?: string
    email?: string
    address?: string
  }
) {
  try {
    const debtor = await prisma.debtor.update({
      where: { id },
      data,
    })

    revalidatePath('/dashboard/debts')
    return { success: true, data: debtor }
  } catch (error) {
    console.error('Failed to update debtor:', error)
    return { success: false, error: 'Failed to update debtor' }
  }
}

/**
 * Delete debtor (cascades to debts and payments)
 */
export async function deleteDebtor(id: string) {
  try {
    await prisma.debtor.delete({
      where: { id },
    })

    revalidatePath('/dashboard/debts')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete debtor:', error)
    return { success: false, error: 'Failed to delete debtor' }
  }
}

/**
 * Create a new debt
 */
export async function createDebt(data: {
  debtorId: string
  amount: number
  description?: string
  dueDate?: Date
}) {
  try {
    const debt = await prisma.debt.create({
      data: {
        ...data,
        remaining: data.amount, // Initially, remaining equals amount
      },
      include: {
        debtor: true,
      },
    })

    revalidatePath('/dashboard/debts')
    return { success: true, data: debt }
  } catch (error) {
    console.error('Failed to create debt:', error)
    return { success: false, error: 'Failed to create debt' }
  }
}

/**
 * Get all debts with optional filters
 */
export async function getDebts(filters?: {
  debtorId?: string
  status?: DebtStatus
}) {
  try {
    const where: any = {}
    
    if (filters?.debtorId) {
      where.debtorId = filters.debtorId
    }
    
    if (filters?.status) {
      where.status = filters.status
    }

    const debts = await prisma.debt.findMany({
      where,
      include: {
        debtor: {
          include: {
            employee: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { success: true, data: debts }
  } catch (error) {
    console.error('Failed to fetch debts:', error)
    return { success: false, error: 'Failed to fetch debts' }
  }
}

/**
 * Get debt by ID
 */
export async function getDebtById(id: string) {
  try {
    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        debtor: {
          include: {
            employee: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    })

    if (!debt) {
      return { success: false, error: 'Debt not found' }
    }

    return { success: true, data: debt }
  } catch (error) {
    console.error('Failed to fetch debt:', error)
    return { success: false, error: 'Failed to fetch debt' }
  }
}

/**
 * Update debt
 */
export async function updateDebt(
  id: string,
  data: {
    amount?: number
    description?: string
    dueDate?: Date
    status?: DebtStatus
  }
) {
  try {
    const debt = await prisma.debt.update({
      where: { id },
      data,
    })

    revalidatePath('/dashboard/debts')
    return { success: true, data: debt }
  } catch (error) {
    console.error('Failed to update debt:', error)
    return { success: false, error: 'Failed to update debt' }
  }
}

/**
 * Record a payment for a debt
 */
export async function recordPayment(data: {
  debtId: string
  amount: number
  method: PaymentMethod
  notes?: string
  paymentDate?: Date
}) {
  try {
    // Get current debt
    const debt = await prisma.debt.findUnique({
      where: { id: data.debtId },
    })

    if (!debt) {
      return { success: false, error: 'Debt not found' }
    }

    // Validate payment amount
    if (data.amount > debt.remaining) {
      return { success: false, error: 'Payment amount exceeds remaining debt' }
    }

    // Create payment and update debt in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.debtPayment.create({
        data: {
          debtId: data.debtId,
          amount: data.amount,
          method: data.method,
          notes: data.notes,
          paymentDate: data.paymentDate || new Date(),
        },
      })

      // Update debt remaining
      const newRemaining = debt.remaining - data.amount
      const updatedDebt = await tx.debt.update({
        where: { id: data.debtId },
        data: {
          remaining: newRemaining,
          status: newRemaining === 0 ? DebtStatus.PAID : debt.status,
        },
      })

      return { payment, debt: updatedDebt }
    })

    revalidatePath('/dashboard/debts')
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to record payment:', error)
    return { success: false, error: 'Failed to record payment' }
  }
}

/**
 * Get debt summary statistics
 */
export async function getDebtSummary() {
  try {
    const [totalDebtors, activeDebts, totalDebtAmount, totalPaidAmount, overdueDebts] = await Promise.all([
      prisma.debtor.count(),
      prisma.debt.count({
        where: { status: DebtStatus.ACTIVE },
      }),
      prisma.debt.aggregate({
        where: { status: DebtStatus.ACTIVE },
        _sum: { amount: true },
      }),
      prisma.debt.aggregate({
        where: { status: DebtStatus.ACTIVE },
        _sum: { remaining: true },
      }),
      prisma.debt.count({
        where: {
          status: DebtStatus.ACTIVE,
          dueDate: {
            lt: new Date(),
          },
        },
      }),
    ])

    const totalDebt = totalDebtAmount._sum.amount || 0
    const totalRemaining = totalPaidAmount._sum.remaining || 0
    const totalPaid = totalDebt - totalRemaining

    return {
      success: true,
      data: {
        totalDebtors,
        activeDebts,
        totalDebt,
        totalPaid,
        totalRemaining,
        overdueDebts,
      },
    }
  } catch (error) {
    console.error('Failed to fetch debt summary:', error)
    return { success: false, error: 'Failed to fetch debt summary' }
  }
}

/**
 * Get employee debt (if employee is a debtor)
 */
export async function getEmployeeDebt(employeeId: string) {
  try {
    const debtor = await prisma.debtor.findUnique({
      where: { employeeId },
      include: {
        debts: {
          where: {
            status: DebtStatus.ACTIVE,
          },
          include: {
            payments: {
              orderBy: {
                paymentDate: 'desc',
              },
            },
          },
        },
      },
    })

    return { success: true, data: debtor }
  } catch (error) {
    console.error('Failed to fetch employee debt:', error)
    return { success: false, error: 'Failed to fetch employee debt' }
  }
}
