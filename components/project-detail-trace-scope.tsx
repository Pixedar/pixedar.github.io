import type React from "react"
import Image from "next/image"
import { ExternalLink, Github, Route } from "lucide-react"

function PillLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="inline-flex items-center gap-2 border-2 border-black bg-[#F7F3E9] px-4 py-2 transition-colors hover:bg-white"
    >
      {children}
    </a>
  )
}

export function ProjectDetailTraceScope() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold md:text-3xl" style={{ color: "#1a1a1a" }}>
            Web demo for the TraceScope Python renderer
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            This page is a static, precomputed web demo of TraceScope: recent AI papers are scraped and analyzed locally,
            then the resulting flow field, clusters, attractors, and cached explanations are loaded in the browser.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PillLink href="/ai/tracescope/">
            <Route className="h-4 w-4" />
            Open web demo
          </PillLink>
          <PillLink href="https://github.com/Pixedar/TraceScope">
            <Github className="h-4 w-4" />
            TraceScope repo
          </PillLink>
          <PillLink href="https://pixedar.github.io/ai/tracescope/">
            <ExternalLink className="h-4 w-4" />
            Public URL
          </PillLink>
        </div>

        <div className="overflow-hidden border-2 border-black bg-black">
          <Image
            src="/flow-steering/prm-demo-v2.gif"
            alt="TraceScope PRM800K RBF flow visualization"
            width={950}
            height={534}
            unoptimized
            className="block h-auto w-full"
          />
        </div>

        <div className="border-2 border-black bg-black">
          <iframe
            src="/ai/tracescope/"
            title="TraceScope web demo"
            className="h-[78vh] w-full"
          />
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "#6a6a6a" }}>
          Live re-analysis uses a small optional backend; cached attractor and saved-path explanations are bundled with
          the snapshot and do not require a user key.
        </p>
      </div>
    </div>
  )
}
