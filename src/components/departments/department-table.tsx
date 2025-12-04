'use client'

import { Department } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DepartmentFormDialog } from "./department-form-dialog"
import { DepartmentDeleteDialog } from "./department-delete-dialog"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

type DepartmentWithCount = Department & {
  _count: {
    positions: number
  }
}

interface DepartmentTableProps {
  departments: DepartmentWithCount[]
}

export function DepartmentTable({ departments }: DepartmentTableProps) {
  if (departments.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No departments found. Add your first department to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department Name</TableHead>
            <TableHead>Positions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell className="font-medium">{department.name}</TableCell>
              <TableCell>{department._count.positions}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <DepartmentFormDialog department={department}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DepartmentFormDialog>
                  <DepartmentDeleteDialog department={department} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
