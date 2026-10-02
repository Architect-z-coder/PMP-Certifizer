// Source: 21st.dev — "Knowledge Graph" by @heygaia (demo id 31573, demo "Default")
// https://21st.dev/@heygaia/components/knowledge-graph
// Install: https://21st.dev/r/heygaia/knowledge-graph
import { KnowledgeGraph } from "@/components/ui/knowledge-graph";

const nodes = [
  { id: "1", label: "React", type: "technology" },
  { id: "2", label: "TypeScript", type: "technology" },
  { id: "3", label: "User", type: "user", size: 30 },
];

const links = [
  { source: "3", target: "1", label: "uses" },
  { source: "3", target: "2", label: "uses" },
  { source: "1", target: "2" },
];

export default function Example() {
  return (
    <div className="h-[400px] w-full">
      <KnowledgeGraph
        nodes={nodes}
        links={links}
        onNodeClick={(node) => console.log(node)}
      />
    </div>
  );
}
