'use client'

import { useState } from "react"
import { Position } from "@prisma/client"
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
import { deletePosition } from "@/lib/actions/position-actions"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface PositionDeleteDialogProps {
  position: Position & { _count: { employees: number } }
}

export function PositionDeleteDialog({ position }: PositionDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    setIsLoading(true)
    try {
      const result = await deletePosition(position.id)
      
      if (result.success) {
        toast.success('Position deleted successfully')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to delete position')
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
          <DialogTitle>Delete Position</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{position.title}</strong>?
            {position._count.employees > 0 && (
              <span className="block mt-2 text-red-500">
                This position has {position._count.employees} employee(s). 
                You must reassign them first.
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
            disabled={isLoading || position._count.employees > 0}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
