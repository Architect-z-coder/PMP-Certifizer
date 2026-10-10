// Source: 21st.dev — "Radar Chart" by @heygaia (demo id 29830, demo "Default")
// https://21st.dev/@heygaia/components/radar-chart
// Changes for Certifizer: tokens (chart palette → ECO domain colors).
"use client";

import type * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const CHART_COLORS = ["var(--dom-people)", "var(--dom-process)", "var(--dom-be)", "var(--tier-2)", "var(--tier-1)"];

function toKeys(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v];
}

function ChartCard({
  title,
  description,
  footer,
  children,
  dataPoints = 0,
}: {
  title?: string;
  description?: string;
  footer?: string;
  children: React.ReactNode;
  dataPoints?: number;
}) {
  const maxWidth =
    dataPoints > 0 ? Math.min(768, Math.max(300, dataPoints * 80)) : undefined;
  return (
    <Card
      className="w-full max-w-3xl"
      style={maxWidth ? { maxWidth } : undefined}
    >
      {(title || description) && (
        <CardHeader className="pb-0">
          {title && (
            <p className="text-sm font-semibold text-card-foreground">
              {title}
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && (
        <CardFooter>
          <p className="text-xs text-muted-foreground">{footer}</p>
        </CardFooter>
      )}
    </Card>
  );
}

export type RadarChartProps = {
  data: Array<Record<string, string | number>>;
  angleKey: string;
  valueKeys: string | string[];
  title?: string;
  description?: string;
  footer?: string;
  colors?: string[];
};

export function RadarChart(props: RadarChartProps) {
  const keys = toKeys(props.valueKeys);
  const colors = props.colors ?? CHART_COLORS;
  const chartConfig: ChartConfig = Object.fromEntries(
    keys.map((key, i) => [
      key,
      { label: key, color: colors[i % colors.length] },
    ]),
  );
  const showLegend = keys.length > 1;
  return (
    <ChartCard
      title={props.title}
      description={props.description}
      footer={props.footer}
      dataPoints={props.data.length}
    >
      <ChartContainer config={chartConfig} className="h-55 w-full">
        <RechartsRadarChart data={props.data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis
            dataKey={props.angleKey}
            tick={({ x, y, textAnchor, index, ...tickProps }) => {
              const d = props.data[index] as Record<string, string | number>;
              const yNum = typeof y === "number" ? y : 0;
              const vals = keys.map((k) => d[k]).join(" / ");
              return (
                <text
                  x={x}
                  y={yNum + (index === 0 ? -10 : 0)}
                  textAnchor={textAnchor}
                  fontSize={12}
                  {...tickProps}
                >
                  <tspan fill="#e4e4e7" fontWeight={500}>
                    {vals}
                  </tspan>
                  <tspan x={x} dy="1.1em" fontSize={11} fill="#71717a">
                    {String(d[props.angleKey])}
                  </tspan>
                </text>
              );
            }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {keys.map((key) => (
            <Radar
              key={key}
              dataKey={key}
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              fill={`var(--color-${key})`}
              fillOpacity={0.2}
            />
          ))}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        </RechartsRadarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export default RadarChart;
