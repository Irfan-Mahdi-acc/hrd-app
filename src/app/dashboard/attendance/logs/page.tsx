import { Suspense } from 'react'
import { getAttendanceLogsWithFilters, getAttendanceStats } from '@/lib/actions/attendance-actions'
import { AttendanceStatsCard } from '@/components/attendance/attendance-stats-card'
import { AttendanceLogsTable } from '@/components/attendance/attendance-logs-table'
import { AttendanceLogsFilters } from '@/components/attendance/attendance-logs-filters'

interface SearchParams {
  branchId?: string
  employeeId?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: string
}

export default async function AttendanceLogsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = parseInt(searchParams.page || '1')
  const filters = {
    branchId: searchParams.branchId,
    employeeId: searchParams.employeeId,
    status: searchParams.status,
    startDate: searchParams.startDate ? new Date(searchParams.startDate) : undefined,
    endDate: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
    page,
    limit: 50,
  }

  const [logsResult, statsResult] = await Promise.all([
    getAttendanceLogsWithFilters(filters),
    getAttendanceStats({
      branchId: filters.branchId,
      employeeId: filters.employeeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
  ])

  if (!logsResult.success || !statsResult.success) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <p className="text-muted-foreground">Failed to load attendance logs</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Logs</h1>
        <p className="text-muted-foreground">
          View and manage attendance records with advanced filtering
        </p>
      </div>

      {statsResult.data && <AttendanceStatsCard stats={statsResult.data} />}

      <Suspense fallback={<div>Loading filters...</div>}>
        <AttendanceLogsFilters />
      </Suspense>

      <AttendanceLogsTable 
        attendances={logsResult.data || []} 
        pagination={logsResult.pagination}
      />
    </div>
  )
}
