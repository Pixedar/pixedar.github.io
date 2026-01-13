export const dynamic = "force-static"

import { readFile } from "node:fs/promises"
import path from "node:path"

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "data", "medium.json")
  const json = await readFile(filePath, "utf8")
  return new Response(json, {
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}
