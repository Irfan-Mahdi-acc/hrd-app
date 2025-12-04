'use client'

import { Branch } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BranchFormDialog } from "./branch-form-dialog"
import { BranchDeleteDialog } from "./branch-delete-dialog"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, MapPin } from "lucide-react"

type BranchWithCount = Branch & {
  _count: {
    employees: number
  }
}

interface BranchTableProps {
  branches: BranchWithCount[]
}

export function BranchTable({ branches }: BranchTableProps) {
  if (branches.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No branches found. Add your first branch to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Radius (m)</TableHead>
            <TableHead>Timezone</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => (
            <TableRow key={branch.id}>
              <TableCell className="font-medium">{branch.name}</TableCell>
              <TableCell>{branch.address || '-'}</TableCell>
              <TableCell>
                {branch.latitude && branch.longitude ? (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3" />
                    {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{branch.radius}m</TableCell>
              <TableCell>{branch.timezone}</TableCell>
              <TableCell>{branch._count.employees}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <BranchFormDialog branch={branch}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </BranchFormDialog>
                  <BranchDeleteDialog branch={branch} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
