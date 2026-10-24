// Source: 21st.dev — "Chart Donut Halftone" by @nikolas-sapa (demo id 32787, demo "Default")
// https://21st.dev/@nikolas-sapa/components/chart-donut-halftone
// Install: https://21st.dev/r/nikolas-sapa/chart-donut-halftone
import ChartDonutHalftone from "@/components/ui/chart-donut-halftone";

export default function Demo() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-10">
      <ChartDonutHalftone
        title="Order Size Tiers"
        unit="orders"
        data={[
          { label: "S", value: 420 },
          { label: "M", value: 860 },
          { label: "L", value: 610 },
          { label: "XL", value: 240 },
        ]}
      />
    </div>
  );
}
