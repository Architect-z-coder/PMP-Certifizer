// Source: 21st.dev — "Switch" by @jshguo (demo id 11886, demo "Default")
// https://21st.dev/@jshguo/components/interfaces-switch
// Install: https://21st.dev/r/jshguo/interfaces-switch
"use client"

import { Switch } from "@/components/ui/interfaces-switch"

export default function SwitchDemo() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-background p-8 overflow-hidden">
      <div className="flex items-center gap-3">
        <Switch id="airplane-mode" defaultChecked />
        <label htmlFor="airplane-mode" className="text-sm font-medium cursor-pointer">
          Airplane Mode
        </label>
      </div>
    </div>
  )
}
