import type { Metadata } from "next"

import { TraceScopeViewer } from "@/components/viewers/trace-scope/TraceScopeViewer"

export const metadata: Metadata = {
  title: "TraceScope Web Demo | Wiktor Tomasik",
  description:
    "Precomputed TraceScope visualization of recent AI papers with WebGL2 particle flow and cached attractor explanations.",
}

export default function TraceScopePage() {
  return <TraceScopeViewer />
}
