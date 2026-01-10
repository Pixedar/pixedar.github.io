"use client"

import { useState } from "react"
import Image from "next/image"

interface Project {
  id: number
  title: string
  shortDescription: string
  description: string
  media: string
  mediaType: "image" | "video"
}

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full cursor-pointer transition-all duration-500 ease-out"
      style={{
        aspectRatio: "1.91 / 1",
        transform: isHovered ? "scale(1.05)" : "scale(1)",
      }}
    >
      {/* The Card Container */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: "20px",
          border: "3px solid rgba(0,0,0,0.9)",
          boxShadow: `
            0 6px 12px rgba(0, 0, 0, 0.25),
            0 16px 32px rgba(0, 0, 0, 0.35),
            0 32px 64px rgba(0, 0, 0, 0.45),
            0 64px 128px rgba(0, 0, 0, 0.5)
          `,
        }}
      >
        {/* Inner glow/highlight for 3D glass edge */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            borderRadius: "17px",
            boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.12)",
          }}
        />

        {/* Card Background - Dark cinematic gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #071522 0%, #0B2538 100%)",
          }}
        />

        {/* Vignette on card edges */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none z-30 opacity-[0.35] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.8' numOctaves='7' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: "120px 120px",
          }}
        />

        {/* Media (Image or Video) */}
        <div className="absolute inset-0 z-0">
          {project.mediaType === "video" ? (
            <video
              src={project.media}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-70"
            />
          ) : (
            <Image
              src={project.media || "/placeholder.svg"}
              alt={project.title}
              fill
              className="object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-75"
            />
          )}
        </div>

        <div className="absolute inset-0 z-40 flex flex-col justify-end p-6 md:p-8">
          <h2
            className="text-2xl md:text-3xl font-bold text-white text-balance transition-transform duration-500 mb-2"
            style={{
              textShadow: "0 2px 12px rgba(0, 0, 0, 0.6)",
              transform: isHovered ? "translateY(-4px)" : "translateY(0)",
            }}
          >
            {project.title}
          </h2>
          <p
            className="text-sm md:text-base text-white/80 text-pretty transition-all duration-500"
            style={{
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.5)",
              transform: isHovered ? "translateY(-4px)" : "translateY(0)",
              opacity: isHovered ? 1 : 0.9,
            }}
          >
            {project.shortDescription}
          </p>
        </div>

        {/* Subtle frosted glass effect on hover */}
        <div
          className="absolute inset-0 z-5 transition-opacity duration-500 pointer-events-none"
          style={{
            opacity: isHovered ? 1 : 0,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        />
      </div>
    </button>
  )
}
