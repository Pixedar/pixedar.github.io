import type { Metadata } from "next"

import { MindVisualizerViewer } from "@/components/viewers/mind-visualizer/MindVisualizerViewer"

export const metadata: Metadata = {
  title: "MindVisualizer Web Playground | Wiktor Tomasik",
  description:
    "Interactive WebGL2 version of MindVisualizer for exploring an MDN brain information-flow field in the browser.",
}

export default function MindVisualizerPage() {
  return <MindVisualizerViewer />
}
