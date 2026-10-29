import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// VITE_UI=chantier → the new interface (src/ui2), loaded lazily so the default build never bundles it.
// Unset (or any other value) → the current interface, unchanged.
const Root = import.meta.env.VITE_UI === "chantier" ? React.lazy(() => import("./ui2/App2.jsx")) : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <Root />
    </React.Suspense>
  </React.StrictMode>
);
