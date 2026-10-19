"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink } from "lucide-react"

const research = "https://github.com/Pixedar/jspace-strange-loop"

export default function StrangeLoopStudy() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(1100)

  useEffect(() => {
    function resize(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type !== "jspace-study-height") return
      const next = event.data.height
      if (typeof next === "number" && Number.isFinite(next) && next > 300 && next < 5000) {
        setHeight(Math.ceil(next))
      }
    }
    window.addEventListener("message", resize)
    return () => window.removeEventListener("message", resize)
  }, [])

  return (
    <section className="mt-12 space-y-7" aria-labelledby="strange-loop-title">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#687785]">Research · 2026</p>
        <h2 id="strange-loop-title" className="text-2xl md:text-3xl font-semibold text-[#1a1a1a]">Strange loop in J-space</h2>
        <p className="text-xl md:text-2xl leading-relaxed text-pretty text-[#1a1a1a]">What changes when a feedback loop learns to describe itself?</p>
        <p className="text-lg leading-relaxed text-pretty text-[#4a4a4a]">I built a small network that repeatedly reads a language model’s internal activity. It compresses each reading into a numerical summary, which sets its next control state. That state changes what the network reads next. The language model’s weights stay fixed while the small network learns.</p>
        <p className="text-lg leading-relaxed text-pretty text-[#4a4a4a]">During training, the summary must distinguish how this loop would respond to different starting states. There is a shortcut: every starting state might lead to the same destination, so naming that destination is enough. Subtracting the common destination from the training target leaves the differences between possible responses. Some trained loops then develop a strong dependence on their own state.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#d8e0e4] bg-white">
        <div className="border-b border-[#d8e0e4] bg-[#f6f8f8] px-5 py-4">
          <h3 className="font-semibold text-[#24313b]">Change one thing: the starting state</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#596873]">Compare measured responses on fixed text, inspect the control, and test which feedback path causes the movements.</p>
        </div>
        <iframe
          ref={frame}
          src="/strange-loop/index.html?embed=1"
          title="Starting-state interventions and feedback-path cuts in a language-model loop"
          className="w-full border-0"
          style={{ height }}
          loading="lazy"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[#c8dcd8] bg-[#eef5f3] p-6 space-y-3">
          <h3 className="text-lg font-semibold text-[#245f59]">What causes the movements?</h3>
          <p className="leading-relaxed text-[#3c514e]">In the strongest run, holding the reader’s state input fixed reduces large movements from 26.6% to 1.2% of steps. Holding fixed the separate route into the language model’s attention leaves 26.4%. Most of these movements depend on the state changing the small network’s reading.</p>
          <p className="leading-relaxed text-[#3c514e]">The reading can also affect the language model. Sharing its attention weights inside the model changes the most likely next token—a word or part of a word—at 11–16% of positions across five runs. The control changes predictions too. Influence on the model is established; improved performance from self-description is not.</p>
        </div>
        <div className="rounded-2xl border border-[#d8e0e4] p-6 space-y-3">
          <h3 className="text-lg font-semibold text-[#24313b]">What remains unresolved?</h3>
          <p className="leading-relaxed text-[#4a4a4a]">The result depends on the starting interface and training history. Predicted and measured response patterns agree, but the predictions have large scale errors. Feedback through the language model remains weak, and copies sharing one interface can converge on the same text.</p>
          <p className="leading-relaxed text-[#4a4a4a]">These experiments study feedback, representation and behavior. They do not measure consciousness or subjective experience. The report includes all final runs, unsuccessful controls, generated-text comparisons and a separate experiment with text, images and audio.</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-[#1a1a1a]">Words, memory and evidence selection</h3>
        <p className="text-lg leading-relaxed text-pretty text-[#4a4a4a]">J-space is a way to read model states as weighted word directions. Repeatedly feeding that word-based reading back into a model favors a casual persona and can produce references to a conversation that never happened. A different system, trained to carry memory between reasoning segments, develops a rotating time code. Another learns which evidence to read. These mechanisms answer separate questions; their experiments and limitations are documented alongside the attention-feedback study.</p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#1a1a1a]">
        {[
          { label: "Code and evidence", href: research },
          { label: "Full report", href: `${research}/blob/main/REPORT.md` },
          { label: "Research history", href: `${research}/blob/main/HISTORY.md` },
          { label: "Data", href: "https://huggingface.co/datasets/Pixedar/jspace-strange-loop" },
          { label: "Open interactive experiment", href: "https://huggingface.co/spaces/Pixedar/strange-loop-in-j-space" },
        ].map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline underline-offset-4 opacity-80 hover:opacity-100">{link.label}<ExternalLink className="w-4 h-4" aria-hidden="true" /></a>
        ))}
      </div>
    </section>
  )
}
