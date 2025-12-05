import { Suspense } from 'react'
import { getDebtSummary, getDebtors, getDebts } from '@/lib/actions/debt-actions'
import { DebtSummaryCards } from '@/components/debts/debt-summary-cards'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DebtorTable } from '@/components/debts/debtor-table'
import { DebtTable } from '@/components/debts/debt-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DebtorFormDialog } from '@/components/debts/debtor-form-dialog'
import { DebtFormDialog } from '@/components/debts/debt-form-dialog'

export default async function DebtsPage() {
  const [summaryResult, debtorsResult, debtsResult] = await Promise.all([
    getDebtSummary(),
    getDebtors(),
    getDebts(),
  ])

  if (!summaryResult.success || !debtorsResult.success || !debtsResult.success) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <p className="text-muted-foreground">Failed to load debt data</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Debt Management</h1>
        <p className="text-muted-foreground">
          Track and manage debts for employees and external parties
        </p>
      </div>

      <DebtSummaryCards summary={summaryResult.data} />

      <Tabs defaultValue="debtors" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="debtors">Debtors</TabsTrigger>
            <TabsTrigger value="debts">Debts</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <DebtorFormDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Debtor
              </Button>
            </DebtorFormDialog>
            <DebtFormDialog debtors={debtorsResult.data}>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Debt
              </Button>
            </DebtFormDialog>
          </div>
        </div>

        <TabsContent value="debtors" className="space-y-4">
          <Suspense fallback={<div>Loading debtors...</div>}>
            <DebtorTable debtors={debtorsResult.data} />
          </Suspense>
        </TabsContent>

        <TabsContent value="debts" className="space-y-4">
          <Suspense fallback={<div>Loading debts...</div>}>
            <DebtTable debts={debtsResult.data} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
