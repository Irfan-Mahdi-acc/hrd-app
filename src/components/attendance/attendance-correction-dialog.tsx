'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { correctAttendance } from '@/lib/actions/attendance-actions'
import { toast } from 'sonner'
import { Edit } from 'lucide-react'
import { Attendance, Employee, Branch, Position, Shift } from '@prisma/client'

const formSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'SICK', 'PERMISSION', 'LEAVE']),
  notes: z.string().optional(),
})

type AttendanceWithRelations = Attendance & {
  shift: Shift | null
  employee: Employee & {
    branch: Branch
    position: Position
  }
}

interface AttendanceCorrectionDialogProps {
  attendance: AttendanceWithRelations
}

export function AttendanceCorrectionDialog({ attendance }: AttendanceCorrectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkIn: attendance.checkIn 
        ? new Date(attendance.checkIn).toISOString().slice(0, 16) 
        : '',
      checkOut: attendance.checkOut 
        ? new Date(attendance.checkOut).toISOString().slice(0, 16) 
        : '',
      status: attendance.status,
      notes: attendance.notes || '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const result = await correctAttendance(attendance.id, {
        checkIn: values.checkIn ? new Date(values.checkIn) : undefined,
        checkOut: values.checkOut ? new Date(values.checkOut) : undefined,
        status: values.status,
        notes: values.notes,
      })

      if (result.success) {
        toast.success(result.message || 'Attendance corrected successfully')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to correct attendance')
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
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Correct Attendance</DialogTitle>
          <DialogDescription>
            Manually correct attendance record for {attendance.employee.fullName}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="checkIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-in Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkOut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-out Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="SICK">Sick</SelectItem>
                      <SelectItem value="PERMISSION">Permission</SelectItem>
                      <SelectItem value="LEAVE">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add correction notes (optional)" 
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
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Correction'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
