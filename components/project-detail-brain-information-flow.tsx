import type React from "react"
import { ExternalLink, FileText, Github, PlayCircle } from "lucide-react"

function PillLink({
  href,
  children,
  disabled,
}: {
  href: string
  children: React.ReactNode
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <span
        className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black/30 bg-black/5 text-black/40"
        aria-disabled="true"
      >
        {children}
      </span>
    )
  }

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#F7F3E9] hover:bg-white transition-colors"
    >
      {children}
    </a>
  )
}

export function ProjectDetailBrainInformationFlow() {
  const youtubeId = "3UFpiJIKwHs"

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: "#1a1a1a" }}>
            Preprint + explainer video — making brain information flow readable
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            A research preprint + explainer video focused on how information propagates through brain networks, and how we
            can visualize and communicate those dynamics clearly.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PillLink href="https://doi.org/10.5281/zenodo.18200414">
            <ExternalLink className="w-4 h-4" />
            DOI / Zenodo
          </PillLink>
          <PillLink href="https://lnkd.in/dWefyu94">
            <ExternalLink className="w-4 h-4" />
            Preprint
          </PillLink>
          <PillLink href="/papers/brain-information-flow.pdf">
            <FileText className="w-4 h-4" />
            PDF
          </PillLink>
          <PillLink href={`https://youtu.be/${youtubeId}`}>
            <PlayCircle className="w-4 h-4" />
            YouTube
          </PillLink>
          <PillLink href="#" disabled>
            <Github className="w-4 h-4" />
            Code (soon)
          </PillLink>
          <PillLink href="#" disabled>
            <ExternalLink className="w-4 h-4" />
            Supplementary (soon)
          </PillLink>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Video
          </h3>
          <div className="border-2 border-black bg-black overflow-hidden">
            <div className="w-full aspect-video">
              <iframe
                className="w-full h-full"
                title="Brain Information Flow Research — YouTube"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${youtubeId}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ border: 0 }}
              />
            </div>
          </div>
          <p className="text-sm" style={{ color: "#6a6a6a" }}>
            YouTube does not allow fully removing all overlays in every context, but this embed uses a minimal,
            frameless-style player.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Abstract (short)
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            This work presents a compact way to talk about brain dynamics through the lens of directed information flow:
            how signals move, transform, and interact across regions over time. The goal is to make the analysis
            interpretable — not only as a set of numbers, but as a story you can see.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Read the paper
          </h3>
          <div className="border-2 border-black bg-white overflow-hidden">
            <div className="w-full h-[70vh]">
              <iframe
                className="w-full h-full"
                src="/papers/brain-information-flow.pdf#view=FitH"
                title="Brain Information Flow — PDF"
              />
            </div>
          </div>
          <p className="text-sm" style={{ color: "#6a6a6a" }}>
            If the PDF preview does not load in your browser, open it directly in a new tab:
            <span className="font-mono"> /papers/brain-information-flow.pdf</span>
          </p>
        </div>

        <div className="border-2 border-black p-5 bg-[#F7F3E9]">
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
            Citation
          </h4>
          <p className="text-lg" style={{ color: "#1a1a1a" }}>
            DOI: <span className="font-mono">10.5281/zenodo.18200414</span>
          </p>
        </div>
      </div>
    </div>
  )
}
