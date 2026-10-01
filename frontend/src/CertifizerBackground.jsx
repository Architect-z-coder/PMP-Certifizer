import React from "react";
import { C } from "./pmp.js";

/*
  CertifizerBackground — soft radial glow behind any content (TRYOUT, not used by the app yet).
  - variant: "lavender" (default) | "yellow" | "none" (original paper background)
  - The glow is a decorative layer: aria-hidden, pointer-events none, painted behind children.
  - Gradient values come from the design brief; pattern adapted from 21st.dev "Radial Glow Background".
*/
const GLOWS = {
  lavender: { backgroundImage: "radial-gradient(circle at center, #c4b5fd 0%, transparent 70%)", opacity: 0.5 },
  yellow: { backgroundImage: "radial-gradient(circle at center, #FFF991 0%, transparent 70%)", opacity: 0.6 },
};

export default function CertifizerBackground({ children, className, variant = "lavender", style }) {
  const glow = GLOWS[variant];
  return (
    <div
      className={className}
      data-bg-variant={variant}
      style={{ position: "relative", isolation: "isolate", background: C.paper, ...style }}
    >
      {glow && (
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none", ...glow }}
        />
      )}
      {children}
    </div>
  );
}
