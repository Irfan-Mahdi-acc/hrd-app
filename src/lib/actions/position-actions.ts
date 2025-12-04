'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const positionSchema = z.object({
  title: z.string().min(1, 'Position title is required'),
  departmentId: z.string().min(1, 'Department is required'),
})

export type PositionFormData = z.infer<typeof positionSchema>

export async function getPositions() {
  try {
    const positions = await prisma.position.findMany({
      include: {
        department: true,
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: positions }
  } catch (error) {
    console.error('Failed to fetch positions:', error)
    return { success: false, error: 'Failed to fetch positions' }
  }
}

export async function getPositionsByDepartment(departmentId: string) {
  try {
    const positions = await prisma.position.findMany({
      where: { departmentId },
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { title: 'asc' }
    })
    return { success: true, data: positions }
  } catch (error) {
    console.error('Failed to fetch positions:', error)
    return { success: false, error: 'Failed to fetch positions' }
  }
}

export async function createPosition(data: PositionFormData) {
  try {
    const validated = positionSchema.parse(data)
    
    const position = await prisma.position.create({
      data: validated,
      include: {
        department: true
      }
    })
    
    revalidatePath('/dashboard/departments')
    return { success: true, data: position }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to create position:', error)
    return { success: false, error: 'Failed to create position' }
  }
}

export async function updatePosition(id: string, data: PositionFormData) {
  try {
    const validated = positionSchema.parse(data)
    
    const position = await prisma.position.update({
      where: { id },
      data: validated,
      include: {
        department: true
      }
    })
    
    revalidatePath('/dashboard/departments')
    return { success: true, data: position }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to update position:', error)
    return { success: false, error: 'Failed to update position' }
  }
}

export async function deletePosition(id: string) {
  try {
    // Check if position has employees
    const employeeCount = await prisma.employee.count({
      where: { positionId: id }
    })
    
    if (employeeCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete position with ${employeeCount} employee(s). Please reassign them first.` 
      }
    }
    
    await prisma.position.delete({
      where: { id }
    })
    
    revalidatePath('/dashboard/departments')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete position:', error)
    return { success: false, error: 'Failed to delete position' }
  }
}
