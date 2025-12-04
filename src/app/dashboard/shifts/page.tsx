import { getShifts } from "@/lib/actions/shift-actions"
import { ShiftTable } from "@/components/shifts/shift-table"
import { ShiftFormDialog } from "@/components/shifts/shift-form-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function ShiftsPage() {
  const result = await getShifts()
  const shifts = result.success && result.data ? result.data : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground">
            Manage work shifts with auto-detection based on check-in time
          </p>
        </div>
        <ShiftFormDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift
          </Button>
        </ShiftFormDialog>
      </div>
      
      <ShiftTable shifts={shifts} />
    </div>
  )
}
