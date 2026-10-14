"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { ProjectDetailEmotionAttractor } from "@/components/project-detail-emotion-attractor"
import { ProjectDetailBrainInformationFlow } from "@/components/project-detail-brain-information-flow"
import { ProjectDetailSelfAwareness } from "@/components/ProjectDetailSelfAwareness"
import { ProjectDetailGenerativeWallpaper } from "@/components/project-detail-generative-wallpaper"

interface Project {
  id: number
  title: string
  shortDescription: string
  description: string
  media: string
  mediaType: "image" | "video"
}

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (project) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [project])

  if (!project) return null

  // Prefer stable identifiers over string matching.
  // Title-based checks are fragile (small copy changes can break the routing).
  const isEmotionAttractor = project.id === 1
  const isBrainInformationFlow = project.id === 2
  const isSelfAwareness = project.id === 3
  const isGenerativeWallpaper = project.id === 4

  return (
    <div
      className="fixed inset-0 z-50 animate-in fade-in duration-300"
      style={{ backgroundColor: "#F2EFE9" }}
      onClick={onClose}
    >
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.05) 100%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative w-full h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Close Button - Fixed position */}
        <button
          onClick={onClose}
          className="fixed top-6 right-6 md:top-8 md:right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
          style={{
            backgroundColor: "rgba(26, 26, 26, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Top Section - Hero Image */}
        <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
          {/* Card Background - Dark cinematic gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #071522 0%, #0B2538 100%)",
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none z-20 opacity-[0.35] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.8' numOctaves='7' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: "120px 120px",
            }}
          />

          {/* Media */}
          <div className="absolute inset-0 z-0">
            {project.mediaType === "video" ? (
              <video
                src={project.media}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover opacity-50"
              />
            ) : (
              <Image
                src={project.media || "/placeholder.svg"}
                alt={project.title}
                fill
                className="object-cover opacity-50"
              />
            )}
          </div>
        </div>

        {/* Bottom Section - Content */}
        <div className="relative bg-[#F2EFE9] px-8 py-12 md:px-16 md:py-16">
          <div className="max-w-4xl mx-auto">
            {(isEmotionAttractor || isBrainInformationFlow || isSelfAwareness || isGenerativeWallpaper || project.id === 5) ? (
              <>
                {/* Project Title */}
                <h1 className="text-5xl md:text-7xl font-bold mb-8 text-balance" style={{ color: "#1a1a1a" }}>
                  {project.title}
                </h1>

                {isEmotionAttractor ? <ProjectDetailEmotionAttractor /> : null}
                {isBrainInformationFlow ? <ProjectDetailBrainInformationFlow /> : null}
                {isSelfAwareness ? <ProjectDetailSelfAwareness /> : null}
                {isGenerativeWallpaper ? <ProjectDetailGenerativeWallpaper /> : null}
                {project.id === 5 ? (
                  <div className="space-y-6 text-lg md:text-xl leading-relaxed" style={{ color: "#4a4a4a" }}>
                    <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>Research · 2026 · Release 3.0</p>
                    <p>What happens inside a language model when a compact description of its own state is fed back into it? I explore three systems inside frozen Qwen models.</p>
                    <p>A loop that writes the model’s word-level reading of itself back into it turns inward: it keeps how the model speaks and loses what it was asked about. A trained 32-number self-state, pushed to be predictable to its own self-model, becomes a rotating time code through the stages of a thought. A fed-back self-forecast is enacted — the model makes its prediction of itself come true.</p>
                    <p>Newest: a learned state that decides what the model reads comes to represent which item matters and steers the reading through that representation. Editing it redirects the reading, through the reading alone, and it learns to read again when its own read failed. When the model reads everything as plain text instead, the state learns to switch on the model’s own attention to what the text names, but not to carry the target itself.</p>
                    <p className="text-base">These are functional findings about what states carry, predict and cause; they do not measure experience. The newest experiments use a purpose-built task and small models. The open-access results show what did not emerge within the training tested, not what cannot.</p>
                    <figure>
                      <img src="https://github.com/Pixedar/jspace-strange-loop/raw/main/figures/selection_loop.png" alt="The selection loop: a compact state steers what a frozen language model reads" className="w-full h-auto rounded-lg" loading="lazy" />
                      <figcaption className="text-sm mt-2">A state that decides what the model reads — restricted and open access.</figcaption>
                    </figure>
                    <div className="flex flex-wrap gap-6 pt-2">
                      <a href="https://github.com/Pixedar/jspace-strange-loop" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Code · Release 3.0</a>
                      <a href="https://github.com/Pixedar/jspace-strange-loop/blob/main/REPORT.md" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Full report</a>
                      <a href="https://huggingface.co/datasets/Pixedar/jspace-strange-loop" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Data</a>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {/* Project Title */}
                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance" style={{ color: "#1a1a1a" }}>
                  {project.title}
                </h1>

                {/* Project Description */}
                <p className="text-xl md:text-2xl leading-relaxed text-pretty mb-12" style={{ color: "#4a4a4a" }}>
                  {project.description}
                </p>

                {/* Additional Project Details */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                      Role
                    </h3>
                    <p className="text-lg" style={{ color: "#1a1a1a" }}>
                      Lead Designer & Developer
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                      Year
                    </h3>
                    <p className="text-lg" style={{ color: "#1a1a1a" }}>
                      2024
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                      Technologies
                    </h3>
                    <p className="text-lg" style={{ color: "#1a1a1a" }}>
                      Next.js, React, TypeScript
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                      Status
                    </h3>
                    <p className="text-lg" style={{ color: "#1a1a1a" }}>
                      Research & Development
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
