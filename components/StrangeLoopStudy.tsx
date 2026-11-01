"use client"

import { useState } from "react"
import { ExternalLink, ArrowRight } from "lucide-react"

const base = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/projects/self-awareness/attention-reader`
const explorer = `${base}/explorer/index.html`
const research = "https://github.com/Pixedar/jspace-strange-loop"
const views = [
  ["loop", "Architecture & feedback", "See the recorded and live systems, then open each module."],
  ["recurrence", "What depends on self-prediction?", "Compare the learned attention model with a fixed recurrent controller."],
  ["reading", "Read with a copy", "Inspect how different histories change the selection of the same material."],
  ["controlled", "What changes in responses?", "Read matched examples with analysis of decisions, continuity and information use."],
  ["paths", "Synchronized 3D paths", "Follow measured selection, persistent state and model activity at the same time."],
  ["report", "The research explanation", "Read the question, method, meaning and limits behind the plots."],
] as const

function Figure({ file, alt, children }: { file: string; alt: string; children: React.ReactNode }) {
  return <figure className="space-y-3 rounded-2xl border border-[#d5e0e3] bg-white p-3 md:p-5">
    <a href={`${base}/figures/${file}`} target="_blank" rel="noreferrer" aria-label={`Open figure: ${alt}`}>
      {/* Static exported research figures retain their original axes and measurements. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${base}/figures/${file}`} alt={alt} loading="lazy" className="h-auto w-full rounded-lg" />
    </a>
    <figcaption className="px-1 text-sm leading-relaxed text-[#4a626e]">{children}</figcaption>
  </figure>
}

