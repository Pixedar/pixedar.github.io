"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

interface Project {
  id: number
  title: string
  shortDescription: string
  description: string
  media: string
  mediaType: "image" | "video"

  // Optional: richer modal content
  heroMedia?: string
  heroMediaType?: "image" | "video" | "youtube"
  heroPoster?: string
  year?: string
  role?: string
  technologies?: string
  status?: string
  links?: { label: string; href: string }[]
  sections?: { title: string; paragraphs?: string[]; bullets?: string[] }[]
  gallery?: { src: string; alt: string; caption?: string }[]
}

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [heroVideoFailed, setHeroVideoFailed] = useState(false)

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

  const heroType = project.heroMediaType ?? project.mediaType
  const heroSrc = project.heroMedia ?? project.media

  const youtubeEmbedSrc = useMemo(() => {
    if (heroType !== "youtube") return ""
    const id = heroSrc
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: id,
      controls: "0",
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
    })
    return `https://www.youtube.com/embed/${id}?${params.toString()}`
  }, [heroSrc, heroType])

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
            {heroType === "youtube" ? (
              <iframe
                src={youtubeEmbedSrc}
                title={`${project.title} video`}
                className="w-full h-full"
                style={{ opacity: 0.55, border: 0 }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : heroType === "video" ? (
              <>
                {!heroVideoFailed ? (
                  <video
                    src={heroSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={project.heroPoster}
                    className="w-full h-full object-cover opacity-50"
                    onError={() => setHeroVideoFailed(true)}
                  />
                ) : (
                  <Image
                    src={project.heroPoster || project.media || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    className="object-cover opacity-50"
                  />
                )}
              </>
            ) : (
              <Image src={heroSrc || "/placeholder.svg"} alt={project.title} fill className="object-cover opacity-50" />
            )}
          </div>
        </div>

        {/* Bottom Section - Content */}
        <div className="relative bg-[#F2EFE9] px-8 py-12 md:px-16 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Project Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance" style={{ color: "#1a1a1a" }}>
              {project.title}
            </h1>

            {/* Project Description */}
            <p className="text-xl md:text-2xl leading-relaxed text-pretty mb-12" style={{ color: "#4a4a4a" }}>
              {project.description}
            </p>

            {/* Links */}
            {project.links?.length ? (
              <div className="flex flex-wrap gap-3 mb-12">
                {project.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: "rgba(26, 26, 26, 0.08)",
                      border: "1px solid rgba(26, 26, 26, 0.15)",
                      color: "#1a1a1a",
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}

            {/* Rich sections */}
            {project.sections?.length ? (
              <div className="space-y-10 mb-14">
                {project.sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#1a1a1a" }}>
                      {section.title}
                    </h2>
                    {section.paragraphs?.length ? (
                      <div className="space-y-4">
                        {section.paragraphs.map((p, idx) => (
                          <p key={idx} className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
                            {p}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {section.bullets?.length ? (
                      <ul className="mt-4 space-y-2 list-disc pl-6" style={{ color: "#4a4a4a" }}>
                        {section.bullets.map((b, idx) => (
                          <li key={idx} className="text-lg leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            ) : null}

            {/* Video with audio (Emotion Attractor) */}
            {project.id === 1 ? (
              <section className="mb-14">
                <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#1a1a1a" }}>
                  Full video (with audio)
                </h2>
                <p className="text-lg leading-relaxed mb-4" style={{ color: "#4a4a4a" }}>
                  If the video doesn’t load in your local build, place your file at:
                  <span className="font-mono"> public/videos/emotion-attractor/output_audio.mp4</span>
                </p>
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    borderRadius: "18px",
                    border: "1px solid rgba(26, 26, 26, 0.15)",
                    backgroundColor: "rgba(26, 26, 26, 0.04)",
                  }}
                >
                  <video
                    src="/videos/emotion-attractor/output_audio.mp4"
                    controls
                    playsInline
                    poster={project.heroPoster}
                    className="w-full h-full"
                  />
                </div>
              </section>
            ) : null}

            {/* Gallery */}
            {project.gallery?.length ? (
              <section className="mb-14">
                <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "#1a1a1a" }}>
                  Selected renders
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {project.gallery.map((img) => (
                    <figure key={img.src}>
                      <div
                        className="relative w-full overflow-hidden"
                        style={{
                          borderRadius: "18px",
                          border: "1px solid rgba(26, 26, 26, 0.15)",
                          backgroundColor: "rgba(26, 26, 26, 0.04)",
                        }}
                      >
                        <div className="relative w-full" style={{ aspectRatio: "3 / 5" }}>
                          <Image src={img.src} alt={img.alt} fill className="object-cover" />
                        </div>
                      </div>
                      {img.caption ? (
                        <figcaption className="mt-2 text-sm" style={{ color: "#6a6a6a" }}>
                          {img.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Additional Project Details */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                  Role
                </h3>
                <p className="text-lg" style={{ color: "#1a1a1a" }}>
                  {project.role ?? "Lead Designer & Developer"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                  Year
                </h3>
                <p className="text-lg" style={{ color: "#1a1a1a" }}>
                  {project.year ?? "2024"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                  Technologies
                </h3>
                <p className="text-lg" style={{ color: "#1a1a1a" }}>
                  {project.technologies ?? "Next.js, React, TypeScript"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
                  Status
                </h3>
                <p className="text-lg" style={{ color: "#1a1a1a" }}>
                  {project.status ?? "Research & Development"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
