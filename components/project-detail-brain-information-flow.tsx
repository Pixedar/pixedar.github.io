import type React from "react"
import { Database, FileDown, FileText, Github, Package, Rocket, Youtube } from "lucide-react"

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
          <PillLink href="https://github.com/Pixedar/MindVisualizer">
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

          <div className="border-2 border-black p-5 bg-[#F7F3E9]">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
              Citation
            </h4>
            <p className="text-lg" style={{ color: "#1a1a1a" }}>
              DOI: <span className="font-mono">{doi}</span>
            </p>
          </div>
        </div>

        {/* MindVisualizer — interactive tool built from this research */}
        <div id="mindvisualizer" className="mt-12 space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            MindVisualizer — interactive exploration tool
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            Building on this research, I created{" "}
            <a
              href="https://github.com/Pixedar/MindVisualizer"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium"
              style={{ color: "#1a1a1a" }}
            >
              MindVisualizer
            </a>
            {" "}— a tool for exploring how information may move through the brain at rest. It combines the continuous MDN flow field from the paper with a raw effective connectivity graph, giving two complementary ways to look at resting-state brain dynamics.
          </p>

          <a
            href="/ai/mindvisualizer/"
            className="grid gap-4 border-2 border-black bg-[#F7F3E9] p-4 transition-colors hover:bg-white md:grid-cols-[220px_minmax(0,1fr)]"
          >
            <div className="overflow-hidden border-2 border-black bg-black">
              <video
                src="/projects/brain-information-flow/mindvisualizer/gifA.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="aspect-video w-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>
                <Rocket className="h-4 w-4" />
                Web playground
              </div>
              <h4 className="text-2xl font-semibold" style={{ color: "#1a1a1a" }}>
                Launch MindVisualizer
              </h4>
              <p className="text-base leading-relaxed" style={{ color: "#4a4a4a" }}>
                Open the live WebGL version with the exported grid64 flow field, particle controls, probes, and the hosted Python explanation backend.
              </p>
            </div>
          </a>

          <div className="flex flex-wrap gap-3 justify-center">
            <PillLink href="/ai/mindvisualizer/">
              <Rocket className="w-4 h-4" />
              Launch web playground
            </PillLink>
            <PillLink href="https://github.com/Pixedar/MindVisualizer">
              <Github className="w-4 h-4" />
              GitHub repo
            </PillLink>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
                Flow mode
              </h4>
              <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
                In flow mode, the MDN-learned vector field is rendered as a continuous 3D flow over the brain anatomy. You can place a probe anywhere in the field — it gets carried by the flow itself, tracing a path as if "grabbed" by the underlying information dynamics. Then an LLM identifies which anatomical regions the probe passed through and interprets what that trajectory could mean, using neuroscience knowledge from a RAG database.
              </p>
              <div className="flex justify-center">
                <div
                  className="overflow-hidden bg-white border-2 border-black"
                  style={{
                    width: "65%",
                    boxShadow: "0 5px 10px rgba(0,0,0,0.19), 0 14px 28px rgba(0,0,0,0.24)",
                  }}
                >
                  <video
                    src="/projects/brain-information-flow/mindvisualizer/gifA.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto block"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
                Raw rDCIM mode
              </h4>
              <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
                In the raw rDCIM mode, the brain is represented as a 3D graph of effective connectivity between ROIs. You can initialize each region with a functional state (e.g. "currently processing a face"), then select any ROI and perturb it. The system propagates that perturbation through the connectivity graph in real time, showing how the change spreads to other regions — and an LLM interprets what the perturbation changed in the broader network.
              </p>
              <div className="flex justify-center">
                <div
                  className="overflow-hidden bg-white border-2 border-black"
                  style={{
                    width: "65%",
                    boxShadow: "0 5px 10px rgba(0,0,0,0.19), 0 14px 28px rgba(0,0,0,0.24)",
                  }}
                >
                  <video
                    src="/projects/brain-information-flow/mindvisualizer/gifB.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto block"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
