'use client'

import { useState, ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { approveOvertime, rejectOvertime } from '@/lib/actions/overtime-actions'
import { toast } from 'sonner'
import { Overtime } from '@prisma/client'
import { useSession } from 'next-auth/react'

const formSchema = z.object({
  rate: z.string().min(1, 'Rate is required'),
})

interface OvertimeApprovalDialogProps {
  children: ReactNode
  overtime: Overtime
}

export function OvertimeApprovalDialog({ children, overtime }: OvertimeApprovalDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rate: '1.5',
    },
  })

  async function onApprove(values: z.infer<typeof formSchema>) {
    if (!session?.user?.id) {
      toast.error('You must be logged in')
      return
    }

    setIsLoading(true)
    try {
      const result = await approveOvertime(overtime.id, {
        rate: parseFloat(values.rate),
        approvedBy: session.user.id,
      })

      if (result.success) {
        toast.success('Overtime approved successfully')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to approve overtime')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function onReject() {
    if (!session?.user?.id) {
      toast.error('You must be logged in')
      return
    }

    setIsLoading(true)
    try {
      const result = await rejectOvertime(overtime.id, session.user.id)

      if (result.success) {
        toast.success('Overtime rejected')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to reject overtime')
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
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review Overtime Request</DialogTitle>
          <DialogDescription>
            Approve or reject this overtime request
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{overtime.duration.toFixed(1)} hours</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reason</p>
              <p className="font-medium">{overtime.reason || '-'}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onApprove)} className="space-y-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime Rate Multiplier</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="e.g., 1.5 for 1.5x" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onReject}
                  disabled={isLoading}
                >
                  Reject
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
