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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createOvertimeRequest } from '@/lib/actions/overtime-actions'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

const formSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  reason: z.string().optional(),
})

interface OvertimeRequestFormProps {
  children: ReactNode
}

export function OvertimeRequestForm({ children }: OvertimeRequestFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      reason: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session?.user?.id) {
      toast.error('You must be logged in')
      return
    }

    setIsLoading(true)
    try {
      const date = new Date(values.date)
      const startTime = new Date(`${values.date}T${values.startTime}`)
      const endTime = new Date(`${values.date}T${values.endTime}`)

      const result = await createOvertimeRequest({
        employeeId: session.user.id,
        date,
        startTime,
        endTime,
        reason: values.reason,
      })

      if (result.success) {
        toast.success('Overtime request submitted successfully')
        setOpen(false)
        form.reset()
      } else {
        toast.error(result.error || 'Failed to submit request')
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
          <DialogTitle>Request Overtime</DialogTitle>
          <DialogDescription>
            Submit an overtime request for approval
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter reason for overtime" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
