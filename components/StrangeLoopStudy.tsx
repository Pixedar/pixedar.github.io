"use client"

import { useEffect, useRef, useState } from "react"

const study = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/projects/self-awareness/attention-reader/study/index.html`

export default function StrangeLoopStudy() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(2200)
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type === "jspace-study-height" && Number.isFinite(event.data.height)) {
        setHeight(Math.max(700, Math.min(30000, event.data.height)))
      }
    }
    window.addEventListener("message", receive)
    return () => window.removeEventListener("message", receive)
  }, [])
  return <section className="my-10" aria-label="Current research on self-modeling of attention">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#41636b]">
      <span>Current research edition · 3 November 2026 · Wiktor Tomasik</span>
      <a href={study} target="_blank" rel="noreferrer" className="underline underline-offset-4">Open the full study</a>
    </div>
    <iframe ref={frame} title="Self-modeling of attention in a language-model feedback loop" src={`${study}?embed=1`}
      style={{ width: "100%", height, border: 0, display: "block", borderRadius: 14 }} />
  </section>
}
