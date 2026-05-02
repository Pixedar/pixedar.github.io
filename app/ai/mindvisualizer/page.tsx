import type { Metadata } from "next"

import { MindVisualizerViewer } from "@/components/viewers/mind-visualizer/MindVisualizerViewer"

export const metadata: Metadata = {
  title: "MindVisualizer Web Playground | Wiktor Tomasik",
  description:
    "GPU-accelerated WebGL2 MindVisualizer playground for exploring MDN brain information-flow dynamics.",
}

export default function MindVisualizerPage() {
  return <MindVisualizerViewer />
}
