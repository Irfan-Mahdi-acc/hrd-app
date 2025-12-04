'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
})

export type DepartmentFormData = z.infer<typeof departmentSchema>

export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { positions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: departments }
  } catch (error) {
    console.error('Failed to fetch departments:', error)
    return { success: false, error: 'Failed to fetch departments' }
  }
}

export async function getDepartmentById(id: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        positions: true,
        _count: {
          select: { positions: true }
        }
      }
    })
    if (!department) {
      return { success: false, error: 'Department not found' }
    }
    return { success: true, data: department }
  } catch (error) {
    console.error('Failed to fetch department:', error)
    return { success: false, error: 'Failed to fetch department' }
  }
}

export async function createDepartment(data: DepartmentFormData) {
  try {
    const validated = departmentSchema.parse(data)
    
    const department = await prisma.department.create({
      data: validated
    })
    
    revalidatePath('/dashboard/departments')
    return { success: true, data: department }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to create department:', error)
    return { success: false, error: 'Failed to create department' }
  }
}

export async function updateDepartment(id: string, data: DepartmentFormData) {
  try {
    const validated = departmentSchema.parse(data)
    
    const department = await prisma.department.update({
      where: { id },
      data: validated
    })
    
    revalidatePath('/dashboard/departments')
    return { success: true, data: department }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to update department:', error)
    return { success: false, error: 'Failed to update department' }
  }
}

export async function deleteDepartment(id: string) {
  try {
    // Check if department has positions
    const positionCount = await prisma.position.count({
      where: { departmentId: id }
    })
    
    if (positionCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete department with ${positionCount} position(s). Please delete or reassign them first.` 
      }
    }
    
    await prisma.department.delete({
      where: { id }
    })
    
    revalidatePath('/dashboard/departments')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete department:', error)
    return { success: false, error: 'Failed to delete department' }
  }
}
