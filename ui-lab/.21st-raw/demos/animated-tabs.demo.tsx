// Source: 21st.dev — "Animated Tabs" by @educalvolpz (demo id 24930, demo "Default")
// https://21st.dev/@educalvolpz/components/animated-tabs
// Install: https://21st.dev/r/educalvolpz/animated-tabs
"use client";

import AnimatedTabs from "@/components/ui/animated-tabs";
import { useState } from "react";

const tabs = [
  { id: "home", label: "Home" },
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" },
];

export default function AnimatedTabsDemo() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="flex flex-col items-center gap-8">
      <AnimatedTabs
        activeTab={activeTab}
        layoutId="underline-demo"
        onChange={setActiveTab}
        tabs={tabs}
        variant="underline"
      />

      <AnimatedTabs
        activeTab={activeTab}
        layoutId="pill-demo"
        onChange={setActiveTab}
        tabs={tabs}
        variant="pill"
      />

      <AnimatedTabs
        activeTab={activeTab}
        layoutId="segment-demo"
        onChange={setActiveTab}
        tabs={tabs}
        variant="segment"
      />
    </div>
  );
}
