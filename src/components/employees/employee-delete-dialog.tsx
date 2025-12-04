'use client'

import { useState } from "react"
import { Employee } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteEmployee } from "@/lib/actions/employee-actions"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface EmployeeDeleteDialogProps {
  employee: Employee
}

export function EmployeeDeleteDialog({ employee }: EmployeeDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    setIsLoading(true)
    try {
      const result = await deleteEmployee(employee.id)
      
      if (result.success) {
        toast.success('Employee deleted successfully')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to delete employee')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Employee</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{employee.fullName}</strong>?
            <span className="block mt-2 text-red-500">
              This action cannot be undone if the employee has attendance, leave, or payroll records.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
