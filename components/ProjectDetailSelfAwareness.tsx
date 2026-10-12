"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"

type MediumItem = {
  title: string
  link: string
  pubDate?: string | null
  author?: string | null
  thumbnail?: string | null
  snippet?: string | null
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url)
    u.search = ""
    u.hash = ""
    return u.toString()
  } catch {
    return url.split("?")[0].split("#")[0]
  }
}

function formatDate(d?: string | null) {
  if (!d) return null
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

export function ProjectDetailSelfAwareness() {
  const [items, setItems] = useState<MediumItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // The 3 posts you want to show (and the order you want).
  const pinned = useMemo(
    () =>
      [
        "https://medium.com/@pixedar/part-1-inside-the-loop-decoding-the-mystery-of-self-awareness-in-cognitive-systems-1e2e1716abe7",
        "https://medium.com/@pixedar/part-2-reinforcement-learning-within-the-ais-mind-c2d0f22a458f",
        "https://medium.com/@pixedar/part-3-seeing-the-world-inside-398ffc9db3ac",
      ].map(normalizeUrl),
    [],
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        // GitHub Pages is static (output: "export"), so we can't rely on /api/* routes.
        // We fetch a pre-generated JSON file from /public/data/medium.json instead.
        const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")
        const res = await fetch(`${basePath}/data/medium.json`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed to load Medium data (HTTP ${res.status})`)

        const data = (await res.json()) as { items?: MediumItem[] }
        const feedItems = (data.items ?? []).map((it) => ({ ...it, link: normalizeUrl(it.link) }))

        // Keep only your pinned posts (and keep your order 1,2,3)
        const pinnedOnly = feedItems
          .filter((it) => pinned.includes(it.link))
          .sort((a, b) => pinned.indexOf(a.link) - pinned.indexOf(b.link))

        // Fallback: if the feed structure changes, show the latest 3
        const finalItems = pinnedOnly.length ? pinnedOnly : feedItems.slice(0, 3)

        if (!cancelled) setItems(finalItems)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load Medium posts")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [pinned])

  return (
    <div className="mt-2">
      {/* Intro */}
      <p className="text-xl md:text-2xl leading-relaxed text-pretty mb-10" style={{ color: "#4a4a4a" }}>
        A 3-part experimental research series (published on Medium) exploring self-referential neural networks and internal world formation. Using reversed autoencoders, sensitivity maps, and internal reinforcement learning, I combine reconstruction objectives with exploration/divergence pressures—creating feedback loops that produce incomplete self-models and evolving internal “worlds.” The work bridges rigorous ML dynamics with visual, generative exploration, and is accompanied by a longer research manuscript currently under peer review.
      </p>

      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: "#1a1a1a" }}>
          Medium series
        </h2>
        <a
          href="https://medium.com/@pixedar"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 opacity-80 hover:opacity-100"
          style={{ color: "#1a1a1a" }}
        >
          View profile <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center gap-3 text-base" style={{ color: "#4a4a4a" }}>
          <Loader2 className="w-5 h-5 animate-spin" /> Loading articles…
        </div>
      ) : null}

      {/* Error (still render fallback links) */}
      {error ? (
        <div
          className="mb-6 rounded-xl p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.12)" }}
        >
          <p className="text-sm" style={{ color: "#4a4a4a" }}>
            Couldn’t load the Medium feed automatically: <span className="font-mono">{error}</span>
          </p>
          <p className="text-sm mt-2" style={{ color: "#4a4a4a" }}>
            You can still read the series here:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            {pinned.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                  style={{ color: "#1a1a1a" }}
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Cards */}
      <div className="grid gap-6">
        {items.map((it) => {
          const date = formatDate(it.pubDate)
          return (
            <a
              key={it.link}
              href={it.link}
              target="_blank"
              rel="noreferrer"
              className="group block"
            >
              <div
                className="rounded-2xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]"
                style={{
                  border: "2px solid rgba(0,0,0,0.85)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                  backgroundColor: "rgba(255,255,255,0.35)",
                }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="relative w-full md:w-[280px] h-[180px] md:h-auto shrink-0">
                    {it.thumbnail ? (
                      <Image src={it.thumbnail} alt={it.title} fill className="object-cover" />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: "linear-gradient(135deg, rgba(7,21,34,0.95) 0%, rgba(11,37,56,0.95) 100%)",
                        }}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="p-5 md:p-6 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3
                        className="text-xl md:text-2xl font-bold text-balance"
                        style={{ color: "#1a1a1a" }}
                      >
                        {it.title}
                      </h3>
                      <ExternalLink className="w-5 h-5 opacity-70 shrink-0" style={{ color: "#1a1a1a" }} />
                    </div>

                    <div className="mt-2 text-sm opacity-80" style={{ color: "#4a4a4a" }}>
                      {date ? <span>{date}</span> : null}
                      {date && it.author ? <span className="mx-2">•</span> : null}
                      {it.author ? <span>{it.author}</span> : null}
                    </div>

                    {it.snippet ? (
                      <p className="mt-4 text-base leading-relaxed text-pretty" style={{ color: "#4a4a4a" }}>
                        {it.snippet}…
                      </p>
                    ) : null}

                    <div className="mt-5 text-sm font-semibold underline underline-offset-4" style={{ color: "#1a1a1a" }}>
                      Read on Medium
                    </div>
                  </div>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      
      <section className="mt-12 space-y-6" aria-labelledby="strange-loop-title">
        <div className="space-y-3">
          <h2 id="strange-loop-title" className="text-2xl md:text-3xl font-semibold" style={{ color: "#1a1a1a" }}>
            Strange loop in J-space
          </h2>
          <p className="text-xl md:text-2xl leading-relaxed text-pretty" style={{ color: "#1a1a1a" }}>
            What a language model builds when a description of itself is looped back into itself.
          </p>
          <p className="text-lg leading-relaxed text-pretty" style={{ color: "#4a4a4a" }}>
            Can a system represent its own behaviour and use that representation to change the behaviour it describes?
            I built four loops inside Qwen3 language models, starting with J-space: a way of reading internal states
            as combinations of word directions. It is a candidate bottleneck for a self-description; the later trained
            loop learns a compact state to carry between segments of the model’s own reasoning.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2" aria-label="Four ways of closing the loop">
          {[
            { title: "Reflective loop", steps: ["Sampled thought", "Reflection in J-space words", "Nudge the next thought"], note: "The reflection becomes feedback; nothing is trained." },
            { title: "The ring", steps: ["Internal state, without text", "Learning self-model predicts what follows", "Feed back its current surprise"], note: "The self-model keeps learning as the state changes." },
            { title: "Decision loop", steps: ["Fixed prompt at a decision position", "Read the J-space code", "Write the code back into the model"], note: "Repeat the read–write loop with the language model frozen." },
            { title: "Trained self-describing loop", steps: ["A segment of the model’s own reasoning", "Read a compact state and forecast the next", "Write state and forecast into the next segment"], note: "Train the reader, writers and self-model; keep the language model frozen." },
          ].map((loop) => (
            <div
              key={loop.title}
              className="rounded-2xl p-5 flex flex-col"
              style={{ border: "2px solid rgba(0,0,0,0.85)", backgroundColor: "rgba(255,255,255,0.35)" }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: "#1a1a1a" }}>{loop.title}</h3>
              <ol className="space-y-2 flex-1" style={{ color: "#1a1a1a" }}>
                {loop.steps.map((step, index) => (
                  <li key={step} className="text-sm text-center">
                    {index > 0 ? <span className="block mb-2 opacity-60" aria-hidden="true">↓</span> : null}
                    <span className="block rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(0,0,0,0.05)" }}>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
                <span aria-hidden="true">↺ </span>{loop.note}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-4 text-lg leading-relaxed text-pretty" style={{ color: "#4a4a4a" }}>
          <p>
            <strong style={{ color: "#1a1a1a" }}>Loops keep what they can regenerate.</strong> A well-matched stranger’s
            self-description is held at least as well as the model’s own. Frozen loops preserve self-reproducing
            discourse and stance while losing the evidence. In the ring, a learning self-model’s current surprise is
            a learned exit from attractors—states the loop keeps returning to—with more exploration in the pooled
            controls than momentum, random input or stale surprise. This does not give it privileged self-knowledge.
          </p>
          <p>
            <strong style={{ color: "#1a1a1a" }}>Self-specificity needs private state.</strong> Where everything is
            recomputed from the input and the last write, the compact self-state adds no predictive information.
            The trained loop carries state between reasoning segments. Asked simply to be predictable, it can collapse
            and hide information from its own self-model’s metric. Asked to distinguish its own moments, it instead
            develops a multi-frequency rotation: a word clock that, in most loops, follows recall, hedged exploration,
            assertion and conclusion (under the strongest pressure at 8B it cycles through unrelated topics instead).
            Asked to distinguish itself from other traces, it develops a persistent identity code.
          </p>
        </div>

        <figure
          className="rounded-2xl overflow-hidden"
          style={{ border: "2px solid rgba(0,0,0,0.85)", boxShadow: "0 10px 24px rgba(0,0,0,0.18)", backgroundColor: "rgba(255,255,255,0.35)" }}
        >
          <a href="/projects/strange-loop-j-space/phaseB_word_clock_14b.png" target="_blank" rel="noreferrer" className="block" aria-label="Open the word-clock figure at full size in a new tab">
            <Image
              src="/projects/strange-loop-j-space/phaseB_word_clock_14b.png"
              alt="14B self-state word readings across reasoning segments: a plain loop compared with a fed-back forecast under discriminative pressure. The latter moves from maybe toward renowned and universally, then Ultimately and concludes."
              width={1960}
              height={980}
              sizes="(max-width: 768px) 100vw, 1000px"
              className="w-full h-auto"
            />
          </a>
          <figcaption className="p-4 md:p-5 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
            The word clock at 14B, read through the model’s vocabulary. This plane illustrates the reasoning arc;
            the robust finding is the multi-frequency rotation, replicated at 8B and 14B, rather than a perfect circle.
            {" "}<a href="/projects/strange-loop-j-space/phaseB_word_clock_14b.png" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4" style={{ color: "#1a1a1a" }}>View full-size figure</a>.
          </figcaption>
        </figure>

        <p className="text-lg leading-relaxed text-pretty" style={{ color: "#4a4a4a" }}>
          <strong style={{ color: "#1a1a1a" }}>A fed-back self-forecast becomes a cause.</strong> Under discriminative
          pressure, the next state moves toward the forecast written into it, more than with a matched memory channel:
          the system helps make its prediction of itself come true. Strong pressure lets the self-model take over the
          state, at the expense of what the reasoning is about. Mild pressure preserves both enactment and content,
          in the 8B and 14B experiments.
        </p>

        <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.12)", color: "#4a4a4a" }}>
          <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>Limits and corrections</h3>
          <p className="text-base leading-relaxed">
            These are functional measures, not evidence of experience. The trained-loop results cover 8B and 14B,
            with limited seed replication and training on fixed reasoning traces. Free generation loses the topic;
            the discrimination objective that shapes the code is chosen. The decision loops did not improve task accuracy.
          </p>
          <details className="text-sm leading-relaxed">
            <summary className="cursor-pointer font-semibold underline underline-offset-4" style={{ color: "#1a1a1a" }}>What changed after the controls</summary>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Early self-specificity claims reduced to resemblance, not ownership. Consciousness themes came from the prompting frame.</li>
              <li>“Exact” fixed points were precision-limited near-fixed points. Word transport is a candidate explanation, not a validated mechanism; entity rankings differ at 14B, and persona drift is a small component.</li>
              <li>Reliance on one’s own state versus another’s is not the benefit over a constant input. Early high self-prediction scores reflected collapse; dimensionality reduction came from any extra channel.</li>
              <li>Return after perturbation was measured with the original text supplied, not in free generation. Fresh forecasts beating stale ones need not imply self-knowledge. A single clock plane is seed-sensitive; the rotation fit is more robust.</li>
              <li>The strongest self-model made prediction of the model’s reasoning worse than a constant input.</li>
            </ul>
          </details>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold" style={{ color: "#1a1a1a" }}>
          {[
            { label: "Code & full report", href: "https://github.com/Pixedar/jspace-strange-loop" },
            { label: "Research data", href: "https://huggingface.co/datasets/Pixedar/jspace-strange-loop" },
            { label: "Earlier writing", href: "https://medium.com/@pixedar" },
          ].map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline underline-offset-4 opacity-80 hover:opacity-100">
              {link.label}<ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

    </div>
  )
}
