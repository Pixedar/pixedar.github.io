"use client"

import { useEffect, useState } from "react"

type MediumItem = {
  title: string
  link: string
  pubDate?: string
  author?: string
  thumbnail?: string | null
  snippet?: string | null
}

export function ProjectDetailSelfAwareness() {
  const [items, setItems] = useState<MediumItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Put your feed here:
  const feedUrl = "https://medium.com/feed/@YOUR_USERNAME" // or /feed/publication-name

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/medium?feed=${encodeURIComponent(feedUrl)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = (await res.json()) as { items: MediumItem[] }
        if (!cancelled) setItems(data.items || [])
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load Medium feed")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-10">
      {/* Status callout */}
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-black/90 px-3 py-1 text-sm font-semibold text-white">
            Research paper in progress
          </span>
          <span className="text-sm text-black/60">
            This project is actively being developed; notes and write-ups are published as Medium articles.
          </span>
        </div>
      </div>

      {/* Medium posts */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#1a1a1a" }}>
          Articles
        </h2>
        <p className="mt-2 text-base md:text-lg" style={{ color: "#4a4a4a" }}>
          Selected posts from Medium (opens in a new tab).
        </p>

        <div className="mt-6">
          {loading ? (
            <div className="text-black/60">Loading…</div>
          ) : error ? (
            <div className="text-red-600">Couldn’t load Medium feed: {error}</div>
          ) : items.length === 0 ? (
            <div className="text-black/60">No posts found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((it) => (
                <a
                  key={it.link}
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-black/10 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex gap-4">
                    {it.thumbnail ? (
                      // Using plain img to avoid Next remote image config friction.
                      <img
                        src={it.thumbnail}
                        alt=""
                        className="h-16 w-16 flex-none rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 flex-none rounded-xl bg-black/10" />
                    )}

                    <div className="min-w-0">
                      <div className="line-clamp-2 text-lg font-semibold text-black">
                        {it.title}
                      </div>
                      {it.snippet ? (
                        <div className="mt-1 line-clamp-2 text-sm text-black/60">
                          {it.snippet}
                        </div>
                      ) : null}
                      <div className="mt-2 text-xs text-black/40">
                        {it.pubDate ? new Date(it.pubDate).toLocaleDateString() : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm font-semibold text-black/80 group-hover:text-black">
                    Read on Medium →
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
