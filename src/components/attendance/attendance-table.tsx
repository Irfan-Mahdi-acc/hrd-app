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
import { calculateWorkHours } from "@/lib/utils/attendance-utils"

type AttendanceWithRelations = Attendance & {
  shift: Shift | null
  employee: Employee & {
    branch: Branch
    position: Position
  }
}

interface AttendanceTableProps {
  attendances: AttendanceWithRelations[]
  branches: Branch[]
}

export function AttendanceTable({ attendances, branches }: AttendanceTableProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
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

  if (attendances.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No attendance records for today.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Shift</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendances.map((attendance) => {
            const workHours = attendance.checkOut 
              ? calculateWorkHours(attendance.checkIn!, attendance.checkOut)
              : 0

            return (
              <TableRow key={attendance.id}>
                <TableCell className="font-medium">
                  {attendance.employee.fullName}
                </TableCell>
                <TableCell>{attendance.employee.branch.name}</TableCell>
                <TableCell>{attendance.employee.position.title}</TableCell>
                <TableCell>{formatTime(attendance.checkIn)}</TableCell>
                <TableCell>{formatTime(attendance.checkOut)}</TableCell>
                <TableCell>
                  {attendance.shift ? attendance.shift.name : '-'}
                </TableCell>
                <TableCell>
                  {workHours > 0 ? `${workHours.toFixed(1)}h` : '-'}
                </TableCell>
                <TableCell>{getStatusBadge(attendance.status)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
