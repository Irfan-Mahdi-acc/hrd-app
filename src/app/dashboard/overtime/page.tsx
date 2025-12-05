import { Suspense } from 'react'
import { getOvertimeRequests, getOvertimeSummary } from '@/lib/actions/overtime-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OvertimeTable } from '@/components/overtime/overtime-table'
import { OvertimeSummaryCards } from '@/components/overtime/overtime-summary-cards'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { OvertimeRequestForm } from '@/components/overtime/overtime-request-form'

export default async function OvertimePage() {
  const [requestsResult, summaryResult] = await Promise.all([
    getOvertimeRequests(),
    getOvertimeSummary(),
  ])

  if (!requestsResult.success || !summaryResult.success) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <p className="text-muted-foreground">Failed to load overtime data</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overtime Management</h1>
          <p className="text-muted-foreground">
            Track and approve overtime requests
          </p>
        </div>
        <OvertimeRequestForm>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Request Overtime
          </Button>
        </OvertimeRequestForm>
      </div>

      <OvertimeSummaryCards summary={summaryResult.data} />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Suspense fallback={<div>Loading...</div>}>
            <OvertimeTable overtimes={requestsResult.data} />
          </Suspense>
        </TabsContent>

        <TabsContent value="pending">
          <Suspense fallback={<div>Loading...</div>}>
            <OvertimeTable 
              overtimes={requestsResult.data.filter(ot => ot.status === 'PENDING')} 
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="approved">
          <Suspense fallback={<div>Loading...</div>}>
            <OvertimeTable 
              overtimes={requestsResult.data.filter(ot => ot.status === 'APPROVED')} 
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
