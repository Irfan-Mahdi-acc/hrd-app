'use client'

import { Overtime, Employee, Position, Branch } from '@prisma/client'
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
import { CheckCircle, XCircle } from 'lucide-react'
import { OvertimeApprovalDialog } from './overtime-approval-dialog'

type OvertimeWithRelations = Overtime & {
  employee: Employee & {
    position: Position
    branch: Branch
  }
}

interface OvertimeTableProps {
  overtimes: OvertimeWithRelations[]
}

export function OvertimeTable({ overtimes }: OvertimeTableProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-orange-50">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="default">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (overtimes.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No overtime requests found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {overtimes.map((overtime) => (
            <TableRow key={overtime.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{overtime.employee.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    {overtime.employee.position.title}
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatDate(overtime.date)}</TableCell>
              <TableCell>
                {formatTime(overtime.startTime)} - {formatTime(overtime.endTime)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {overtime.duration.toFixed(1)}h
              </TableCell>
              <TableCell>{overtime.reason || '-'}</TableCell>
              <TableCell className="text-right">
                {overtime.amount ? formatCurrency(overtime.amount) : '-'}
              </TableCell>
              <TableCell>{getStatusBadge(overtime.status)}</TableCell>
              <TableCell className="text-right">
                {overtime.status === 'PENDING' && (
                  <OvertimeApprovalDialog overtime={overtime}>
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </OvertimeApprovalDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
