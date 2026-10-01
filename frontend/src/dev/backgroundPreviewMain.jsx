import React from "react";
import { createRoot } from "react-dom/client";
import BackgroundPreview from "./BackgroundPreview.jsx";

// Extra guard: this tryout renders only under the Vite dev server.
if (import.meta.env.DEV) {
  createRoot(document.getElementById("root")).render(<BackgroundPreview />);
}
