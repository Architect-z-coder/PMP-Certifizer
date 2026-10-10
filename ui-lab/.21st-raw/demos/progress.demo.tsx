// Source: 21st.dev — "Progress" by @jshguo (demo id 11889, demo "Steps")
// https://21st.dev/@jshguo/components/interfaces-progress
// Install: https://21st.dev/r/jshguo/interfaces-progress
"use client"

import { Progress } from "@/components/ui/interfaces-progress"

export default function ProgressStepsDemo() {
  const steps = [
    { label: "Profile", value: 100 },
    { label: "Account", value: 75 },
    { label: "Billing", value: 40 },
    { label: "Notifications", value: 10 },
  ]

  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-background p-8 overflow-hidden">
      <div className="w-full max-w-sm space-y-5">
        {steps.map((step) => (
          <div key={step.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{step.label}</span>
              <span className="text-muted-foreground">{step.value}%</span>
            </div>
            <Progress value={step.value} />
          </div>
        ))}
      </div>
    </div>
  )
}
