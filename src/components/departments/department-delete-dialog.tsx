'use client'

import { useState } from "react"
import { Department } from "@prisma/client"
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
import { deleteDepartment } from "@/lib/actions/department-actions"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface DepartmentDeleteDialogProps {
  department: Department & { _count: { positions: number } }
}

export function DepartmentDeleteDialog({ department }: DepartmentDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    setIsLoading(true)
    try {
      const result = await deleteDepartment(department.id)
      
      if (result.success) {
        toast.success('Department deleted successfully')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to delete department')
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
          <DialogTitle>Delete Department</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{department.name}</strong>?
            {department._count.positions > 0 && (
              <span className="block mt-2 text-red-500">
                This department has {department._count.positions} position(s). 
                You must delete them first.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading || department._count.positions > 0}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
