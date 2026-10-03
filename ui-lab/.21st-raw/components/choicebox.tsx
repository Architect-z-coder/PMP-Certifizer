// Source: 21st.dev — "Choicebox" by @halaska-studio (demo id 34718, demo "Multiple selection choicebox")
// https://21st.dev/@halaska-studio/components/choicebox
// Install: https://21st.dev/r/halaska-studio/choicebox
"use client";

import {
  useThemeContext,
  usePal,
  tokens,
  motion,
  interactiveBase,
} from "@/components/ui/choicebox-utils/kit-theme";

// Atomic components borrowed in spirit from Vercel's Geist system,
// rebuilt in the kit's idiom: Choicebox, SearchInput, SplitButton,
// StatusDot, MiddleTruncate, Snippet, FileTree, BrowserFrame.

function Choicebox({ options, value, onChange, multiple, theme: tp }) {
  const ctx = useThemeContext();
  const theme = tp || ctx;
  const pal = usePal(theme);
  const isSelected = (id) =>
    multiple ? (value || []).includes(id) : value === id;
  const pick = (id) => {
    if (!multiple) return onChange(id);
    const set = new Set(value || []);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange([...set]);
  };
  return (
    <div
      role={multiple ? "group" : "radiogroup"}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {options.map((opt) => {
        const selected = isSelected(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            onClick={() => pick(opt.id)}
            style={{
              ...interactiveBase,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              borderRadius: tokens.radius.md,
              textAlign: "left",
              background: selected ? pal.accentBg : pal.bgSubtle,
              border: `1px solid ${selected ? pal.accent : "transparent"}`,
              transition: `all ${motion.normal} ${motion.easeInOut}`,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: multiple ? 5 : 8,
                flexShrink: 0,
                marginTop: 1,
                border: `1.5px solid ${selected ? pal.accent : pal.textMuted}`,
                background: selected ? pal.accent : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: `all ${motion.normal} ${motion.easeInOut}`,
              }}
            >
              {selected &&
                (multiple ? (
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1.5 5.5 4 8 8.5 2.5"
                      stroke="#fff"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: "#fff",
                      animation: `halaska-scale-in 0.2s ${motion.easeOut} both`,
                    }}
                  />
                ))}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  ...tokens.type.sm,
                  fontWeight: tokens.weight.medium,
                  color: pal.text,
                  display: "block",
                  transition: `color ${motion.smooth} ${motion.easeInOut}`,
                }}
              >
                {opt.title}
              </span>
              {opt.description && (
                <span
                  style={{
                    ...tokens.type.xs,
                    color: pal.textSecondary,
                    display: "block",
                    marginTop: 2,
                    lineHeight: 1.5,
                    transition: `color ${motion.smooth} ${motion.easeInOut}`,
                  }}
                >
                  {opt.description}
                </span>
              )}
            </span>
            {opt.meta && (
              <span
                style={{
                  ...tokens.type.xs,
                  color: pal.textTertiary,
                  fontFamily: tokens.font.mono,
                  flexShrink: 0,
                  transition: `color ${motion.smooth} ${motion.easeInOut}`,
                }}
              >
                {opt.meta}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Choicebox;
