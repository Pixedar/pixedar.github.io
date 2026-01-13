import { NextResponse } from "next/server"

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function firstImgSrc(html: string): string | null {
  const m = html.match(/<img[^>]+src="([^"]+)"/i)
  return m?.[1] ?? null
}

function escRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function tag(itemXml: string, tagName: string): string {
  const re = new RegExp(`<${escRe(tagName)}[^>]*>([\\s\\S]*?)<\\/${escRe(tagName)}>` , "i")
  const m = itemXml.match(re)
  if (!m) return ""
  let v = (m[1] ?? "").trim()
  v = v.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")
  return v.trim()
}

function attr(itemXml: string, tagName: string, attrName: string): string | null {
  const re = new RegExp(`<${escRe(tagName)}[^>]*${escRe(attrName)}="([^"]+)"[^>]*\\/?>`, "i")
  const m = itemXml.match(re)
  return m?.[1] ?? null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const feed = searchParams.get("feed")

  if (!feed) {
    return NextResponse.json({ error: "Missing feed param" }, { status: 400 })
  }

  // Basic allowlist so your endpoint can't be abused as an open proxy:
  if (!/^https:\/\/(.*\.)?medium\.com\/feed\//i.test(feed)) {
    return NextResponse.json({ error: "Feed must be a medium.com/feed/* URL" }, { status: 400 })
  }

  const res = await fetch(feed, {
    headers: {
      // Some feeds behave better with a UA
      "User-Agent": "Mozilla/5.0 (Portfolio RSS Fetcher)",
      "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    },
    // avoid caching issues while developing; change to 'force-cache' if you want
    cache: "no-store",
  })

  if (!res.ok) {
    return NextResponse.json({ error: `Failed to fetch feed (HTTP ${res.status})` }, { status: 502 })
  }

  const xml = await res.text()

  // Regex-based parsing (works on GitHub Pages builds without extra deps).
  const items: Array<{
    title: string
    link: string
    pubDate: string | null
    author: string | null
    thumbnail: string | null
    snippet: string | null
  }> = []

  const itemRe = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml))) {
    const itemXml = m[1]
    const title = tag(itemXml, "title")
    const link = tag(itemXml, "link") || tag(itemXml, "guid")
    const pubDate = tag(itemXml, "pubDate") || null
    const author = tag(itemXml, "dc:creator") || null

    const html = tag(itemXml, "content:encoded") || tag(itemXml, "description") || ""
    const snippet = html ? stripHtml(html).slice(0, 200) : null

    const thumbnail =
      attr(itemXml, "media:thumbnail", "url") ||
      attr(itemXml, "media:content", "url") ||
      firstImgSrc(html) ||
      null

    if (title && link) {
      items.push({ title, link, pubDate, author, thumbnail, snippet })
    }
  }

  return NextResponse.json({ items })
}
