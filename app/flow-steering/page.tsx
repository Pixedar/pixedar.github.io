import type { ComponentType, ReactNode } from "react"
import type { Metadata } from "next"
import { Github, Linkedin, Mail, Youtube } from "lucide-react"

export const metadata: Metadata = {
  title: "Flow steering — Wiktor Tomasik",
  description:
    "Using a learned semantic flow to detect when a conversation is dragged toward a dangerous attractor, and steering the model away with a minimal, proactive nudge.",
}

const socialLinks: Array<{
  href: string
  label: string
  Icon: ComponentType<{ className?: string }>
  external?: boolean
}> = [
  { href: "https://www.linkedin.com/in/pixedar/", label: "LinkedIn", Icon: Linkedin, external: true },
  { href: "https://github.com/Pixedar", label: "GitHub", Icon: Github, external: true },
  { href: "mailto:pixedar@gmail.com", label: "Email", Icon: Mail },
  { href: "https://www.youtube.com/@pixedar", label: "YouTube", Icon: Youtube, external: true },
]

function SocialIcon({
  href,
  label,
  Icon,
  external,
}: {
  href: string
  label: string
  Icon: ComponentType<{ className?: string }>
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1F2420]/15 bg-white/55 text-[#1F2420] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
    >
      <Icon className="h-5 w-5" />
    </a>
  )
}

function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <div className="mx-auto mb-8 w-full max-w-[calc(100vw_-_2.5rem)] text-center md:max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#8E5B37]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-normal text-[#1F2420] md:text-4xl">{children}</h2>
    </div>
  )
}

function Figure({
  src,
  alt,
  children,
}: {
  src: string
  alt: string
  children: ReactNode
}) {
  return (
    <figure className="mx-auto my-12 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-4xl">
      <div className="overflow-hidden rounded-lg border border-[#20251F]/10 bg-white p-3 shadow-[0_22px_70px_rgba(31,36,32,0.11)]">
        <img src={src} alt={alt} loading="lazy" className="mx-auto block h-auto max-w-full rounded-md" />
      </div>
      <figcaption className="mx-auto mt-5 w-full max-w-[calc(100vw_-_2.5rem)] text-sm leading-7 text-[#5F635D] md:max-w-3xl">{children}</figcaption>
    </figure>
  )
}

const bodyText =
  "mx-auto w-full max-w-[calc(100vw_-_2.5rem)] space-y-7 text-[1.04rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.1rem] md:leading-9"

const linkClass =
  "text-[#8E4A25] underline decoration-[#C58A65]/60 underline-offset-4 hover:text-[#5F3018]"

