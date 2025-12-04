import { getDepartments } from "@/lib/actions/department-actions"
import { getPositions } from "@/lib/actions/position-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepartmentTable } from "@/components/departments/department-table"
import { PositionTable } from "@/components/departments/position-table"
import { DepartmentFormDialog } from "@/components/departments/department-form-dialog"
import { PositionFormDialog } from "@/components/departments/position-form-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function DepartmentsPage() {
  const [departmentsResult, positionsResult] = await Promise.all([
    getDepartments(),
    getPositions()
  ])
  
  const departments = departmentsResult.success && departmentsResult.data ? departmentsResult.data : []
  const positions = positionsResult.success && positionsResult.data ? positionsResult.data : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
        <p className="text-muted-foreground">
          Manage departments and positions
        </p>
      </div>
      
      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-end">
            <DepartmentFormDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DepartmentFormDialog>
          </div>
          <DepartmentTable departments={departments} />
        </TabsContent>
        
        <TabsContent value="positions" className="space-y-4">
          <div className="flex justify-end">
            <PositionFormDialog departments={departments}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Position
              </Button>
            </PositionFormDialog>
          </div>
          <PositionTable positions={positions} departments={departments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
