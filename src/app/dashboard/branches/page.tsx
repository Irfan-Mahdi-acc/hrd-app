import { getBranches } from "@/lib/actions/branch-actions"
import { BranchTable } from "@/components/branches/branch-table"
import { BranchFormDialog } from "@/components/branches/branch-form-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function BranchesPage() {
  const result = await getBranches()
  const branches = result.success && result.data ? result.data : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground">
            Manage your store locations and geofencing settings
          </p>
        </div>
        <BranchFormDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        </BranchFormDialog>
      </div>
      
      <BranchTable branches={branches} />
    </div>
  )
}
