// Source: 21st.dev — "Line Chart" by @heygaia (demo id 29015, demo "Default")
// https://21st.dev/@heygaia/components/line-chart
// Install: https://21st.dev/r/heygaia/line-chart
import { LineChart } from "@/components/ui/line-chart";

const data = [
  { day: "Mon", visitors: 320, signups: 24 },
  { day: "Tue", visitors: 410, signups: 31 },
  { day: "Wed", visitors: 380, signups: 28 },
  { day: "Thu", visitors: 490, signups: 35 },
  { day: "Fri", visitors: 610, signups: 42 },
  { day: "Sat", visitors: 520, signups: 38 },
  { day: "Sun", visitors: 470, signups: 33 },
];

export default function Example() {
  return (
    <LineChart
      data={data}
      xKey="day"
      yKeys={["visitors", "signups"]}
      title="Weekly Activity"
      description="Visitors and signups by day"
    />
  );
}
