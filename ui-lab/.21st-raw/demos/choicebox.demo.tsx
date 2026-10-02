// Source: 21st.dev — "Choicebox" by @halaska-studio (demo id 34718, demo "Multiple selection choicebox")
// https://21st.dev/@halaska-studio/components/choicebox
// Install: https://21st.dev/r/halaska-studio/choicebox
import Choicebox from "@/components/ui/choicebox";
import { useState } from "react";

export default function ChoiceboxMultipleDemo() {
  const [tools, setTools] = useState(["intercom", "linear"]);
  return (
    <div style={{ width: 360 }}>
      <Choicebox
        multiple
        value={tools}
        onChange={setTools}
        options={[
          {
            id: "intercom",
            title: "Intercom",
            description: "Read and reply to the support inbox.",
          },
          {
            id: "linear",
            title: "Linear",
            description: "Create and update issues.",
          },
          {
            id: "stripe",
            title: "Stripe",
            description: "Look up invoices and issue refunds.",
          },
        ]}
      />
    </div>
  );
}
