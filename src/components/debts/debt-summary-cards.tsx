'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react'

interface DebtSummaryCardsProps {
  summary: {
    totalDebtors: number
    activeDebts: number
    totalDebt: number
    totalPaid: number
    totalRemaining: number
    overdueDebts: number
  }
}

export function DebtSummaryCards({ summary }: DebtSummaryCardsProps) {
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
          <CardTitle className="text-sm font-medium">Total Debtors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalDebtors}</div>
          <p className="text-xs text-muted-foreground">
            {summary.activeDebts} active debts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
          <Wallet className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalDebt)}</div>
          <p className="text-xs text-muted-foreground">
            Outstanding amount
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</div>
          <p className="text-xs text-muted-foreground">
            {summary.totalDebt > 0 ? ((summary.totalPaid / summary.totalDebt) * 100).toFixed(1) : 0}% collected
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Debts</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.overdueDebts}</div>
          <p className="text-xs text-muted-foreground">
            Needs attention
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
