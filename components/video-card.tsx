"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Project = {
  id: number
  title: string
  category: string
  year: string
  thumbnail: string
  video: string
  href: string
}

interface VideoCardProps {
  project: Project
  isHovered: boolean
  onHoverChange: (hovered: boolean) => void
}

export function VideoCard({ project, isHovered, onHoverChange }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (isHovered) {
      // Hover preview: play muted loop
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isHovered])

  return (
    <Link
      href={project.href}
      className={cn(
        "relative h-[520px] rounded-2xl overflow-hidden transition-all duration-700 cursor-none",
        isHovered ? "w-[520px]" : "w-[240px]",
      )}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      aria-label={project.title}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0">
        <img
          src={project.thumbnail}
          alt={project.title}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            isHovered ? "scale-105" : "scale-100",
            !isHovered && "grayscale brightness-75",
          )}
        />
      </div>

      {/* Video */}
      <div className={cn("absolute inset-0 transition-opacity duration-700", isHovered ? "opacity-100" : "opacity-0")}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={project.video} type="video/mp4" />
        </video>
      </div>

      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end p-6 transition-all duration-700",
          isHovered
            ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent"
            : "bg-gradient-to-t from-black/80 via-black/20 to-transparent",
        )}
      >
        <div className={cn("transition-all duration-700", isHovered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-90")}>
          <div className="text-xs tracking-widest uppercase text-white/70 mb-2">
            {project.category} • {project.year}
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-white">{project.title}</h3>
          <div className={cn("mt-3 text-sm text-white/70 transition-opacity duration-700", isHovered ? "opacity-100" : "opacity-0")}>
            Click to open →
          </div>
        </div>
      </div>
    </Link>
  )
}
