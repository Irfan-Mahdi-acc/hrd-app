'use client'

import { Debt, Debtor, Employee, DebtPayment } from '@prisma/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign } from 'lucide-react'
import { PaymentDialog } from './payment-dialog'

type DebtWithRelations = Debt & {
  debtor: Debtor & {
    employee?: Employee | null
  }
  payments: DebtPayment[]
}

interface DebtTableProps {
  debts: DebtWithRelations[]
}

export function DebtTable({ debts }: DebtTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="destructive">Active</Badge>
      case 'PAID':
        return <Badge variant="default">Paid</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (debts.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No debts found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Debtor</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {debts.map((debt) => {
            const totalPaid = debt.amount - debt.remaining
            const progress = (totalPaid / debt.amount) * 100

            return (
              <TableRow key={debt.id}>
                <TableCell className="font-medium">
                  {debt.debtor.name}
                </TableCell>
                <TableCell>{debt.description || '-'}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(debt.amount)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(totalPaid)}
                  <div className="text-xs text-muted-foreground">
                    {progress.toFixed(0)}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={debt.remaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {formatCurrency(debt.remaining)}
                  </span>
                </TableCell>
                <TableCell>{formatDate(debt.dueDate)}</TableCell>
                <TableCell>{getStatusBadge(debt.status)}</TableCell>
                <TableCell className="text-right">
                  {debt.status === 'ACTIVE' && debt.remaining > 0 && (
                    <PaymentDialog debt={debt}>
                      <Button variant="outline" size="sm">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    </PaymentDialog>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
