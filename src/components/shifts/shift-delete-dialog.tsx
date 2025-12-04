'use client'

import { useState } from "react"
import { Shift } from "@prisma/client"
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
import { deleteShift } from "@/lib/actions/shift-actions"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface ShiftDeleteDialogProps {
  shift: Shift & { _count: { schedules: number; attendances: number } }
}

export function ShiftDeleteDialog({ shift }: ShiftDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const hasUsage = shift._count.schedules > 0 || shift._count.attendances > 0

  async function handleDelete() {
    setIsLoading(true)
    try {
      const result = await deleteShift(shift.id)
      
      if (result.success) {
        toast.success('Shift deleted successfully')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to delete shift')
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
          <DialogTitle>Delete Shift</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{shift.name}</strong>?
            {hasUsage && (
              <span className="block mt-2 text-red-500">
                This shift has {shift._count.schedules} schedule(s) and {shift._count.attendances} attendance record(s). 
                You cannot delete it.
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
            disabled={isLoading || hasUsage}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
