// Source: 21st.dev — "Heat Calendar" by @ssychui (demo id 30542, demo "Default")
// https://21st.dev/@ssychui/components/heat-calendar
// Install: https://21st.dev/r/ssychui/heat-calendar
import { useEffect } from "react"
import { Demo } from "@/components/ui/heat-calendar"

export default function DemoOne() {
  // open the preview in dark by default; the sandbox theme toggle still works
  useEffect(() => { document.documentElement.classList.add("dark") }, [])
  return (
    <div className="w-full">
      <Demo />
    </div>
  )
}
