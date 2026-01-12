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

export function ProjectDetailSelfAwareness() {
  const [items, setItems] = useState<MediumItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ your real feed (Medium supports this format officially)
  const feedUrl = "https://medium.com/feed/@pixedar" // :contentReference[oaicite:2]{index=2}

  // ✅ the exact 3 URLs you gave (and in the order you want)
  const pinned = [
    "https://medium.com/@pixedar/part-1-inside-the-loop-decoding-the-mystery-of-self-awareness-in-cognitive-systems-1e2e1716abe7",
    "https://medium.com/@pixedar/part-2-reinforcement-learning-within-the-ais-mind-c2d0f22a458f",
    "https://medium.com/@pixedar/part-3-seeing-the-world-inside-398ffc9db3ac",
  ].map(normalizeUrl)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/medium?feed=${encodeURIComponent(feedUrl)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = (await res.json()) as { items: MediumItem[] }
        const feedItems = (data.items || []).map((it) => ({
          ...it,
          link: normalizeUrl(it.link),
        }))

        // ✅ keep only your 3 pinned posts (and keep your order 1,2,3)
        const pinnedOnly = feedItems
          .filter((it) => pinned.includes(it.link))
          .sort((a, b) => pinned.indexOf(a.link) - pinned.indexOf(b.link))

        // fallback: if Medium feed parsing changes, show latest 3 instead
        const finalItems = pinnedOnly.length ? pinnedOnly : feedItems.slice(0, 3)

        if (!cancelled) setItems(finalItems)
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

  // ...keep the rest of your component UI the same
  return null
}
