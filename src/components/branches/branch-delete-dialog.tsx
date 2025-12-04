'use client'

import { useState } from "react"
import { Branch } from "@prisma/client"
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
import { deleteBranch } from "@/lib/actions/branch-actions"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface BranchDeleteDialogProps {
  branch: Branch & { _count: { employees: number } }
}

export function BranchDeleteDialog({ branch }: BranchDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    setIsLoading(true)
    try {
      const result = await deleteBranch(branch.id)
      
      if (result.success) {
        toast.success('Branch deleted successfully')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to delete branch')
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
          <DialogTitle>Delete Branch</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{branch.name}</strong>?
            {branch._count.employees > 0 && (
              <span className="block mt-2 text-red-500">
                This branch has {branch._count.employees} employee(s). 
                You must reassign them before deleting.
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
            disabled={isLoading || branch._count.employees > 0}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
