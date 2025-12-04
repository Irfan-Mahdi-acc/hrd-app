import { getEmployees } from "@/lib/actions/employee-actions"
import { getBranches } from "@/lib/actions/branch-actions"
import { getPositions } from "@/lib/actions/position-actions"
import { EmployeeTable } from "@/components/employees/employee-table"
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function EmployeesPage() {
  const [employeesResult, branchesResult, positionsResult] = await Promise.all([
    getEmployees(),
    getBranches(),
    getPositions()
  ])
  
  const employees = employeesResult.success && employeesResult.data ? employeesResult.data : []
  const branches = branchesResult.success && branchesResult.data ? branchesResult.data : []
  const positions = positionsResult.success && positionsResult.data ? positionsResult.data : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee information and accounts
          </p>
        </div>
        <EmployeeFormDialog branches={branches} positions={positions}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </EmployeeFormDialog>
      </div>
      
      <EmployeeTable employees={employees} branches={branches} positions={positions} />
    </div>
  )
}
