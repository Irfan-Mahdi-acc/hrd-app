'use client'

import { Attendance, Shift, Employee, Branch, Position } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AttendanceCorrectionDialog } from "./attendance-correction-dialog"
import { calculateWorkHours } from "@/lib/utils/attendance-utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useRouter, useSearchParams } from "next/navigation"

type AttendanceWithRelations = Attendance & {
  shift: Shift | null
  employee: Employee & {
    branch: Branch
    position: Position
  }
}

interface AttendanceLogsTableProps {
  attendances: AttendanceWithRelations[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function AttendanceLogsTable({ attendances, pagination }: AttendanceLogsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const formatTime = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="default">Present</Badge>
      case 'LATE':
        return <Badge variant="destructive">Late</Badge>
      case 'ABSENT':
        return <Badge variant="secondary">Absent</Badge>
      case 'SICK':
        return <Badge variant="outline">Sick</Badge>
      case 'PERMISSION':
        return <Badge variant="outline">Permission</Badge>
      case 'LEAVE':
        return <Badge variant="outline">Leave</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GPS':
        return <Badge variant="outline" className="bg-blue-50">GPS</Badge>
      case 'FINGERPRINT':
        return <Badge variant="outline" className="bg-green-50">Fingerprint</Badge>
      case 'MANUAL':
        return <Badge variant="outline" className="bg-orange-50">Manual</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  if (attendances.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No attendance records found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances.map((attendance) => {
              const workHours = attendance.checkOut 
                ? calculateWorkHours(attendance.checkIn!, attendance.checkOut)
                : 0

              return (
                <TableRow key={attendance.id}>
                  <TableCell>{formatDate(attendance.date)}</TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div>{attendance.employee.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {attendance.employee.position.title}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{attendance.employee.branch.name}</TableCell>
                  <TableCell>{formatTime(attendance.checkIn)}</TableCell>
                  <TableCell>{formatTime(attendance.checkOut)}</TableCell>
                  <TableCell>
                    {workHours > 0 ? `${workHours.toFixed(1)}h` : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                  <TableCell>{getMethodBadge(attendance.method)}</TableCell>
                  <TableCell>
                    <AttendanceCorrectionDialog attendance={attendance} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                size="default"
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={pagination.page === pageNum}
                    className="cursor-pointer"
                    size="icon"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            
            {pagination.totalPages > 5 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                size="default"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
