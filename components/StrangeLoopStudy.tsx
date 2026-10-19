import { ExternalLink } from "lucide-react"

const research = "https://github.com/Pixedar/jspace-strange-loop"

export default function StrangeLoopStudy() {
  return (
    <section className="mt-12 space-y-7" aria-labelledby="strange-loop-title">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#687785]">Research · 19 October 2026</p>
        <h2 id="strange-loop-title" className="text-2xl md:text-3xl font-semibold text-[#1a1a1a]">Strange loop in J-space</h2>
        <p className="text-xl md:text-2xl leading-relaxed text-pretty text-[#1a1a1a]">
          Can a description of a system help create the way it changes?
        </p>
        <p className="text-lg leading-relaxed text-pretty text-[#4a4a4a]">
          I built a small loop around a language model whose weights stay fixed. Its state changes how it reads the model’s activity. That reading forms a picture, and the picture becomes its next state. During learning, the picture must describe how the loop itself would move from different starting points.
        </p>
        <p className="text-lg leading-relaxed text-pretty text-[#4a4a4a]">
          An easy answer was getting in the way: the picture could identify a copy just by naming where it would end up. Removing that destination shortcut changed what developed. Some organized starts grew into loops whose own state strongly shapes their next move. Cutting the state’s influence on the reader almost removes those movements.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#d8e0e4] bg-[#f6f8f8]">
        <div className="border-b border-[#d8e0e4] px-5 py-4">
          <h3 className="font-semibold text-[#24313b]">Watch a recorded loop unfold</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#687785]">Four copies, one shared reader. Play the saved measurements, compare a control, then inspect the mechanism and causal tests.</p>
        </div>
        <iframe
          src="/strange-loop/index.html?embed=1"
          title="Recorded self-describing attention: trajectories, mechanism and causal tests"
          className="w-full h-[850px] sm:h-[770px] border-0"
          loading="lazy"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[#c8dcd8] bg-[#eef5f3] p-6 space-y-3">
          <h3 className="text-lg font-semibold text-[#245f59]">The reading has consequences</h3>
          <p className="leading-relaxed text-[#3c514e]">Sharing the reader’s attention with the language model changes 11–16% of top next-word predictions in five self-describing runs. The model’s measured loss changes only modestly, sometimes improving and sometimes worsening. A non-self-describing control changes predictions too.</p>
          <p className="leading-relaxed text-[#3c514e]">The return is still weak: the loop scarcely represents what its own attention did to the model. Controlling an operation and describing its consequences remain different achievements.</p>
        </div>
        <div className="rounded-2xl border border-[#d8e0e4] p-6 space-y-3">
          <h3 className="text-lg font-semibold text-[#24313b]">What the evidence does not establish</h3>
          <p className="leading-relaxed text-[#4a4a4a]">The regime depends on the start and training history. The picture describes a pattern of possible moves, but is not a calibrated forecast. Copies can converge on the same text, and short changes in generated wording do not establish a distinct personality.</p>
          <p className="leading-relaxed text-[#4a4a4a]">These are functional experiments. They do not measure consciousness or subjective experience. The report includes failed controls, limits and a bounded text–image–audio pilot.</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-[#1a1a1a]">The earlier findings still matter</h3>
        <p className="text-lg leading-relaxed text-pretty text-[#4a4a4a]">The project began with J-space, a way to read internal states as mixtures of word directions. A frozen feedback loop drifted toward a casual persona and sometimes invented a conversational past. A different, trained loop developed a rotating time code across reasoning chunks. Those are distinct experiments; the newest attention loop does not replace their questions. Their evidence and caveats remain in the research history.</p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#1a1a1a]">
        {[
          { label: "Code and evidence", href: research },
          { label: "Full report", href: `${research}/blob/main/REPORT.md` },
          { label: "Research history", href: `${research}/blob/main/HISTORY.md` },
          { label: "Data", href: "https://huggingface.co/datasets/Pixedar/jspace-strange-loop" },
          { label: "Open interactive study", href: "https://huggingface.co/spaces/Pixedar/strange-loop-in-j-space" },
        ].map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline underline-offset-4 opacity-80 hover:opacity-100">{link.label}<ExternalLink className="w-4 h-4" aria-hidden="true" /></a>
        ))}
      </div>
    </section>
  )
}
