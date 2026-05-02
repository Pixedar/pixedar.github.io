import { ArrowUpRight, Brain, Home, Server } from "lucide-react"

const liveUrl =
  process.env.NEXT_PUBLIC_MINDVIS_LIVE_URL ??
  "https://pixedar-mindvisualizer-vtk.hf.space/"

const spaceUrl = "https://huggingface.co/spaces/Pixedar/mindvisualizer-vtk"

const basePath = () => (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")

export function MindVisualizerLive() {
  const homeHref = `${basePath()}/` || "/"

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-white/10 bg-[#0B0F12] px-4 py-3 md:px-6">
        <a
          href={homeHref}
          className="inline-flex h-10 w-10 items-center justify-center border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10"
          title="Home"
        >
          <Home className="h-5 w-5" />
        </a>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight md:text-2xl">MindVisualizer</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              Python VTK runtime
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              Hugging Face Space
            </span>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <a
            href={spaceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Space
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 border border-[#6EE7B7]/40 bg-[#123B33] px-3 text-sm font-medium text-[#D8FFF0] transition-colors hover:bg-[#185344]"
          >
            Open
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="h-[calc(100vh-4rem)] bg-black">
        <iframe
          src={liveUrl}
          title="MindVisualizer live Python session"
          className="h-full w-full border-0"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </section>
    </main>
  )
}
