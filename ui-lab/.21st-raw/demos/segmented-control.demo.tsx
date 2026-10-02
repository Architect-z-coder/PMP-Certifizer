// Source: 21st.dev — "Segmented Control" by @ddoemonn (demo id 23552, demo "Default")
// https://21st.dev/@ddoemonn/components/segmented-control
// Install: https://21st.dev/r/ddoemonn/segmented-control
"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { useState } from "react";

const RANGES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

export default function SegmentedControlDemo() {
  const [range, setRange] = useState("day");

  return (
    <div className="flex w-full justify-center">
      <SegmentedControl
        label="Report range"
        options={RANGES}
        value={range}
        onValueChange={setRange}
      />
    </div>
  );
}
