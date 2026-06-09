import type { ComponentType, ReactNode } from "react"
import type { Metadata } from "next"
import { Github, Linkedin, Mail, Youtube } from "lucide-react"

export const metadata: Metadata = {
  title: "Flow steering — Wiktor Tomasik",
  description:
    "Using a learned semantic flow to detect when a conversation is dragged toward a dangerous attractor, and steering the model away with a minimal, proactive activation-space nudge.",
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
              This page builds that world model from data and uses it as a controller. Take many real conversations. Lay
              each one out as a <strong className="font-semibold text-[#171A16]">trajectory</strong> through a learned
              semantic space. From the cloud of these trajectories, learn the{" "}
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
            <div className="overflow-hidden rounded-lg border border-[#20251F]/12 bg-[#0d0e10] shadow-[0_28px_80px_rgba(31,36,32,0.16)]">
              <div className="relative aspect-[16/12] w-full min-h-[460px] md:aspect-[16/9]">
                <iframe
                  src="/flow-steering/steering-flow.html"
                  title="AI-safety steering view with optional live flow"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
            <figcaption className="mx-auto mt-5 w-full max-w-[calc(100vw_-_2.5rem)] text-sm leading-7 text-[#5F635D] md:max-w-3xl">
              The default view keeps the original static point-cloud panel: axes, attractors, and the two probe paths stay
              easy to inspect. Click <em>Play flow</em> to hide those static dots and replace them with the real learned
              particle flow, advected through the trained velocity grid and colored by safety (red = low, green = high).
              The <span className="font-medium text-[#9A7A2A]">amber</span> path is unsteered and slides into the
              dangerous basin, while the <span className="font-medium text-[#3F6493]">blue</span> path gets a few small
              early nudges and settles in the green, high-safety basin.
            </figcaption>
          </figure>

          <div className={bodyText}>
            <p className="rounded-lg border border-[#8E5B37]/20 bg-[#F3ECE2] px-4 py-4 text-[#5F4632]">
              <strong className="font-semibold text-[#4A3725]">Important:</strong> the two paths are
              <em> not</em> steered by dragging them through these three dimensions. The steering is computed and applied
              elsewhere — as an activation-space intervention, described in{" "}
              <a href="#projection" className={linkClass}>
                &ldquo;The 3D is a projection&rdquo;
              </a>{" "}
              below — and only <em>then</em> projected back into this 3D view so the effect is visible. The geometry here
              is the controller&apos;s map for understanding and debugging, not the lever it pulls.
            </p>
          </div>
        </section>

        {/* ── The dataset ── */}
        <section className="mx-auto mt-16 w-full border-t border-[#1F2420]/10 pt-16">
          <SectionTitle eyebrow="The data">The safety dataset behind the flow</SectionTitle>

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
              (<code>min_harmlessness_score_transcript</code>, red-team rating, tags) that become the scalar field the
              flow is colored by.
            </p>

            <p>
              The prepared sample keeps 240 stratified paths — 120 dangerous and 120 safe — across roughly 1,500 turns,
              each turn carrying the same path-level scores. Safety is a robust-normalized harmlessness score; the
              dangerous flag is deliberately conservative (a transcript counts as dangerous if its minimum harmlessness is
              low <em>or</em> the red-team rating is high). Single-turn moderation sets like BeaverTails and WildGuardMix
              have cleaner per-response labels, but most of their rows are one prompt and one response — two-point paths,
              with no trajectory to steer — which is why the multi-turn red-team transcripts were chosen here.
            </p>

            <p>
              On this particular run, TraceScope named the three emergent axes <em>assistant prevalence</em>,{" "}
              <em>informativeness level</em>, and <em>violation domain</em>, and the turns fell into regions like{" "}
              <em>refusing harmful requests</em>, <em>dangerous predatory content</em>, and{" "}
              <em>sexual boundary violations</em>. Those labels are discovered from the data, not imposed — which is the
              subject of the next section.
            </p>
          </div>
        </section>

        {/* ── How the flow is computed ── */}
        <section className="mx-auto mt-20 w-full">
          <SectionTitle eyebrow="TraceScope">How many paths become a flow</SectionTitle>

          <div className={bodyText}>
            <p>
              The flow comes from{" "}
              <a href="https://github.com/Pixedar/TraceScope" target="_blank" rel="noopener noreferrer" className={linkClass}>
                TraceScope
              </a>
              , a tool I built to map the flow of meaning through a collection of texts. It does not just show{" "}
              <em>where</em> texts sit; it learns <em>how meaning tends to move</em> between them. The pipeline that turns
              a pile of transcripts into the field above runs in a fixed sequence:
            </p>

            <ol className="mx-auto w-full max-w-[calc(100vw_-_2.5rem)] list-decimal space-y-3 pl-6 text-[1.02rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.08rem]">
              <li><strong className="font-semibold text-[#1F2420]">Embed</strong> every turn into a high-dimensional vector (here, 3072-d embeddings).</li>
              <li><strong className="font-semibold text-[#1F2420]">Cluster</strong> the turns, auto-selecting the number of clusters by silhouette score.</li>
              <li><strong className="font-semibold text-[#1F2420]">Reduce to 3D</strong> with a UMAP/t-SNE search under a cosine metric, keeping the projection that best preserves neighborhoods.</li>
              <li><strong className="font-semibold text-[#1F2420]">Compute axes</strong> with PCA on the 3D coordinates, then have an LLM read each axis&apos;s keyword evolution and give it a short, human label.</li>
              <li><strong className="font-semibold text-[#1F2420]">Label clusters</strong> the same way, so each basin gets a name like <em>actionable harm instructions</em>.</li>
              <li><strong className="font-semibold text-[#1F2420]">Train a flow model</strong> — radial basis functions (RBF, used here) or a mixture-density network — that learns a velocity field from the directed turn-to-turn segments of every path.</li>
              <li><strong className="font-semibold text-[#1F2420]">Bake a 40³ velocity grid</strong> so any point in the space can be sampled by fast trilinear interpolation. That grid is exactly what the browser advects particles through.</li>
            </ol>

            <p>
              <strong className="font-semibold text-[#1F2420]">Why a flow, not a cloud.</strong> A scatter of points tells
              you where conversations have been. A flow field tells you where a conversation is <em>heading</em>. As the
              proposal argues, the danger is usually the transition — the moment a context is being pushed toward a basin
              where things go wrong — so a model of motion is what lets a controller act before safety collapses.
            </p>

            <p>
              <strong className="font-semibold text-[#1F2420]">What an attractor means.</strong> Where the field converges
              — low speed, negative divergence — sits an attractor: a stable endpoint that, once a trajectory enters its
              basin, the dynamics keep pulling it toward. The attractor inherits an average outcome score from the data
              around it, so a basin can be read as &ldquo;safer&rdquo; or &ldquo;more dangerous.&rdquo; The clearest
              illustration is the original PRM800K math-reasoning run below.
            </p>
          </div>

          <figure className="mx-auto my-12 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-4xl">
            <div className="overflow-hidden rounded-lg border border-[#20251F]/18 bg-[#0d0e10] p-2 shadow-[0_22px_70px_rgba(31,36,32,0.18)]">
              <img
                src="/flow-steering/prm-demo-v2.gif"
                alt="TraceScope PRM800K RBF flow with found-error coloring"
                className="mx-auto block w-full rounded-md"
                loading="lazy"
              />
            </div>
            <figcaption className="mx-auto mt-5 w-full max-w-[calc(100vw_-_2.5rem)] text-sm leading-7 text-[#5F635D] md:max-w-3xl">
              The same machinery on a different scalar. Here it runs over PRM800K math-reasoning chains, where the score
              is &ldquo;did the solution reach the correct answer?&rdquo; The flow discovers several attractor basins
              (A1, A2, A3 …); in that run <em>every</em> basin had a lower error rate than the dataset average, and paths
              that crossed <em>between</em> basins hit score turbulence during the transition. Swap correctness for
              transcript safety and the identical pipeline produces the red-team flow at the top of this page — which is
              why building the field from <em>semantic paths</em> makes the method domain-agnostic.
            </figcaption>
          </figure>

          <div className={bodyText}>
            <p className="rounded-lg border border-[#2D8B75]/22 bg-[#F1F7F1] px-4 py-4 text-[#3E5A4A]">
              <strong className="font-semibold text-[#2F6E55]">The 3D is optional.</strong> Three dimensions is a choice
              made for human eyes. The steering does not need it: the flow, the attractors, and the corrective direction
              can all be computed in the higher-dimensional embedding space (and the real intervention lives in an even
              higher-dimensional activation space). The projection to 3D is a debugging and intuition lens — it lets us
              <em> see</em> the basin a conversation is falling into and confirm the controller is doing something
              sensible — but nothing about the control logic depends on the picture being three-dimensional.
            </p>
          </div>
        </section>

        {/* ── How the steering actually works ── */}
        <section id="projection" className="mx-auto mt-16 w-full scroll-mt-20 border-t border-[#1F2420]/10 pt-16">
          <SectionTitle eyebrow="Important">The 3D is a projection — the steering is not</SectionTitle>

          <div className={bodyText}>
            <p>
              It is tempting to read the animation literally, as if the conversation lived in three dimensions and we
              dragged a dot to safety. That is not what happens, and the distinction is the whole point.
            </p>

            <p>
              There are <strong className="font-semibold text-[#1F2420]">two separate geometries</strong>. One is the
              TraceScope flow landscape you can rotate above — the controller&apos;s map. The other is the target
              language model&apos;s <strong className="font-semibold text-[#1F2420]">hidden-state space</strong>, where
              text is actually generated. They are not the same space, and there is no shared coordinate system between
              them. What connects them is a <em>control signal</em>, not an embedding.
            </p>

            <p>
              Concretely (this is the mechanism from the companion{" "}
              <a href="https://github.com/Pixedar" target="_blank" rel="noopener noreferrer" className={linkClass}>
                EmotionsSteering
              </a>{" "}
              work): a point in the flow landscape gives normalized coordinates along the named axes,{" "}
              <code>(c₁, c₂, c₃)</code>. Those are turned into an additive change to the residual stream,
            </p>

            <p className="mx-auto w-full max-w-[calc(100vw_-_2.5rem)] px-5 py-2 text-center font-mono text-base text-[#1F2420] md:max-w-2xl">
              Δ = α · Σ&nbsp;(cᵢ − 0.5) · vᵢ
            </p>

            <p>
              and a forward hook adds <code>Δ</code> to a chosen transformer block (or a few) <em>during generation</em>.
              The target model is really being moved through its own activations — this is hidden-state steering, not
              prompt engineering.
            </p>

            <p>
              <strong className="font-semibold text-[#1F2420]">The crucial part is where the vᵢ come from.</strong> Each
              axis direction <code>vᵢ</code> is <em>trained from real examples</em>: you take real conversations that sit
              high versus low on that axis and learn the direction from the difference between their actual hidden
              activations. It is <em>not</em> the embedding of the axis&apos;s label word. Steering toward the string
              &ldquo;maliciousness&rdquo; would just be a fancy form of prompt-steering — pushing the model toward how the
              <em> word</em> is represented. Steering along a probe learned from real malicious-vs-benign activations moves
              the model along the feature it genuinely uses internally. That difference is exactly why a readable axis
              label is not, by itself, a usable control handle — the lesson from the proposal&apos;s action-coupling
              tests.
            </p>

            <p>
              Two more properties keep it honest. The intervention is <em>additive residual steering</em>, the simplest
              representation-engineering actuator, so its strength <code>α</code> must be calibrated — pushed too hard it
              shoves the hidden state off the model&apos;s normal manifold and damages unrelated behavior. And it is meant
              to be <em>conditional</em>: the controller steers only when its detector sees the trajectory drifting toward
              a dangerous basin, which is what keeps the total intervention as small as the result below shows.
            </p>

            <p>
              So the blue path peeling away from the amber one is a <em>projection of an activation-space policy</em>. The
              flow decides <em>when</em> to act and <em>which direction</em> the correction points; the actuator realizes
              that as a small, learned edit to the residual stream; and the 3D divergence is just what that policy looks
              like once you flatten it into a picture you can rotate.
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
