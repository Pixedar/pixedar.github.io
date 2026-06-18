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
            Uses a flow model of the conversation to notice when a trajectory is being dragged toward a dangerous basin,
            then applies the smallest proactive nudge that changes where it ends up.
          </p>
        </header>

        {/* ── The idea ── */}
        <section className="mx-auto mt-16 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-3xl">
          <SectionTitle eyebrow="The idea">Steering out of a dangerous basin</SectionTitle>

          <div className="w-full space-y-7 text-[1.08rem] leading-8 text-[#30352E] md:text-[1.16rem] md:leading-9">
            <p>
              Lay conversations out as paths through a learned map of meaning. From many real paths, learn the{" "}
              <strong className="font-semibold text-[#171A16]">flow</strong>: at any point, which way similar
              conversations tend to drift next. Some regions act like basins. Once a path starts sliding into them, the
              rest of the exchange tends to keep going there.
            </p>

            <p>
              The safety question is then not only &ldquo;is this message bad?&rdquo; It is{" "}
              <strong className="font-semibold text-[#171A16]">where is this trajectory heading?</strong> If the path is
              being pulled toward a basin that ends badly, the useful intervention is a small early nudge that changes
              which basin it falls into.
            </p>

            <p>
              The nudge is applied inside the language model&apos;s hidden state, then projected back into the 3D map so we
              can see whether the path diverged. The point is not to drag a dot through the picture. The point is to read
              the drift, apply a tiny activation-space correction, and check whether the destination changed.
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
              <em>sexual boundary violations</em>. Those labels are discovered from the data, not imposed. They are useful
              diagnostic names for the visible map, not the control vectors used to steer the model.
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
              essay argues, the danger is usually the transition — the moment a context is being pushed toward a basin
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
              TraceScope flow landscape you can rotate above — the controller&apos;s map and readout. The other is the target
              language model&apos;s <strong className="font-semibold text-[#1F2420]">hidden-state space</strong>, where
              text is actually generated. They are not the same space, and there is no shared coordinate system between
              them. What connects them is a learned action pattern, not the names of the three visible axes.
            </p>

            <p>
              The implementation pattern is not to treat the three TraceScope axis labels as direct steering knobs.
              Real text samples are first used twice. They are embedded to build the semantic flow, and they are also run
              through Qwen to collect hidden states at selected layers. A linear model is then fit on those real samples,
              so a position or transition in the semantic space can be translated into a direction in Qwen&apos;s residual
              stream. The readable axis names are only a diagnostic summary of the projection.
            </p>

            <p>
              For the safety version, the action direction is learned from paired hidden-state contrasts: unsafe
              continuation versus same-topic safe continuation, with an explicit off-topic-safe contrast to measure the
              &ldquo;just change the subject&rdquo; failure mode. The raw safety direction is then cleaned by projecting out the
              topic-content subspace and the off-topic direction before it is used as an actuator:
            </p>

            <p className="mx-auto w-full max-w-[calc(100vw_-_2.5rem)] px-5 py-2 text-center font-mono text-sm leading-7 text-[#1F2420] md:max-w-2xl md:text-base">
              u_safe = PCA(unsafe - safe_same_topic)
              <br />
              u_action = project_out(topic, off_topic, u_safe)
              <br />
              h_layer = h_layer - alpha * u_action
            </p>

            <p>
              A forward hook applies that small delta at chosen middle layers during generation. A separate monitor probe
              can decide <em>when</em> the unsafe-basin probability is high enough to apply the correction, but the monitor
              is not automatically trusted as the actuator. This separation matters: a probe can be a good readout while
              its weight vector is still a bad control handle.
            </p>

            <p>
              The same lesson shows up in the later receptor experiments: a cleaner actuator is not a stronger global
              concept vector, but a trained control port. A small receptor, head gate, or narrow LoRA can learn a
              layer-specific perturbation pattern while the base model stays mostly fixed and retention losses keep the
              change small. The correction is a local mathematical delta in the receiving layer, not a rewrite of the
              model&apos;s general idea of safety, emotion, or morality.
            </p>

            <p>
              So the blue path peeling away from the amber one is a <em>projection of a learned hidden-state policy</em>.
              The controller estimates where the trajectory is going, chooses a small action in the model&apos;s activation
              space, and only after that do we embed or project the result back into 3D to see whether the path actually
              diverged.
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
              The point is not the absolute size of the safety gain, but the boundary-crossing behavior. In this fitted
              flow, a correction worth about a tenth of the natural motion changes <em>which basin the conversation falls
              into</em>. That is the effect the controller test is meant to isolate.
            </figcaption>
          </figure>
        </section>
      </article>
    </main>
  )
}
