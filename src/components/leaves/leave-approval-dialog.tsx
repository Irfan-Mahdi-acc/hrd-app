'use client'

import { useState } from 'react'
import { LeaveRequest, Employee, Branch, Position } from "@prisma/client"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { approveLeaveRequest, rejectLeaveRequest } from "@/lib/actions/leave-actions"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

type LeaveRequestWithRelations = LeaveRequest & {
  employee: Employee & {
    branch: Branch
    position: Position
  }
}

interface LeaveApprovalDialogProps {
  leaveRequest: LeaveRequestWithRelations
  approverId: string
}

export function LeaveApprovalDialog({ leaveRequest, approverId }: LeaveApprovalDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [notes, setNotes] = useState('')

  async function handleApprove() {
    setIsLoading(true)
    try {
      const result = await approveLeaveRequest(leaveRequest.id, approverId, notes)
      
      if (result.success) {
        toast.success('Leave request approved')
        setOpen(false)
        setNotes('')
      } else {
        toast.error(result.error || 'Failed to approve')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReject() {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setIsLoading(true)
    try {
      const result = await rejectLeaveRequest(leaveRequest.id, notes)
      
      if (result.success) {
        toast.success('Leave request rejected')
        setOpen(false)
        setNotes('')
      } else {
        toast.error(result.error || 'Failed to reject')
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
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="default"
            onClick={() => {
              setAction('approve')
              setOpen(true)
            }}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => {
              setAction('reject')
              setOpen(true)
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? 'Approve' : 'Reject'} Leave Request
          </DialogTitle>
          <DialogDescription>
            {leaveRequest.employee.fullName} - {leaveRequest.leaveType}
            <br />
            {new Date(leaveRequest.startDate).toLocaleDateString()} - {new Date(leaveRequest.endDate).toLocaleDateString()}
            ({leaveRequest.duration} days)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reason</Label>
            <p className="text-sm text-muted-foreground mt-1">{leaveRequest.reason}</p>
          </div>

          <div>
            <Label htmlFor="notes">
              {action === 'approve' ? 'Notes (Optional)' : 'Rejection Reason *'}
            </Label>
            <Textarea
              id="notes"
              placeholder={action === 'approve' ? 'Add any notes...' : 'Please provide a reason for rejection'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={action === 'approve' ? 'default' : 'destructive'}
            onClick={action === 'approve' ? handleApprove : handleReject}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
