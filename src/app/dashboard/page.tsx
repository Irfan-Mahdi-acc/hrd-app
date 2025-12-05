import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CalendarClock, Banknote, Building2, TrendingUp, ArrowUpRight } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function Dashboard() {
  const session = await auth()

  // Get real data
  const [employeeCount, todayAttendance, pendingPayroll, branchCount] = await Promise.all([
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.payroll.count({ where: { status: 'PENDING' } }),
    prisma.branch.count()
  ])

  const stats = [
    {
      title: "Total Employees",
      value: employeeCount.toString(),
      description: "Active employees",
      icon: Users,
      trend: "+12%",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Today's Attendance",
      value: todayAttendance.toString(),
      description: "Checked in today",
      icon: CalendarClock,
      trend: "+5%",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Pending Payroll",
      value: pendingPayroll.toString(),
      description: "To be processed",
      icon: Banknote,
      trend: "-2%",
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Branches",
      value: branchCount.toString(),
      description: "Active locations",
      icon: Building2,
      trend: "+1",
      color: "from-purple-500 to-pink-500",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome back, <span className="font-semibold text-foreground">{session?.user?.email}</span>
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                {stat.description}
                <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
              Add Employee
            </button>
            <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
              Generate Payroll
            </button>
            <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
              View Reports
            </button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm">New employee registered</span>
                <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm">Attendance recorded</span>
                <span className="text-xs text-muted-foreground ml-auto">5 min ago</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm">Leave request pending</span>
                <span className="text-xs text-muted-foreground ml-auto">10 min ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
