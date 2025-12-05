'use client'

import { Debtor, Employee, Position, Branch, Debt } from '@prisma/client'
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
import { Edit, Trash2 } from 'lucide-react'
import { deleteDebtor } from '@/lib/actions/debt-actions'
import { toast } from 'sonner'

type DebtorWithRelations = Debtor & {
  employee?: (Employee & {
    position: Position
    branch: Branch
  }) | null
  debts: Debt[]
  totalDebt: number
  totalRemaining: number
}

interface DebtorTableProps {
  debtors: DebtorWithRelations[]
}

export function DebtorTable({ debtors }: DebtorTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete debtor "${name}"? This will also delete all associated debts and payments.`)) {
      return
    }

    const result = await deleteDebtor(id)
    if (result.success) {
      toast.success('Debtor deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete debtor')
    }
  }

  if (debtors.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No debtors found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Total Debt</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {debtors.map((debtor) => (
            <TableRow key={debtor.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{debtor.name}</div>
                  {debtor.employee && (
                    <div className="text-sm text-muted-foreground">
                      {debtor.employee.position.title} - {debtor.employee.branch.name}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={debtor.type === 'EMPLOYEE' ? 'default' : 'secondary'}>
                  {debtor.type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {debtor.phone && <div>{debtor.phone}</div>}
                  {debtor.email && <div className="text-muted-foreground">{debtor.email}</div>}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(debtor.totalDebt)}
              </TableCell>
              <TableCell className="text-right">
                <span className={debtor.totalRemaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {formatCurrency(debtor.totalRemaining)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" disabled>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(debtor.id, debtor.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
