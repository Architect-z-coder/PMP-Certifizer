// Source: 21st.dev — "Switch" by @halaska-studio (demo id 34784, demo "Controlled switch with dependent text")
// https://21st.dev/@halaska-studio/components/switch
// Install: https://21st.dev/r/halaska-studio/switch
"use client";

import SwitchToggle from "@/components/ui/switch";
import { Stack, Text } from "@/components/ui/switch-utils/shared";
import { useState } from "react";

export default function ControlledSwitchDemo() {
  const [paused, setPaused] = useState(false);
  return (
    <Stack gap={12}>
      <SwitchToggle checked={paused} onChange={setPaused} label="Pause Alpha" />
      <Text size="sm" secondary>
        {paused
          ? "Alpha is paused. New tickets wait in the inbox."
          : "Alpha is working through the inbox."}
      </Text>
    </Stack>
  );
}
