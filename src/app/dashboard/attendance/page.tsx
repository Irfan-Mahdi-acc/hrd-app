import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAttendanceByDate } from "@/lib/actions/attendance-actions"
import { getBranches } from "@/lib/actions/branch-actions"
import { AttendanceCheckIn } from "@/components/attendance/attendance-check-in"
import { AttendanceTable } from "@/components/attendance/attendance-table"

export default async function AttendancePage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Get today's date
  const today = new Date()
  
  // For regular employees, show check-in component
  // For admin/HR, show attendance table
  const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN'

  const [attendanceResult, branchesResult] = await Promise.all([
    isAdmin ? getAttendanceByDate(today) : Promise.resolve({ success: true, data: [] }),
    isAdmin ? getBranches() : Promise.resolve({ success: true, data: [] })
  ])

  const attendances = attendanceResult.success && attendanceResult.data ? attendanceResult.data : []
  const branches = branchesResult.success && branchesResult.data ? branchesResult.data : []

  // Get employee ID from user
  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage employee attendance' : 'Check in and check out'}
        </p>
      </div>

      {!isAdmin && employee && (
        <div className="max-w-md">
          <AttendanceCheckIn employeeId={employee.id} />
        </div>
      )}

      {isAdmin && (
        <AttendanceTable attendances={attendances} branches={branches} />
      )}
    </div>
  )
}
