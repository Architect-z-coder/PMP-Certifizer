// Source: 21st.dev — "Stats Card" by @ravikatiyar162 (demo id 8321, demo "default.tsx")
// https://21st.dev/@ravikatiyar162/components/stats-card-1
// Changes for Certifizer: tokens (emerald → tier-3); French copy (“from last month” → prop changeNote, default “depuis la semaine dernière”).
// components/ui/stats-card.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Props for the StatsCard component.
 * @param {string} title - The title of the statistic (e.g., "Total Revenue").
 * @param {string} value - The main value to display (e.g., "₹4,52,318").
 * @param {React.ReactNode} icon - The icon to display in the card header.
 * @param {string} change - The change percentage or value (e.g., "+20.1%").
 * @param {'positive' | 'negative'} changeType - Determines the color of the change text.
 * @param {string} [className] - Optional additional class names for the card.
 */
interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  changeType: 'positive' | 'negative';
  className?: string;
  changeNote?: string;
}

/**
 * A responsive card component for displaying key statistics with a trend indicator.
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeType,
  className,
  changeNote = 'depuis la semaine dernière',
}) => {
  const changeColor = changeType === 'positive'
    ? 'text-tier-3'
    : 'text-destructive';

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {/* Icon is passed as a child */}
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className={cn("text-xs text-muted-foreground mt-1", changeColor)}>
          {change} {changeNote}
        </p>
      </CardContent>
    </Card>
  );
};