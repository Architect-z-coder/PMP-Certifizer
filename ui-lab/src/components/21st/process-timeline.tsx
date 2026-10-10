// Source: 21st.dev — "Process Timeline" by @shadcnui-blocks (demo id 28381, demo "Default")
// https://21st.dev/@shadcnui-blocks/components/timeline-05
// Changes for Certifizer: French copy; hard-coded steps became the `steps` prop (same markup).
import type React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStep = { title: string; description: React.ReactNode; completed?: boolean };
const defaultSteps: TimelineStep[] = [
  { title: "Recherche", description: "Recueillir l’information et analyser les besoins pour comprendre le problème et fixer les objectifs.", completed: true },
  { title: "Planification", description: "Définir le périmètre et les étapes nécessaires pour atteindre l’objectif.", completed: true },
  { title: "Réalisation", description: "Construire, intégrer, vérifier." },
];

export default function Timeline({ steps = defaultSteps, className = "mx-auto max-w-(--breakpoint-sm) px-6 py-12 md:py-20" }: { steps?: TimelineStep[]; className?: string }) {
  return (
    <div className={className}>
      <div className="relative ml-6">
        {/* Timeline line */}
        <div className="absolute inset-y-0 left-0 border-l" />

        {steps.map(({ title, description, completed }, index) => (
          <div className="relative pb-10 pl-10 last:pb-0" key={index}>
            {/* Timeline Icon */}
            <div
              className={cn(
                "absolute left-px flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-muted-foreground/40 bg-accent ring-8 ring-background",
                {
                  "border-primary bg-primary text-primary-foreground":
                    completed,
                },
              )}
            >
              <span className="font-medium text-lg">
                {completed ? <Check className="h-5 w-5" /> : index + 1}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-1.5 pt-1">
              <h3 className="font-medium text-xl tracking-[-0.01em]">
                {title}
              </h3>
              <p className="text-lg text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
