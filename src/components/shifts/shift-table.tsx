'use client'

import { Shift } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShiftFormDialog } from "./shift-form-dialog"
import { ShiftDeleteDialog } from "./shift-delete-dialog"
import { Button } from "@/components/ui/button"
import { Pencil, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ShiftWithCount = Shift & {
  _count: {
    schedules: number
    attendances: number
  }
}

interface ShiftTableProps {
  shifts: ShiftWithCount[]
}

export function ShiftTable({ shifts }: ShiftTableProps) {
  if (shifts.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No shifts found. Add your first shift to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shift Name</TableHead>
            <TableHead>Time Range</TableHead>
            <TableHead>Break</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => (
            <TableRow key={shift.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {shift.color && (
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: shift.color }}
                    />
                  )}
                  {shift.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {shift.startTime} - {shift.endTime}
                </div>
              </TableCell>
              <TableCell>
                {shift.breakMinutes > 0 ? `${shift.breakMinutes} min` : '-'}
              </TableCell>
              <TableCell>
                {shift.isOvernight ? (
                  <Badge variant="secondary">Overnight</Badge>
                ) : (
                  <Badge variant="outline">Regular</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {shift._count.attendances} attendance(s)
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <ShiftFormDialog shift={shift}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </ShiftFormDialog>
                  <ShiftDeleteDialog shift={shift} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
