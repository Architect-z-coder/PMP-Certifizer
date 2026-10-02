// Source: 21st.dev — "Basic Accordion" by @felipemenezes098 (demo id 24849, demo "Default")
// https://21st.dev/@felipemenezes098/components/accordion-01
// Changes for Certifizer: French copy; the three hard-coded items became the `items` prop (same markup).
import type React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type AccordionEntry = { id: string; title: React.ReactNode; content: React.ReactNode };
const defaultItems: AccordionEntry[] = [
  { id: "item-1", title: "Est-ce accessible ?", content: "Oui. Il respecte le motif WAI-ARIA et se parcourt entièrement au clavier." },
  { id: "item-2", title: "Est-ce stylé ?", content: "Oui. Il arrive avec des styles par défaut cohérents avec le reste des composants." },
  { id: "item-3", title: "Est-ce animé ?", content: "Oui. Il est animé par défaut, et vous pouvez désactiver l’animation." },
];
export function Accordion01({ items = defaultItems, defaultValue, className = "w-full max-w-md", type = "multiple" }: { items?: AccordionEntry[]; defaultValue?: string[]; className?: string; type?: "single" | "multiple" }) {
  return (
    <Accordion type={type as any} defaultValue={(defaultValue ?? [items[0]?.id]) as any} className={className}>
      {items.map((it) => (
        <AccordionItem key={it.id} value={it.id}>
          <AccordionTrigger>{it.title}</AccordionTrigger>
          <AccordionContent>{it.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default Accordion01;
