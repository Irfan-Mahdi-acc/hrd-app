import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CalendarClock, Banknote, Building2 } from "lucide-react"

export default async function Dashboard() {
  const session = await auth()

  const stats = [
    {
      title: "Total Employees",
      value: "0",
      description: "Active employees",
      icon: Users,
    },
    {
      title: "Today's Attendance",
      value: "0",
      description: "Checked in today",
      icon: CalendarClock,
    },
    {
      title: "Pending Payroll",
      value: "0",
      description: "To be processed",
      icon: Banknote,
    },
    {
      title: "Branches",
      value: "0",
      description: "Active locations",
      icon: Building2,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.email}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
