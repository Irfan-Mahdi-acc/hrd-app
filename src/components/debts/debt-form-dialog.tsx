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
import { createDebt } from '@/lib/actions/debt-actions'
import { toast } from 'sonner'

const formSchema = z.object({
  debtorId: z.string().min(1, 'Debtor is required'),
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
})

interface DebtFormDialogProps {
  children: ReactNode
  debtors: any[]
}

export function DebtFormDialog({ children, debtors }: DebtFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      debtorId: '',
      amount: '',
      description: '',
      dueDate: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const result = await createDebt({
        debtorId: values.debtorId,
        amount: parseFloat(values.amount),
        description: values.description,
        dueDate: values.dueDate ? new Date(values.dueDate) : undefined,
      })

      if (result.success) {
        toast.success('Debt created successfully')
        setOpen(false)
        form.reset()
      } else {
        toast.error(result.error || 'Failed to create debt')
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
          <DialogTitle>Add New Debt</DialogTitle>
          <DialogDescription>
            Create a new debt record for a debtor
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="debtorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debtor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select debtor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {debtors.map((debtor) => (
                        <SelectItem key={debtor.id} value={debtor.id}>
                          {debtor.name} ({debtor.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (IDR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                {isLoading ? 'Creating...' : 'Create Debt'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
