"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { ProjectDetailEmotionAttractor } from "@/components/project-detail-emotion-attractor"
import { ProjectDetailBrainInformationFlow } from "@/components/project-detail-brain-information-flow"

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

  const isEmotionAttractor = project.title === "Emotion Attractor"
  const isBrainInformationFlow = project.title === "Brain Information Flow Research"

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
            {(isEmotionAttractor || isBrainInformationFlow) ? (
              <>
                {/* Project Title */}
                <h1 className="text-5xl md:text-7xl font-bold mb-8 text-balance" style={{ color: "#1a1a1a" }}>
                  {project.title}
                </h1>

                {isEmotionAttractor ? <ProjectDetailEmotionAttractor /> : null}
                {isBrainInformationFlow ? <ProjectDetailBrainInformationFlow /> : null}
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
