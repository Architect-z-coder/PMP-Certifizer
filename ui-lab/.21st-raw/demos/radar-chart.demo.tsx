// Source: 21st.dev — "Radar Chart" by @heygaia (demo id 29830, demo "Default")
// https://21st.dev/@heygaia/components/radar-chart
// Install: https://21st.dev/r/heygaia/radar-chart
import { RadarChart } from "@/components/ui/radar-chart";

const data = [
  { skill: "Speed", you: 82, team: 70 },
  { skill: "Accuracy", you: 91, team: 75 },
  { skill: "Reliability", you: 76, team: 80 },
];

export default function Example() {
  return (
    <RadarChart
      data={data}
      angleKey="skill"
      valueKeys={["you", "team"]}
      title="Performance"
    />
  );
}
