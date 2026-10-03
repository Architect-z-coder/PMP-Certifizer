// Source: 21st.dev — "Switch" by @halaska-studio (demo id 34784, demo "Controlled switch with dependent text")
// https://21st.dev/@halaska-studio/components/switch
// Install: https://21st.dev/r/halaska-studio/switch
"use client";

import {
  motion,
  useThemeContext,
  usePal,
  interactiveBase,
  Text,
} from "@/components/ui/switch-utils/shared";
import { useState } from "react";

export function SwitchToggle({
  checked,
  onChange,
  label,
  theme: tp,
  "aria-label": ariaLabel,
}) {
  const ctx = useThemeContext();
  const theme = tp || ctx;
  const pal = usePal(theme);
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <button
        type="button"
        onClick={() => onChange?.(!checked)}
        role="switch"
        aria-checked={!!checked}
        aria-label={ariaLabel}
        style={{
          ...interactiveBase,
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? pal.accent : pal.bgMuted,
          position: "relative",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            background: checked ? "#fff" : pal.bgElevated,
            position: "absolute",
            top: 2,
            left: checked ? 22 : 2,
            transition: `left ${motion.spring} ${motion.springCurve}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </button>
      {label && (
        <Text size="base" theme={theme}>
          {label}
        </Text>
      )}
    </label>
  );
}

export function SpringToggle({
  checked,
  onChange,
  label,
  theme: tp,
  "aria-label": ariaLabel,
}) {
  const ctx = useThemeContext();
  const theme = tp || ctx;
  const pal = usePal(theme);
  const [press, setPress] = useState(false);
  const thumbW = press ? 24 : 20;
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <button
        onClick={() => onChange?.(!checked)}
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        onMouseLeave={() => setPress(false)}
        role="switch"
        aria-checked={!!checked}
        aria-label={ariaLabel}
        style={{
          ...interactiveBase,
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? pal.accent : pal.bgMuted,
          position: "relative",
          padding: 0,
          flexShrink: 0,
          transition: `background ${motion.normal} ${motion.easeInOut}`,
        }}
      >
        <div
          style={{
            width: thumbW,
            height: 20,
            borderRadius: 10,
            background: checked ? "#fff" : pal.bgElevated,
            position: "absolute",
            top: 2,
            left: checked ? 44 - thumbW - 2 : 2,
            transition: `left ${motion.spring} ${motion.springCurve}, width ${motion.fast} ${motion.easeOut}, background ${motion.smooth} ${motion.easeInOut}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </button>
      {label && (
        <Text size="base" theme={theme}>
          {label}
        </Text>
      )}
    </label>
  );
}

export const Switch = SwitchToggle;

export default SwitchToggle;
