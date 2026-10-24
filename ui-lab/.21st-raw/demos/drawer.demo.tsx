// Source: 21st.dev — "Drawer" by @wensity (demo id 31360, demo "Default")
// https://21st.dev/@wensity/components/drawer
// Install: https://21st.dev/r/wensity/drawer
"use client";

import * as React from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    leftIcon?: React.ReactNode;
  }
>(function Button({ variant = "primary", leftIcon, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] [&_svg]:size-4",
        variant === "primary" && "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
        variant === "secondary" && "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]",
        variant === "ghost" && "text-[var(--foreground)] hover:bg-[var(--muted)]",
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  );
});

const primitivePreviewCardSurfaceFrameClass = cn(
  "relative isolate overflow-hidden rounded-2xl",
  "border",
);

const primitivePreviewCardSurfaceLightClass = cn(
  "border-black/[0.08] bg-[#f4f4f5]",
  "[box-shadow:0_1px_2px_rgba(0,0,0,.06),0_8px_24px_-12px_rgba(0,0,0,.08)]",
);

const primitivePreviewCardSurfaceClass = cn(
  primitivePreviewCardSurfaceFrameClass,
  primitivePreviewCardSurfaceLightClass,
  // Full static `dark:bg-[#0a0a0b]` kept for Tailwind content scan - same as
  // PRIMITIVE_PREVIEW_CANVAS_DARK_BG / PRIMITIVE_PREVIEW_CANVAS_DARK.
  "dark:border-white/[0.06] dark:bg-[#0a0a0b] dark:[box-shadow:0_1px_2px_rgba(0,0,0,.4),0_8px_24px_-12px_rgba(0,0,0,.6)]",
);

const wensityCardSurfaceClass = primitivePreviewCardSurfaceClass;

function DemoFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(wensityCardSurfaceClass, "w-full max-w-md p-5")}>
      <div className="mb-4 border-b border-[var(--border)] pb-3">
        <p className="text-sm font-semibold tracking-[-0.015em] text-[var(--foreground)]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">{subtitle}</p>
        ) : null}
      </div>
      {children}
      <p className="mt-4 text-center text-[11px] text-[var(--muted-foreground)]">
        Opens as a full-viewport overlay
      </p>
    </div>
  );
}

function DrawerDetailRows({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={cn(
            "flex items-center justify-between gap-4 px-3.5 py-3 text-[13px]",
            index > 0 && "border-t border-[var(--border)]",
          )}
        >
          <span className="text-[var(--muted-foreground)]">{row.label}</span>
          <span className="text-right font-medium text-[var(--foreground)]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DrawerPreview() {
  return (
    <DemoFrame
      title="Bottom drawer"
      subtitle="Drag handle, velocity dismiss, and spring settle."
    >
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="secondary">Open checkout</Button>
        </DrawerTrigger>
        <DrawerContent title="Order summary" description="Review your plan before checkout.">
          <div className="space-y-4">
            <DrawerDetailRows
              rows={[
                { label: "Pro Annual", value: "$169" },
                { label: "Billing", value: "Yearly" },
                { label: "Total due today", value: "$169" },
              ]}
            />
            <DrawerClose asChild>
              <Button className="w-full">Continue to payment</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </DemoFrame>
  );
}

export default function Demo() {
  return <DrawerPreview />;
}
