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
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>Release 3.0 · 2026</p>
          <p className="text-xl md:text-2xl leading-relaxed text-pretty" style={{ color: "#1a1a1a" }}>
            What happens inside a language model when a compact description of its own state is fed back into it?
          </p>
          <p className="text-lg leading-relaxed text-pretty" style={{ color: "#4a4a4a" }}>
            I built three systems inside frozen Qwen models, starting with J-space: a way of reading internal states as combinations of word directions. The later loops learn a compact 32-number state, first to carry the model’s own thinking and then to decide what it reads.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2" aria-label="Three ways of closing the loop">
          {[
            { title: "Frozen J-space loop", steps: ["Read a prompt", "Describe the internal state in words", "Write the description back and read again"], note: "Nothing is trained; the loop keeps what it can regenerate." },
            { title: "Trained self-describing loop", steps: ["A segment of the model’s own thinking", "Read 32 numbers and forecast the next state", "Write state and forecast into the next segment"], note: "Train the small parts around the model; keep the language model frozen." },
            { title: "A state that steers reading", steps: ["Read a stream of short updates", "Keep a compact state of what matters", "Use the state to steer the next read"], note: "Compare choosing which update enters with reading everything as plain text." },
          ].map((loop) => (
            <div key={loop.title} className="rounded-2xl p-5 flex flex-col" style={{ border: "2px solid rgba(0,0,0,0.85)", backgroundColor: "rgba(255,255,255,0.35)" }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "#1a1a1a" }}>{loop.title}</h3>
              <ol className="space-y-2 flex-1" style={{ color: "#1a1a1a" }}>
                {loop.steps.map((step, index) => (
                  <li key={step} className="text-sm text-center">
                    {index > 0 ? <span className="block mb-2 opacity-60" aria-hidden="true">↓</span> : null}
                    <span className="block rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(0,0,0,0.05)" }}>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}><span aria-hidden="true">↺ </span>{loop.note}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 text-lg leading-relaxed text-pretty" style={{ color: "#4a4a4a" }}>
          <p><strong style={{ color: "#1a1a1a" }}>The frozen loop turns inward.</strong> Writing the model’s word-level reading of itself back into it keeps how the model speaks and loses what it was asked about. Discourse, stance and a casual voice survive while names, places and the evidence of the prompt fade.</p>
          <p><strong style={{ color: "#1a1a1a" }}>A self-state becomes a time code.</strong> Pushed to be predictable to its own self-model by distinguishing its moments, the trained 32-number state rotates through the stages of a thought — recalling, hedging, asserting, concluding. Under the strongest pressure at 8B it cycles through unrelated topics instead. When the self-forecast is fed back, it is enacted: the model makes its prediction of itself come true. Mild pressure preserves both enactment and content at 8B and 14B.</p>
          <p><strong style={{ color: "#1a1a1a" }}>Newest: the state comes to represent what matters and steers the reading through it.</strong> Given control over which update the model takes in, the state learns which item matters. Editing that representation redirects the reading, through the reading alone: the same edit given only to the answering step does nothing. After the edit the loop keeps following the new item by itself. It also learns to read again when its own read failed.</p>
          <p><strong style={{ color: "#1a1a1a" }}>Reading everything changes what the state learns.</strong> When the model sees all the updates as plain text, the state learns to switch on the model’s own attention to what the text names, but not to carry the target itself. Once the text no longer names the item, the state does not take over that role. The channel matters: direct control of reading lets the state learn what matters; writing it into the text stream teaches it to switch selection on.</p>
        </div>

        <figure className="rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(0,0,0,0.85)", boxShadow: "0 10px 24px rgba(0,0,0,0.18)", backgroundColor: "rgba(255,255,255,0.35)" }}>
          <a href="https://github.com/Pixedar/jspace-strange-loop/raw/main/figures/selection_loop.png" target="_blank" rel="noreferrer" className="block" aria-label="Open the selection-loop figure at full size in a new tab">
            <img src="https://github.com/Pixedar/jspace-strange-loop/raw/main/figures/selection_loop.png" alt="The selection loop: a compact state steers what a frozen language model reads, with restricted or open access to the updates" className="w-full h-auto" loading="lazy" />
          </a>
          <figcaption className="p-4 md:p-5 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>The third system compares a state that chooses which update enters with a state written into the model while it reads everything as plain text.</figcaption>
        </figure>

        <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.12)", color: "#4a4a4a" }}>
          <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>Limits</h3>
          <p className="text-base leading-relaxed">These are functional measures of what states carry, predict and cause; nothing here measures experience. The trained loop learns on fixed recordings of the model’s thinking, and free generation still loses the topic. The time code depends on what the self-model must distinguish; enactment may reflect learning to copy the forecast channel. The newest experiments use a purpose-built task and small models (0.5B to 3B). Restricted access makes selection necessary by design, and the open-access runs had limited training, so they show what did not emerge in that time, not what cannot.</p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold" style={{ color: "#1a1a1a" }}>
          {[
            { label: "Code · Release 3.0", href: "https://github.com/Pixedar/jspace-strange-loop" },
            { label: "Full report", href: "https://github.com/Pixedar/jspace-strange-loop/blob/main/REPORT.md" },
            { label: "Research data", href: "https://huggingface.co/datasets/Pixedar/jspace-strange-loop" },
            { label: "Earlier writing", href: "https://medium.com/@pixedar" },
          ].map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline underline-offset-4 opacity-80 hover:opacity-100">{link.label}<ExternalLink className="w-4 h-4" aria-hidden="true" /></a>
          ))}
        </div>
      </section>

    </div>
  )
}
