'use client'

import { Department, Position } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PositionFormDialog } from "./position-form-dialog"
import { PositionDeleteDialog } from "./position-delete-dialog"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

type PositionWithRelations = Position & {
  department: Department
  _count: {
    employees: number
  }
}

interface PositionTableProps {
  positions: PositionWithRelations[]
  departments: Department[]
}

export function PositionTable({ positions, departments }: PositionTableProps) {
  if (positions.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No positions found. Add your first position to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Position Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell className="font-medium">{position.title}</TableCell>
              <TableCell>{position.department.name}</TableCell>
              <TableCell>{position._count.employees}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <PositionFormDialog position={position} departments={departments}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </PositionFormDialog>
                  <PositionDeleteDialog position={position} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