export default function StrangeLoopStudy() {
  const [active, setActive] = useState<string | null>(null)
  return <section className="mt-14 space-y-9 border-t border-[#c9d8dd] pt-10 text-[#193b4a]" aria-labelledby="strange-loop-title">
    <header className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#627781]">Strange loop in J-space · research update</p>
      <h2 id="strange-loop-title" className="text-3xl font-semibold tracking-tight md:text-5xl">One reader, many histories</h2>
      <p className="max-w-3xl text-xl leading-relaxed md:text-2xl">Can a model’s prediction of its own attention become part of how it attends?</p>
      <p className="text-sm text-[#627781]">Wiktor Tomasik · measurements completed 1 November 2026</p>
      <p className="max-w-3xl text-lg leading-relaxed text-[#4a4a4a]">I attached a small reader to a frozen language model. The reader selects recent internal activity, updates a persistent state, and learns to predict what it will select. Its prediction then helps steer the next reading. Copies share the same initial reader but develop through different histories. The experiments ask which lasting differences depend on this self-prediction, and which can also arise from ordinary memory or a recurrent controller.</p>
    </header>

    <div className="rounded-2xl border border-[#c9dce0] bg-[#f1f7f7] p-5 md:p-7">
      <h3 className="text-xl font-semibold">Two ways to observe the same reader</h3>
      <div className="mt-5 grid gap-3 text-center sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        <a className="rounded-xl border border-[#9fbcc7] bg-white p-4 hover:border-[#24618b]" href={`${explorer}?section=loop`} target="_blank" rel="noreferrer"><strong className="block">Language-model activity</strong><span className="mt-1 block text-sm">Recent internal representations</span></a>
        <span aria-hidden="true" className="text-2xl text-[#77949f]">→</span>
        <a className="rounded-xl border border-[#9fbcc7] bg-white p-4 hover:border-[#24618b]" href={`${explorer}?section=loop`} target="_blank" rel="noreferrer"><strong className="block">Reader & persistent state</strong><span className="mt-1 block text-sm">Select → summarize → update</span></a>
        <span aria-hidden="true" className="text-2xl text-[#77949f]">⇄</span>
        <a className="rounded-xl border border-[#9fbcc7] bg-white p-4 hover:border-[#24618b]" href={`${explorer}?section=loop`} target="_blank" rel="noreferrer"><strong className="block">Prediction of attention</strong><span className="mt-1 block text-sm">Learn from selection; guide the next query</span></a>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2 text-sm leading-relaxed text-[#4a626e]">
        <p><strong className="text-[#193b4a]">Recorded mode.</strong> All copies read the same saved model activity after different warm-ups. This separates their developed reading habits from differences in incoming text. The reader cannot change the already recorded language model.</p>
        <p><strong className="text-[#193b4a]">Live mode.</strong> Selected content is also written into the running model before layer 16. The reader observes the processed consequence after layer 24, closing a further feedback route through the language model. The explorer draws both architectures separately.</p>
      </div>
    </div>

    <div className="space-y-5">
      <h3 className="text-2xl font-semibold">What the experiments tell us</h3>
      <div className="space-y-3">
        <h4 className="text-xl font-semibold">1. A learned prediction becomes part of a copy’s way of reading</h4>
        <p className="max-w-3xl leading-relaxed text-[#4a4a4a]">After development, I exchanged the copies’ learned attention predictors while keeping each copy’s other state. Their readings became more alike; restoring their own predictors often partly repaired the difference. This is evidence that the predictor participates in the developed selection process. A simple private running average also preserves much of that organization, so the result does not require a detailed representation of a self.</p>
        <Figure file="02-exchange-and-repair.png" alt="Changes in differences between copies after exchanging and restoring their learned attention predictions">The plot follows differences between copies across the intervention. Exchanging predictors is a controlled change to which copy’s attention history supplies the prediction. Restoration tests whether the original relationship can recover. The report explains each distance and comparison.</Figure>
      </div>
      <div className="space-y-3 pt-4">
        <h4 className="text-xl font-semibold">2. The pattern of the intervention matters</h4>
        <p className="max-w-3xl leading-relaxed text-[#4a4a4a]">On identical model contexts, writing the reader’s selected content changes next-token predictions more than equally sized noise or rotated actions. This shows that the effect depends on where the action points in the model’s representation space. But replacing the attention forecast with a fixed recurrent system retains substantial influence. Structured influence and evidence for a specific self-model mechanism must therefore be assessed separately.</p>
        <Figure file="20-action-layer-comparison.png" alt="Influence of content-aligned, mean, rotated and noisy actions at different insertion layers">Each comparison starts from the same model context. Action size is matched. The panels compare the resulting probability change and the activity returned to the reader when the action is inserted at different depths. Larger distribution changes mean stronger influence, not better answers.</Figure>
      </div>
      <div className="space-y-3 pt-4">
        <h4 className="text-xl font-semibold">3. Changing confidence can look like changing meaning</h4>
        <p className="max-w-3xl leading-relaxed text-[#4a4a4a]">A second test reverses the relevant fact, rewords the question and swaps answer labels across eight task families. The full controller changes only one of 256 choices; its broader effect is to soften the model’s existing answer preference. A simple scale fitted on other task families explains about 59% of those margin changes. Replacing the whole selection query produces a different profile. This locates an effect in the retained selector without assigning it all to self-prediction.</p>
        <Figure file="28-counterbalanced-information.png" alt="Changes in support for the fact-correct answer across wordings and task families">Zero means no change from the unchanged model. Positive values strengthen the fact-supported answer; negative values weaken it. The left panel compares original and fresh wording after averaging reversed labels. The right panel separates task families. Error bars resample whole families rather than treating dependent copies as independent experiments.</Figure>
      </div>
    </div>

    <div className="space-y-5">
      <h3 className="text-2xl font-semibold">Explore the mechanism and the evidence</h3>
      <p className="max-w-3xl leading-relaxed text-[#4a4a4a]">Open a view below to load the interactive explorer here, or use the full-page version. It includes module details, exchange and repair, generated responses across tasks, longer lives, and three synchronized paths through measured internal signals. Playback follows recorded steps; it does not run a model or infer experience from a moving point.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {views.map(([id, title, description]) => <button type="button" key={id} onClick={() => setActive(id)} aria-pressed={active === id} className={`rounded-xl border p-5 text-left transition-colors ${active === id ? "border-[#24618b] bg-[#eaf3f7]" : "border-[#cbdbe0] bg-white hover:bg-[#f1f7f7]"}`}><span className="flex items-center justify-between gap-3 font-semibold">{title}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></span><span className="mt-2 block text-sm leading-relaxed text-[#627781]">{description}</span></button>)}
      </div>
      {active ? <div className="overflow-hidden rounded-2xl border border-[#b7ccd5] bg-[#f7fafb]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d1dfe4] px-5 py-3 text-sm">
          <a href={`${explorer}?section=${active}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold underline underline-offset-4">Open this view full-page<ExternalLink className="h-4 w-4" /></a>
          <button type="button" onClick={() => setActive(null)} className="rounded-md border border-[#9ab0ba] px-3 py-1">Close explorer</button>
        </div>
        <iframe key={active} src={`${explorer}?embed=1&section=${active}`} title={`Research explorer: ${views.find(v => v[0] === active)?.[1] || active}`} className="h-[850px] w-full border-0 md:h-[1000px]" loading="lazy" />
      </div> : <a href={explorer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#193b4a] px-5 py-3 font-semibold text-white">Open the full explorer<ExternalLink className="h-4 w-4" /></a>}
    </div>

    <aside className="rounded-2xl border-l-4 border-[#b66731] bg-[#faf4ee] p-6 space-y-3">
      <h3 className="text-lg font-semibold">What this contributes</h3>
      <p className="leading-relaxed text-[#4a4a4a]">The useful result is the separation of mechanisms: a predictor can matter to an individual reading history, while ordinary private memory preserves much of the same organization; a structured action can strongly affect a model, while its apparent semantic effect largely follows an existing preference. These comparisons make the self-model claim more precise and testable. They do not measure consciousness, subjective experience or a stable human-like personality.</p>
    </aside>
    <footer className="space-y-3 text-sm text-[#627781]">
      <div className="flex flex-wrap gap-x-6 gap-y-3 font-semibold text-[#193b4a]">
        {[["Code & reproducibility", research], ["Reader checkpoint", "https://huggingface.co/Pixedar/jspace-strange-loop"], ["Evidence dataset", "https://huggingface.co/datasets/Pixedar/jspace-strange-loop"], ["Companion Space", "https://huggingface.co/spaces/Pixedar/strange-loop-in-j-space"], ["License & sources", `${base}/LICENSING.md`]].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-4">{label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>)}
      </div>
      <p>Research repositories are private at this update. The explorer above is publicly accessible here. Wiktor Tomasik · publication edition prepared 1 November 2026, 23:52 CET (UTC+01:00). Software: AGPL-3.0-only; new research text, figures and numerical observations: CC BY-SA 4.0.</p>
    </footer>
  </section>
}
