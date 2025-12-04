'use client'

import { Employee, Branch, Position, Department, User } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmployeeFormDialog } from "./employee-form-dialog"
import { EmployeeDeleteDialog } from "./employee-delete-dialog"
import { EmployeeAccountDialog } from "./employee-account-dialog"
import { Button } from "@/components/ui/button"
import { Pencil, UserPlus, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type EmployeeWithRelations = Employee & {
  branch: Branch
  position: Position & {
    department: Department
  }
  user: Pick<User, 'email' | 'role'> | null
}

interface EmployeeTableProps {
  employees: EmployeeWithRelations[]
  branches: Branch[]
  positions: (Position & { department: Department })[]
}

export function EmployeeTable({ employees, branches, positions }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No employees found. Add your first employee to get started.</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>
      case 'RESIGNED':
        return <Badge variant="secondary">Resigned</Badge>
      case 'TERMINATED':
        return <Badge variant="destructive">Terminated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>NIK</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.fullName}</TableCell>
              <TableCell>{employee.nik || '-'}</TableCell>
              <TableCell>{employee.branch.name}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{employee.position.title}</div>
                  <div className="text-muted-foreground">{employee.position.department.name}</div>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(employee.status)}</TableCell>
              <TableCell>
                {employee.user ? (
                  <div className="text-sm">
                    <Badge variant="outline">Has Account</Badge>
                  </div>
                ) : (
                  <EmployeeAccountDialog employeeId={employee.id} employeeName={employee.fullName}>
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Create
                    </Button>
                  </EmployeeAccountDialog>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <EmployeeFormDialog employee={employee} branches={branches} positions={positions}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </EmployeeFormDialog>
                  <EmployeeDeleteDialog employee={employee} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