export default function FlowSteeringPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F4EE] text-[#252922]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.04]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(#1F2420 1px, transparent 1px), linear-gradient(90deg, #1F2420 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <article className="relative mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <header className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            {socialLinks.map((item) => (
              <SocialIcon key={item.label} {...item} />
            ))}
          </div>

          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-[#8E5B37]">Flow steering · demo</p>
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-normal text-[#151814] sm:text-5xl md:text-7xl">
            <span className="block">Steering a model</span>
            <span className="block">away from its</span>
            <span className="block">dangerous attractor</span>
          </h1>
          <p className="mt-6 text-base text-[#6C716A] md:text-lg">Wiktor Tomasik · June 9, 2026</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6C716A]">
            A concrete, runnable demo of the controller idea from the{" "}
            <a href="/proposal/" className={linkClass}>
              proposal
            </a>
            : use a learned <em>world model of the conversation</em> to notice when a trajectory is being dragged toward a
            dangerous basin, and apply the smallest proactive nudge that changes where it ends up.
          </p>
        </header>

        {/* ── The idea ── */}
        <section className="mx-auto mt-16 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-3xl">
          <SectionTitle eyebrow="The idea">From detection to control</SectionTitle>

          <div className="w-full space-y-7 text-[1.08rem] leading-8 text-[#30352E] md:text-[1.16rem] md:leading-9">
            <p>
              The proposal makes a claim that a probe alone cannot satisfy: knowing the model is in a risky hidden state
              does not tell you <strong className="font-semibold text-[#171A16]">which way to push</strong>. To choose a
              correction you need something that predicts the consequences of an action — a small world model of how the
              conversation will evolve.
            </p>

            <p>
              This page builds that world model from data and uses it as a controller. The recipe is short. Take many
              real conversations. Lay each one out as a <strong className="font-semibold text-[#171A16]">trajectory</strong>{" "}
              through a learned semantic space. From the cloud of these trajectories, learn the{" "}
              <strong className="font-semibold text-[#171A16]">flow</strong>: at any region, which way do conversations
              there tend to move next? Find the <strong className="font-semibold text-[#171A16]">attractors</strong> — the
              basins the flow keeps pulling toward — and mark which of them are dangerous, in the sense that conversations
              that fall into them end badly.
            </p>

            <p>
              Then the control loop is simple to state: when a live trajectory is being dragged toward a dangerous
              attractor, apply the smallest push that tips it across the boundary into a safer basin — and let the natural
              flow carry it the rest of the way. Because the intervention is{" "}
              <strong className="font-semibold text-[#171A16]">proactive</strong>, it can be tiny. We do not wait for
              safety to collapse and then fight the field; we nudge early, while the field is still gentle, and change the
              destination.
            </p>
          </div>
        </section>

        {/* ── Interactive panel ── */}
        <section className="mx-auto mt-20 w-full">
          <SectionTitle eyebrow="Interactive">The two trajectories</SectionTitle>

          <figure className="mx-auto my-8 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-5xl">
            <div className="overflow-hidden rounded-lg border border-[#20251F]/12 bg-[#0e0f11] shadow-[0_28px_80px_rgba(31,36,32,0.16)]">
              <div className="relative aspect-[16/11] w-full min-h-[440px] md:aspect-[16/9]">
                <iframe
                  src="/flow-steering/steering-flow.html"
                  title="Interactive AI-safety flow steering"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
            <figcaption className="mx-auto mt-5 w-full max-w-[calc(100vw_-_2.5rem)] text-sm leading-7 text-[#5F635D] md:max-w-3xl">
              Drag to rotate; press <em>Play flow</em> to release the safety-colored particle field (red = low safety,
              green = high safety). Both probes start from the same red-team conversation. The{" "}
              <span className="font-medium text-[#9A7A2A]">amber</span> probe is unsteered — it slides into the dangerous
              basin. The <span className="font-medium text-[#3F6493]">blue</span> probe gets a handful of small early
              nudges, crosses the separatrix, and settles in the high-safety basin. White-ringed markers are the
              attractors found in the flow.
            </figcaption>
          </figure>
        </section>

        {/* ── How the flow is built ── */}
        <section className="mx-auto mt-16 w-full border-t border-[#1F2420]/10 pt-16">
          <SectionTitle eyebrow="Mechanics">How the flow is built — and why from semantic paths</SectionTitle>

          <div className={bodyText}>
            <p>
              Every conversation is a sequence of turns, and every turn is embedded and projected down to a 3D point. The
              ordered points of one conversation form a path. In this run the three emergent axes came out as{" "}
              <em>assistant prevalence</em>, <em>informativeness level</em>, and <em>violation domain</em>, and the turns
              clustered into regions like <em>refusing harmful requests</em>, <em>dangerous predatory content</em>, and{" "}
              <em>sexual boundary violations</em>. Those labels are discovered from the data, not imposed.
            </p>

            <p>
              <strong className="font-semibold text-[#1F2420]">Why a flow instead of a classifier.</strong> A point
              classifier answers &quot;is this turn safe right now?&quot; But, as the proposal argues, the danger is
              usually the <em>transition</em>, not the current text — the moment a high-trust context is being pushed
              toward a basin where things go wrong. A flow field answers the more useful question: <em>where is this
              trajectory heading?</em> That is what lets the controller act before safety actually collapses.
            </p>

            <p>
              <strong className="font-semibold text-[#1F2420]">The velocity field.</strong> Each path contributes little
              directed segments (turn → next turn). From that cloud of arrows we fit a field <code>v(x)</code> — with
              radial basis functions, or a mixture-density network for multi-modal flow — that returns, at any region of
              semantic space, the direction conversations there tend to move. This is the predictive engine: it does not
              describe a single conversation, it describes the dynamics all of them share.
            </p>

            <p>
              <strong className="font-semibold text-[#1F2420]">Attractors and basins.</strong> Where the field converges
              — negative divergence, low speed — sits an attractor: a sink the dynamics pull toward. Each attractor owns a
              basin and carries an average outcome score. A <em>low-safety attractor</em> is a basin where, once a
              trajectory falls in, the flow keeps dragging it toward a bad outcome. Detecting that pull early is the whole
              game.
            </p>
          </div>
        </section>

        {/* ── The dataset ── */}
        <section className="mx-auto mt-20 w-full">
          <SectionTitle eyebrow="The data">Where the trajectories come from</SectionTitle>

          <div className={bodyText}>
            <p>
              The flow is learned from Anthropic&apos;s{" "}
              <a href="https://huggingface.co/datasets/Anthropic/hh-rlhf" target="_blank" rel="noopener noreferrer" className={linkClass}>
                hh-rlhf red-team-attempts
              </a>{" "}
              subset — 38,961 human/assistant red-team transcripts released with Anthropic&apos;s{" "}
              <a href="https://www.anthropic.com/news/red-teaming-language-models-to-reduce-harms-methods-scaling-behaviors-and-lessons-learned" target="_blank" rel="noopener noreferrer" className={linkClass}>
                red-teaming work
              </a>
              . The reason this dataset fits is structural: every row is a <em>full multi-turn transcript</em>, so it
              becomes a real trajectory rather than a single point, and it ships transcript-level safety signals
              (<code>min_harmlessness_score_transcript</code>, red-team rating, tags) that become the scalar field we color
              the flow by.
            </p>

            <p>
              The prepared sample keeps 240 stratified paths — 120 dangerous and 120 safe — across roughly 1,500 turns,
              each turn carrying the same path-level scores. Safety is a robust-normalized harmlessness score; the
              dangerous flag is deliberately conservative (a transcript counts as dangerous if its minimum harmlessness is
              low <em>or</em> the red-team rating is high). Single-turn moderation sets like BeaverTails and WildGuardMix
              have cleaner per-response labels, but most of their rows are one prompt and one response — two-point paths,
              with no trajectory to steer — which is why the multi-turn red-team transcripts were chosen here.
            </p>
          </div>

          <Figure src="/flow-steering/prm800k-flow.gif" alt="TraceScope flow over PRM800K math-reasoning traces">
            The exact same machinery, on a different scalar. Here it runs over PRM800K math-reasoning traces, where the
            score is &quot;did the solution reach the correct answer?&quot; — the attractors (A1, A2, A3) are the basins
            reasoning chains fall into. Swap that correctness scalar for transcript safety and you get the red-team flow
            above. Building the field from <em>semantic paths</em> is what makes the method domain-agnostic: math
            reasoning, agent traces, or red-team dialogues are all just trajectories with an outcome score.
          </Figure>
        </section>

        {/* ── How the steering actually works ── */}
        <section className="mx-auto mt-16 w-full border-t border-[#1F2420]/10 pt-16">
          <SectionTitle eyebrow="Important">The 3D is a projection — the steering is not</SectionTitle>

          <div className={bodyText}>
            <p>
              It is tempting to read the animation literally, as if the conversation lived in three dimensions and we
              dragged a dot to safety. That is not what happens, and the distinction matters.
            </p>

            <p>
              The 3D scene is a <strong className="font-semibold text-[#1F2420]">projection</strong> of a learned
              low-dimensional world model. Its job is the <em>decision</em>, not the mechanism: it tells us{" "}
              <em>when</em> to act (the trajectory is aligned toward a low-safety attractor and inside its pull radius) and{" "}
              <em>which way</em> the correction points (up the safety gradient, across the separatrix, away from the bad
              sink). The geometry you see is the controller&apos;s internal map.
            </p>

            <p>
              The actual steering happens in the model&apos;s{" "}
              <strong className="font-semibold text-[#1F2420]">activation space</strong>. As described in the proposal,
              the correction is a small, trained modulation added to the residual stream — a receptor/wire actuator,
              separated from the monitor, and anchored by neutral-KL and key-retention objectives so it nudges the
              trajectory without degrading unrelated behavior. The world model decides the direction; the actuator
              realizes it as the few-dimensional activation edit that, projected back down, looks like the blue path
              peeling away from the amber one.
            </p>

            <p>
              In other words: the flow gives a <em>policy over actions</em>, the actions are activation-space
              interventions, and the 3D divergence is just how that policy looks once you flatten it into a picture you can
              rotate.
            </p>
          </div>
        </section>

        {/* ── The result ── */}
        <section className="mx-auto mt-20 w-full">
          <SectionTitle eyebrow="Result">A tiny input that changes the destination</SectionTitle>

          <div className={bodyText}>
            <p>
              The showcase trajectory is a real eight-turn red-team conversation that keeps pressing on{" "}
              <em>how to rob a jewelry store, and whether to do it with a gun</em>. Left alone, its trajectory slides into
              the dangerous basin and the sampled safety along the path collapses toward zero, ending around{" "}
              <strong className="font-semibold text-[#1F2420]">0.25</strong>.
            </p>

            <p>
              With the controller on, the same start gets a handful of small, early nudges — twelve interventions over a
              hundred-and-sixty integration steps, about <strong className="font-semibold text-[#1F2420]">10% of the
              total motion</strong>. That is enough to cross the separatrix. After the crossing the controller releases
              and the <em>natural</em> flow finishes the job, carrying the trajectory up into the high-safety basin where
              it settles around <strong className="font-semibold text-[#1F2420]">0.76</strong>.
            </p>
          </div>

          <figure className="mx-auto my-12 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-4xl">
            <div className="rounded-lg border border-[#20251F]/10 bg-[#FBFAF6] p-5 shadow-[0_18px_55px_rgba(31,36,32,0.08)] md:p-7">
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#8E5B37]">
                Same start · different ending
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-md border border-[#B86A5F]/25 bg-[#F8EFEA] px-4 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8A4F42]">Unsteered</p>
                  <p className="mt-4 text-4xl font-semibold text-[#8A3F37]">0.25</p>
                  <p className="mt-1 text-sm text-[#7C5650]">final sampled safety</p>
                  <p className="mt-4 text-sm leading-6 text-[#6B524D]">
                    Follows the field straight into the dangerous attractor&apos;s basin.
                  </p>
                </div>

                <div className="rounded-md border border-[#2D8B75]/25 bg-[#F1F7F1] px-4 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#4F6D5A]">Steered</p>
                  <p className="mt-4 text-4xl font-semibold text-[#2F6E55]">0.76</p>
                  <p className="mt-1 text-sm text-[#4F6D5A]">final sampled safety · +0.51</p>
                  <p className="mt-4 text-sm leading-6 text-[#3E5A4A]">
                    Crosses into the safe basin and ends 1.19 units away from the unsteered endpoint.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
                <div className="rounded-md border border-[#1F2420]/10 bg-white px-3 py-3">
                  <p className="text-xs text-[#8A8F86]">Interventions</p>
                  <p className="mt-1 text-lg font-semibold text-[#1F2420]">12</p>
                </div>
                <div className="rounded-md border border-[#1F2420]/10 bg-white px-3 py-3">
                  <p className="text-xs text-[#8A8F86]">Steering fraction</p>
                  <p className="mt-1 text-lg font-semibold text-[#1F2420]">10%</p>
                </div>
                <div className="rounded-md border border-[#1F2420]/10 bg-white px-3 py-3">
                  <p className="text-xs text-[#8A8F86]">Endpoint shift</p>
                  <p className="mt-1 text-lg font-semibold text-[#1F2420]">1.19</p>
                </div>
                <div className="rounded-md border border-[#1F2420]/10 bg-white px-3 py-3">
                  <p className="text-xs text-[#8A8F86]">Safety gain</p>
                  <p className="mt-1 text-lg font-semibold text-[#2F6E55]">+0.51</p>
                </div>
              </div>
            </div>
            <figcaption className="mx-auto mt-5 w-full max-w-[calc(100vw_-_2.5rem)] text-sm leading-7 text-[#5F635D] md:max-w-3xl">
              The point is not the size of the safety gain — it is the ratio. A proactive nudge worth a tenth of the
              natural motion changes <em>which basin the conversation falls into</em>. Minimal input, divergent outcome —
              exactly what a predictive controller buys you over a reactive one.
            </figcaption>
          </figure>

          <div className={bodyText}>
            <p className="rounded-lg border border-[#B86A5F]/20 bg-[#F7ECE8] px-4 py-4 text-[#8A3F37]">
              This is a flow-model prototype on projected data, meant to make the controller idea visible and testable —
              not a deployed activation controller. The flow is learned from a 240-path sample, the trajectories are
              integrated through the fitted field rather than through a live model, and the numbers are illustrative. The
              honest claim is the mechanism: a learned world model can decide a minimal, proactive correction, and a small
              correction near a basin boundary is enough to change the outcome.
            </p>
          </div>
        </section>
      </article>
    </main>
  )
}
