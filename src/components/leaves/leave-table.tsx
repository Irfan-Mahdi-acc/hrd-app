'use client'

import { LeaveRequest, Employee, Branch, Position } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LeaveApprovalDialog } from "./leave-approval-dialog"
import { Check, X } from "lucide-react"

type LeaveRequestWithRelations = LeaveRequest & {
  employee: Employee & {
    branch: Branch
    position: Position
  }
}

interface LeaveTableProps {
  leaveRequests: LeaveRequestWithRelations[]
  isAdmin: boolean
  currentUserId: string
}

export function LeaveTable({ leaveRequests, isAdmin, currentUserId }: LeaveTableProps) {
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
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="default">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLeaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ANNUAL: 'bg-blue-500',
      SICK: 'bg-red-500',
      MONTHLY_OFF: 'bg-green-500',
      UNPAID: 'bg-gray-500',
      OTHER: 'bg-orange-500',
    }

    return (
      <Badge className={colors[type] || 'bg-gray-500'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const calculateDuration = (startDate: Date, endDate: Date) => {
    let count = 0
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const day = current.getDay()
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (day !== 0 && day !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  if (leaveRequests.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No leave requests found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {isAdmin && <TableHead>Employee</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveRequests.map((request) => (
            <TableRow key={request.id}>
              {isAdmin && (
                <TableCell className="font-medium">
                  <div>
                    <div>{request.employee.fullName}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.employee.position.title}
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell>{getLeaveTypeBadge(request.type)}</TableCell>
              <TableCell>{formatDate(request.startDate)}</TableCell>
              <TableCell>{formatDate(request.endDate)}</TableCell>
              <TableCell>{calculateDuration(request.startDate, request.endDate)} days</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  {request.status === 'PENDING' && (
                    <LeaveApprovalDialog 
                      leaveRequest={request}
                      approverId={currentUserId}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
