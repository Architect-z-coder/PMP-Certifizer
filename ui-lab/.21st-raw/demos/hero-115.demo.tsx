// Source: 21st.dev — "Hero 115" by @shadcnblockscom (demo id 608, demo "Default")
// https://21st.dev/@shadcnblockscom/components/shadcnblocks-com-hero115
// Install: https://21st.dev/r/shadcnblockscom/shadcnblocks-com-hero115
import { Wifi, Zap } from "lucide-react";

import { Hero115 } from "@/components/blocks/shadcnblocks-com-hero115"

const demoData = {
  icon: <Wifi className="size-6" />,
  heading: "Blocks built with Shadcn & Tailwind",
  description:
    "Finely crafted components built with React, Tailwind and Shadcn UI. Developers can copy and paste these blocks directly into their project.",
  button: {
    text: "Discover Features",
    icon: <Zap className="ml-2 size-4" />,
    url: "https://www.shadcnblocks.com",
  },
  trustText: "Trusted by 25.000+ Businesses Worldwide",
  imageSrc: "https://cdn.21st.dev/assets/mirror/9f/9fb9487617e0903ab5bb8012f11530f61a39e4f1f19f169a87a367887fdaeecb.svg",
  imageAlt: "placeholder",
};

function Hero115Demo() {
  return <Hero115 {...demoData} />;
}

export { Hero115Demo };
