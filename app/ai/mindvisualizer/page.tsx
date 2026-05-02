import type { Metadata } from "next"

import { MindVisualizerLive } from "@/components/viewers/mind-visualizer/MindVisualizerLive"

export const metadata: Metadata = {
  title: "MindVisualizer Live | Wiktor Tomasik",
  description:
    "Live Python/VTK MindVisualizer session for exploring brain information-flow dynamics.",
}

export default function MindVisualizerPage() {
  return <MindVisualizerLive />
}
