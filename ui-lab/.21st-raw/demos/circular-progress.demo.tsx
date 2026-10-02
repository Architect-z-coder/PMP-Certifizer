// Source: 21st.dev — "Circular Progress with Custom Color" by @shadcnui-blocks (demo id 22095, demo "Default")
// https://21st.dev/@shadcnui-blocks/components/progress-10
// Install: https://21st.dev/r/shadcnui-blocks/progress-10
"use client";

import * as React from "react";
import CircularProgress from "@/components/ui/progress-10";
import { Slider } from "@/components/ui/slider";

export default function CircularProgressColorDemo() {
  const [progress, setProgress] = React.useState([13]);

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center">
      <div className="flex items-center gap-1">
        <CircularProgress
          className="stroke-indigo-500/25"
          labelClassName="text-xl font-bold"
          progressClassName="stroke-indigo-600"
          renderLabel={(progress) => `${progress}%`}
          showLabel
          size={120}
          strokeWidth={10}
          value={progress[0]}
        />
        <CircularProgress
          className="stroke-orange-500/25"
          labelClassName="text-xl font-bold"
          progressClassName="stroke-orange-600"
          renderLabel={(progress) => `${progress}%`}
          showLabel
          size={120}
          strokeWidth={10}
          value={progress[0]}
        />
      </div>
      <Slider
        className="mt-6"
        defaultValue={progress}
        max={100}
        onValueChange={setProgress}
        step={1}
      />
    </div>
  );
}
