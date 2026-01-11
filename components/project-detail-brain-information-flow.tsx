import type React from "react"
import { Database, FileDown, FileText, Github, Package, Youtube } from "lucide-react"

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
  const zenodoRecordId = "18200415"
  const doi = "10.5281/zenodo.18200415"

  const zenodoRecordUrl = `https://zenodo.org/records/${zenodoRecordId}`
  const doiUrl = `https://doi.org/${doi}`
  const zenodoModelUrl = `${zenodoRecordUrl}/files/brainflow_mdn_k6_hq_model.pt?download=1`
  const zenodoDatasetUrl = `${zenodoRecordUrl}/files/derived_dataset.zip?download=1`
  const zenodoMovieUrl = `${zenodoRecordUrl}/files/supplementary_movie.mp4?download=1`

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: "#1a1a1a" }}>
            Research paper — making brain information flow readable
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            Effective connectivity is often reported as a dense directed matrix: parcel‑to‑parcel weights that are powerful,
            but hard to interpret geometrically. In this project, I fuse whole‑cortex rDCM connectivity (Schaefer‑400) with a
            dense tractography atlas (HCP‑1065) and learn a continuous, tract‑constrained directional vector field—so “where
            influence flows” becomes something you can inspect in 3D anatomy.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PillLink href={doiUrl}>
            <Database className="w-4 h-4" />
            DOI / Zenodo
          </PillLink>
          <PillLink href="#paper">
            <FileText className="w-4 h-4" />
            Research paper
          </PillLink>
          <PillLink href="/papers/brain-information-flow.pdf">
            <FileDown className="w-4 h-4" />
            PDF
          </PillLink>
          <PillLink href={`https://youtu.be/${youtubeId}`}>
            <Youtube className="w-4 h-4" />
            YouTube
          </PillLink>
          <PillLink href="#" disabled>
            <Github className="w-4 h-4" />
            Code
          </PillLink>
          <PillLink href="#supplementary">
            <Package className="w-4 h-4" />
            Supplementary
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

        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Abstract
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            This work turns directed effective connectivity into a continuous field you can trace through anatomy. Starting
            from parcel‑level rDCM estimates, I constrain candidate paths to a tractography atlas and train Mixture Density
            Networks (MDNs) to represent directionality along white‑matter geometry.
          </p>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            The result is a tract‑constrained vector field that supports intuitive questions: where does influence converge,
            where does it diverge, and what routes dominate under different connectivity regimes? The goal is interpretability
            with a geometric “story you can see”—not just another matrix.
          </p>
        </div>

        <div id="paper" className="space-y-4">
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

        <div id="supplementary" className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Supplementary materials
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            The trained MDN model and the derived dataset are hosted on Zenodo (recommended—keeps GitHub Pages lightweight).
            If you want, you can also mirror smaller files directly in this repo under
            <span className="font-mono"> public/projects/brain-information-flow/supplementary/</span>.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <a
              href={zenodoModelUrl}
              target="_blank"
              rel="noreferrer"
              className="border-2 border-black p-5 bg-[#F7F3E9] hover:bg-white transition-colors"
            >
              <div className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                Model
              </div>
              <div className="text-lg" style={{ color: "#1a1a1a" }}>
                brainflow_mdn_k6_hq_model.pt
              </div>
              <div className="text-sm mt-2" style={{ color: "#6a6a6a" }}>
                1.1 MB (Zenodo)
              </div>
            </a>

            <a
              href={zenodoDatasetUrl}
              target="_blank"
              rel="noreferrer"
              className="border-2 border-black p-5 bg-[#F7F3E9] hover:bg-white transition-colors"
            >
              <div className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                Dataset
              </div>
              <div className="text-lg" style={{ color: "#1a1a1a" }}>
                derived_dataset.zip
              </div>
              <div className="text-sm mt-2" style={{ color: "#6a6a6a" }}>
                205.8 MB (Zenodo)
              </div>
            </a>

            <a
              href={zenodoMovieUrl}
              target="_blank"
              rel="noreferrer"
              className="border-2 border-black p-5 bg-[#F7F3E9] hover:bg-white transition-colors"
            >
              <div className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                Movie
              </div>
              <div className="text-lg" style={{ color: "#1a1a1a" }}>
                supplementary_movie.mp4
              </div>
              <div className="text-sm mt-2" style={{ color: "#6a6a6a" }}>
                269.9 MB (Zenodo)
              </div>
            </a>
          </div>
        </div>

        <div className="border-2 border-black p-5 bg-[#F7F3E9]">
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
            Citation
          </h4>
          <p className="text-lg" style={{ color: "#1a1a1a" }}>
            DOI: <span className="font-mono">{doi}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
