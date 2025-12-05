'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'

interface OvertimeSummaryCardsProps {
  summary: {
    total: number
    pending: number
    approved: number
    rejected: number
    totalHours: number
    totalAmount: number
  }
}

export function OvertimeSummaryCards({ summary }: OvertimeSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.pending}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting approval
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.approved}</div>
          <p className="text-xs text-muted-foreground">
            {summary.totalHours.toFixed(1)} hours total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
          <p className="text-xs text-muted-foreground">
            Approved overtime pay
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.rejected}</div>
          <p className="text-xs text-muted-foreground">
            Not approved
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
