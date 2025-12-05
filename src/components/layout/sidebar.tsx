import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarClock,
  Banknote,
  Settings,
  Briefcase,
  CalendarDays,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ClipboardList
} from "lucide-react"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Branches",
    href: "/dashboard/branches",
    icon: Building2,
  },
  {
    title: "Departments",
    href: "/dashboard/departments",
    icon: Briefcase,
  },
  {
    title: "Shifts",
    href: "/dashboard/shifts",
    icon: Clock,
  },
  {
    title: "Employees",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: CalendarClock,
  },
  {
    title: "Attendance Logs",
    href: "/dashboard/attendance/logs",
    icon: FileText,
  },
  {
    title: "Overtime",
    href: "/dashboard/overtime",
    icon: ClipboardList,
  },
  {
    title: "Leaves",
    href: "/dashboard/leaves",
    icon: CalendarDays,
  },
  {
    title: "Debts",
    href: "/dashboard/debts",
    icon: Wallet,
  },
  {
    title: "Payroll",
    href: "/dashboard/payroll",
    icon: Banknote,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggle, isMounted } = useSidebar()

  if (!isMounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div 
      className={cn(
        "hidden border-r bg-gradient-to-b from-background to-muted/20 lg:block h-full transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* Header */}
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 bg-gradient-to-r from-primary/10 to-primary/5">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 font-semibold group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60 group-hover:scale-110 transition-transform">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                HRD TokoKu
              </span>
            </Link>
          )}
          {isCollapsed && (
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60 mx-auto">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-2">
          <nav className={cn(
            "grid items-start text-sm font-medium gap-1",
            isCollapsed ? "px-2" : "px-2 lg:px-4"
          )}>
            {sidebarItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group relative overflow-hidden",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  isCollapsed && "justify-center px-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                title={isCollapsed ? item.title : undefined}
              >
                {/* Hover gradient effect */}
                {pathname !== item.href && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                
                <item.icon className={cn(
                  "h-4 w-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0",
                  pathname === item.href && "scale-110"
                )} />
                {!isCollapsed && (
                  <span className="relative">{item.title}</span>
                )}
                
                {/* Active indicator */}
                {pathname === item.href && !isCollapsed && (
                  <div className="absolute right-2 h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Toggle Button */}
        <div className={cn(
          "border-t p-4",
          isCollapsed && "p-2"
        )}>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            onClick={toggle}
            className="w-full"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>System Online</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
