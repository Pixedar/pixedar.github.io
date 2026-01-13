import fs from "node:fs/promises"
import path from "node:path"

const FEED_URL = process.env.MEDIUM_FEED_URL || "https://medium.com/feed/@pixedar"
const OUT_FILE = path.join(process.cwd(), "public", "data", "medium.json")

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeUrl(url) {
  try {
    const u = new URL(url)
    u.search = ""
    u.hash = ""
    return u.toString()
  } catch {
    return String(url || "").split("?")[0].split("#")[0]
  }
}

function firstImgSrc(html) {
  const m = String(html || "").match(/<img[^>]+src="([^"]+)"/i)
  return m?.[1] ?? null
}

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function tag(itemXml, tagName) {
  const re = new RegExp(`<${escRe(tagName)}[^>]*>([\\s\\S]*?)<\\/${escRe(tagName)}>` , "i")
  const m = itemXml.match(re)
  if (!m) return ""
  let v = m[1].trim()
  v = v.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")
  return v.trim()
}

function attr(itemXml, tagName, attrName) {
  const re = new RegExp(`<${escRe(tagName)}[^>]*${escRe(attrName)}="([^"]+)"[^>]*\/?>`, "i")
  const m = itemXml.match(re)
  return m?.[1] ?? null
}

function parseItems(xml) {
  const items = []
  const itemRe = /<item>([\s\S]*?)<\/item>/gi
  let m
  while ((m = itemRe.exec(xml))) {
    const itemXml = m[1]
    const title = tag(itemXml, "title")
    const link = normalizeUrl(tag(itemXml, "link") || tag(itemXml, "guid"))
    const pubDate = tag(itemXml, "pubDate") || null
    const author = tag(itemXml, "dc:creator") || null

    const html = tag(itemXml, "content:encoded") || tag(itemXml, "description") || ""
    const snippet = stripHtml(html).slice(0, 240) || null

    const thumbnail =
      attr(itemXml, "media:thumbnail", "url") ||
      attr(itemXml, "media:content", "url") ||
      firstImgSrc(html) ||
      null

    if (title && link) {
      items.push({ title, link, pubDate, author, thumbnail, snippet })
    }
  }

  return items
}

async function main() {
  console.log(`[fetch-medium] Fetching: ${FEED_URL}`)
  const res = await fetch(FEED_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (GitHub Pages build step; Medium RSS fetch)",
      "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch Medium feed (HTTP ${res.status})`)
  }
  const xml = await res.text()
  const items = parseItems(xml)

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(
    OUT_FILE,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        feed: FEED_URL,
        count: items.length,
        items,
      },
      null,
      2,
    ) + "\n",
    "utf-8",
  )

  console.log(`[fetch-medium] Wrote ${items.length} items -> ${OUT_FILE}`)
}

main().catch((err) => {
  console.error("[fetch-medium] ERROR", err)
  // Don't hard-fail deploys if Medium is temporarily down.
  // We'll still ship the site, and the component will show fallback links.
  process.exitCode = 0
})
