import { NextResponse } from "next/server"
import { XMLParser } from "fast-xml-parser"

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
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  })

  const data = parser.parse(xml)
  const itemsRaw = data?.rss?.channel?.item ?? []
  const items = (Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw]).map((it: any) => {
    const html = it["content:encoded"] ?? it.description ?? ""
    const snippet = html ? stripHtml(html).slice(0, 200) : null
    const thumbnail =
      it["media:thumbnail"]?.url ??
      it["media:content"]?.url ??
      firstImgSrc(html) ??
      null

    return {
      title: it.title ?? "",
      link: it.link ?? "",
      pubDate: it.pubDate ?? null,
      author: it["dc:creator"] ?? null,
      thumbnail,
      snippet,
    }
  })

  return NextResponse.json({ items })
}
