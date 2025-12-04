'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(10000).default(50),
  timezone: z.string().default('Asia/Jakarta'),
})

export type BranchFormData = z.infer<typeof branchSchema>

export async function getBranches() {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: branches }
  } catch (error) {
    console.error('Failed to fetch branches:', error)
    return { success: false, error: 'Failed to fetch branches' }
  }
}

export async function getBranchById(id: string) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    })
    if (!branch) {
      return { success: false, error: 'Branch not found' }
    }
    return { success: true, data: branch }
  } catch (error) {
    console.error('Failed to fetch branch:', error)
    return { success: false, error: 'Failed to fetch branch' }
  }
}

export async function createBranch(data: BranchFormData) {
  try {
    const validated = branchSchema.parse(data)
    
    const branch = await prisma.branch.create({
      data: validated
    })
    
    revalidatePath('/dashboard/branches')
    return { success: true, data: branch }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Failed to create branch:', error)
    return { success: false, error: 'Failed to create branch' }
  }
}

export async function updateBranch(id: string, data: BranchFormData) {
  try {
    const validated = branchSchema.parse(data)
    
    const branch = await prisma.branch.update({
      where: { id },
      data: validated
    })
    
    revalidatePath('/dashboard/branches')
    return { success: true, data: branch }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Failed to update branch:', error)
    return { success: false, error: 'Failed to update branch' }
  }
}

export async function deleteBranch(id: string) {
  try {
    // Check if branch has employees
    const employeeCount = await prisma.employee.count({
      where: { branchId: id }
    })
    
    if (employeeCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete branch with ${employeeCount} employee(s). Please reassign them first.` 
      }
    }
    
    await prisma.branch.delete({
      where: { id }
    })
    
    revalidatePath('/dashboard/branches')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete branch:', error)
    return { success: false, error: 'Failed to delete branch' }
  }
}
