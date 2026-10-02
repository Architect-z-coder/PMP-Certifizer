// Source: 21st.dev — "Sonner Toast" by @isaiahbjork (demo id 27363, demo "Default")
// https://21st.dev/@isaiahbjork/components/primitive-sonner
// Changes for Certifizer: French copy; BjorkButton (not shipped with the demo) → the registry Button; `showButton` prop to mount the Toaster alone; bjork tokens aliased in theme.css.
"use client";

import type { CSSProperties } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button as BjorkButton } from "@/components/ui/button";

export function BjorkSonnerDemo({ showButton = true }: { showButton?: boolean }) {
  return (
    <>
      {showButton && <BjorkButton
        variant="secondary"
        onClick={() =>
          toast("Brouillon synchronisé", {
            description: "L’état du composant a été copié dans l’espace de travail.",
          })
        }
      >
        <Bell aria-hidden="true" />
        Envoyer une notification
      </BjorkButton>}
      <Toaster
        style={
          {
            "--normal-bg": "var(--bjork-field)",
            "--normal-text": "var(--bjork-text)",
            "--normal-border": "var(--bjork-border)",
          } as CSSProperties
        }
        toastOptions={{
          style: {
            background: "var(--bjork-field)",
            border: "1px solid var(--bjork-border)",
            color: "var(--bjork-text)",
            borderRadius: "18px",
            boxShadow: "var(--bjork-shadow-surface)",
          },
          classNames: {
            toast:
              "rounded-[18px] border border-[color:var(--bjork-border)] bg-[var(--bjork-field)] px-4 py-4 text-[color:var(--bjork-text)] shadow-[var(--bjork-shadow-surface)]",
            title: "text-sm font-medium text-[color:var(--bjork-text-strong)]",
            description:
              "text-sm leading-6 text-[color:var(--bjork-text-muted)]",
          },
        }}
      />
    </>
  );
}

export default BjorkSonnerDemo;
