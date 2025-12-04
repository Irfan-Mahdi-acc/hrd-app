import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getLeaveRequests, getLeaveBalance } from "@/lib/actions/leave-actions"
import { LeaveRequestForm } from "@/components/leaves/leave-request-form"
import { LeaveTable } from "@/components/leaves/leave-table"
import { LeaveBalanceCard } from "@/components/leaves/leave-balance-card"

export default async function LeavesPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN'

  // Get employee
  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id }
  })

  // Get leave requests
  const leaveRequestsResult = isAdmin 
    ? await getLeaveRequests()
    : employee 
      ? await getLeaveRequests(employee.id)
      : { success: true, data: [] }

  // Get leave balance for employee
  const leaveBalanceResult = employee 
    ? await getLeaveBalance(employee.id)
    : { success: false, data: null }

  const leaveRequests = leaveRequestsResult.success && leaveRequestsResult.data ? leaveRequestsResult.data : []
  const leaveBalance = leaveBalanceResult.success && leaveBalanceResult.data ? leaveBalanceResult.data : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage employee leave requests' : 'Request and track your leaves'}
        </p>
      </div>

      {!isAdmin && employee && leaveBalance && (
        <div className="grid gap-4 md:grid-cols-2">
          <LeaveBalanceCard balance={leaveBalance} />
          <LeaveRequestForm employeeId={employee.id} />
        </div>
      )}

      <LeaveTable 
        leaveRequests={leaveRequests} 
        isAdmin={isAdmin}
        currentUserId={session.user.id}
      />
    </div>
  )
}
