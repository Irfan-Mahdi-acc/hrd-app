'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface LeaveBalanceCardProps {
  balance: {
    annualLeaveQuota: number
    monthlyLeaveQuota: number
    usedAnnual: number
    usedMonthly: number
    remainingAnnual: number
    remainingMonthly: number
  }
}

export function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
  const annualPercentage = (balance.usedAnnual / balance.annualLeaveQuota) * 100
  const monthlyPercentage = balance.monthlyLeaveQuota > 0 
    ? (balance.usedMonthly / balance.monthlyLeaveQuota) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balance</CardTitle>
        <CardDescription>Your remaining leave quota</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Annual Leave</span>
            <span className="text-sm text-muted-foreground">
              {balance.remainingAnnual} / {balance.annualLeaveQuota} days
            </span>
          </div>
          <Progress value={annualPercentage} className="h-2" />
        </div>

        {balance.monthlyLeaveQuota > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Monthly Leave</span>
              <span className="text-sm text-muted-foreground">
                {balance.remainingMonthly} / {balance.monthlyLeaveQuota} days
              </span>
            </div>
            <Progress value={monthlyPercentage} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
