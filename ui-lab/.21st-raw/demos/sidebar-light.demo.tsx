// Source: 21st.dev — "Sidebar Light" by @inference-sh (demo id 19361, demo "Default")
// https://21st.dev/@inference-sh/components/sidebar-light
// Install: https://21st.dev/r/inference-sh/sidebar-light
import { SidebarLight, type NavItem } from "@/components/ui/sidebar-light"
import { Home, BookOpen, Settings, LayoutGrid, FileText, Users } from "lucide-react"

const items: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  {
    title: "Documentation",
    href: "#",
    icon: BookOpen,
    items: [
      { title: "Getting Started", href: "/dashboard" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Components", href: "/docs/components" },
    ],
  },
  {
    title: "Projects",
    href: "#",
    icon: LayoutGrid,
    items: [
      { title: "Overview", href: "/projects/overview", icon: FileText },
      { title: "Team", href: "/projects/team", icon: Users },
    ],
  },
  { title: "Settings", href: "/settings", icon: Settings },
]

export default function SidebarLightDemo() {
  return (
    <div className="flex min-h-[420px] w-full justify-center bg-background p-6">
      <div className="w-64 rounded-lg border border-border p-3">
        <SidebarLight items={items} />
      </div>
    </div>
  )
}
