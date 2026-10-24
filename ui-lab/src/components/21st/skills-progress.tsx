// Source: 21st.dev — "Skills Progress Dashboard" by @shadcnspace (demo id 19138, demo "Default")
// https://21st.dev/@shadcnspace/components/progress-03
// Changes for Certifizer: a11y: aria-label on each Progress; French copy; the hard-coded stats array became the `stats` prop (same shape, original kept as defaultStats); `progress-track` slot → `progress` (the jshguo Progress used here names its root slot `progress`).
"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/21st/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type React from "react";

export const defaultStats = [
  {
    label: "React / Next.js",
    value: 92,
    indicatorClass: "**:data-[slot='progress-indicator']:bg-blue-500!",
    trackClass: "**:data-[slot='progress']:bg-blue-500/20!",
  },
  {
    label: "TypeScript",
    value: 85,
    indicatorClass: "**:data-[slot='progress-indicator']:bg-orange-400!",
    trackClass: "**:data-[slot='progress']:bg-orange-400/20!",
  },
  {
    label: "Tailwind CSS",
    value: 78,
    indicatorClass: "**:data-[slot='progress-indicator']:bg-sky-400!",
    trackClass: "**:data-[slot='progress']:bg-sky-400/20!",
  },
  {
    label: "Node.js",
    value: 70,
    indicatorClass: "**:data-[slot='progress-indicator']:bg-teal-400!",
    trackClass: "**:data-[slot='progress']:bg-teal-400/20!",
  },
  {
    label: "UI / UX Design",
    value: 62,
    indicatorClass: "**:data-[slot='progress-indicator']:bg-amber-300!",
    trackClass: "**:data-[slot='progress']:bg-amber-300/20!",
  },
] as const;

export type SkillStat = { label: string; value: number; indicatorClass: string; trackClass: string };
export default function SkillsProgress({
  stats = defaultStats as unknown as SkillStat[],
  title = "Niveaux de maîtrise",
  subtitle = "Vue d’ensemble par domaine",
  badge = "+12 %",
  className,
}: { stats?: SkillStat[]; title?: string; subtitle?: string; badge?: React.ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={cn("w-full max-w-sm rounded-xl border bg-background p-5 space-y-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1 border-tier-3/30 bg-tier-3/10 text-tier-3-ink"
        >
          <TrendingUp className="size-3" />
          {badge}
        </Badge>
      </div>

      <div className="space-y-4">
        {stats.map(({ label, value, indicatorClass, trackClass }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{label}</span>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {mounted ? value : 0} %
              </span>
            </div>
            <Progress
              aria-label={label}
              value={mounted ? value : 0}
              className={cn(
                "**:data-[slot='progress']:h-2! **:data-[slot='progress-indicator']:duration-1000!",
                indicatorClass,
                trackClass,
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
