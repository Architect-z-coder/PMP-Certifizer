// Source: 21st.dev — "Skeleton" by @shadcn (demo id 1588, demo "With card")
// https://21st.dev/@shadcn/components/skeleton
// Install: https://21st.dev/r/shadcn/skeleton
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
