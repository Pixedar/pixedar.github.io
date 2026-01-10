"use client"

import { useState } from "react"
import { VideoCard } from "./video-card"
import { CustomCursor } from "./custom-cursor"

type Project = {
  id: number
  title: string
  category: string
  year: string
  thumbnail: string
  video: string
  href: string
}

/**
 * EDIT ME:
 * Replace these sample projects with your own.
 * - Put thumbnails in /public/thumbs/...
 * - Put short MP4 loops in /public/videos/...
 * - Link to your pages via `href`
 */
const projects: Project[] = [
  {
    id: 1,
    title: "EMOTION ATTRACTOR DIARY (APP)",
    category: "APP / AI ART",
    year: "2025",
    thumbnail: "/fashion-model-black-and-white.jpg",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    href: "/projects/emotion-attractor/",
  },
  {
    id: 2,
    title: "TRACT-CONSTRAINED 3D FLOW FIELDS (MDN)",
    category: "RESEARCH / NEUROSCIENCE",
    year: "2025",
    thumbnail: "/portrait-black-and-white.jpg",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    href: "/pubs/tract-flow-mdn/",
  },
  {
    id: 3,
    title: "AWARENESS VISUAL ESSAYS",
    category: "WRITING / VISUALIZATION",
    year: "2025",
    thumbnail: "/fashion-editorial-black-and-white.jpg",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    href: "/writing/",
  },
]

export function WorksGallery() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <>
      <CustomCursor />

      <div className="w-full overflow-hidden">
        <div className="flex gap-4 items-stretch">
          {projects.map((project) => (
            <VideoCard
              key={project.id}
              project={project}
              isHovered={hoveredId === project.id}
              onHoverChange={(hovered) => setHoveredId(hovered ? project.id : null)}
            />
          ))}
        </div>
      </div>
    </>
  )
}
