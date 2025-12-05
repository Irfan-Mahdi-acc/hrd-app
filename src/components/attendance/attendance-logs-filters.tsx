'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'

export function AttendanceLogsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  const handleFilter = () => {
    const params = new URLSearchParams()
    
    if (status && status !== 'ALL') params.set('status', status)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    
    router.push(`?${params.toString()}`)
  }

  const handleReset = () => {
    setStatus('ALL')
    setStartDate('')
    setEndDate('')
    router.push('/dashboard/attendance/logs')
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="SICK">Sick</SelectItem>
                <SelectItem value="PERMISSION">Permission</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleFilter} className="flex-1">
              <Search className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button onClick={handleReset} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
