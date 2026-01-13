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
        A research series exploring self-awareness and consciousness within cognitive systems—bridging artificial and
        natural intelligence through feedback loops, reinforcement learning, and internal world-models.
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

      {/* Meta */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
            Role
          </h3>
          <p className="text-lg" style={{ color: "#1a1a1a" }}>
            Lead Designer & Developer
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
            Year
          </h3>
          <p className="text-lg" style={{ color: "#1a1a1a" }}>
            2024
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
            Technologies
          </h3>
          <p className="text-lg" style={{ color: "#1a1a1a" }}>
            Next.js, React, TypeScript
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
            Status
          </h3>
          <p className="text-lg" style={{ color: "#1a1a1a" }}>
            Research & Development
          </p>
        </div>
      </div>
    </div>
  )
}
