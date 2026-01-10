"use client"

import { useState } from "react"
import { ProjectCard } from "@/components/project-card"
import { ProjectModal } from "@/components/project-modal"
import { Linkedin, Github, Archive } from "lucide-react"

const projects = [
  {
    id: 1,
    title: "Emotion Attractor",
    shortDescription: "Exploring emotional states through sculptural visualization",
    description:
      "A research project examining emotional states and their mathematical representations. Through 3D sculptural forms, we visualize the equation of personal experience, mapping psychological energy, emotional tension, and existential reflection into tangible forms.",
    media: "/emotion-attractor-composite.png",
    mediaType: "image" as const,
  },
  {
    id: 2,
    title: "Brain Information Flow Research",
    shortDescription: "Neural network visualization and data flow patterns",
    description:
      "An exploration of how information flows through neural networks. Using particle-based visualization techniques, this project maps the complex pathways of cognitive processing and brain activity patterns.",
    media: "/images/brain-flow0000.jpeg",
    mediaType: "image" as const,
  },
  {
    id: 3,
    title: "Self-Awareness in Cognitive Systems",
    shortDescription: "Investigating consciousness in artificial systems",
    description:
      "A deep dive into self-awareness and consciousness within cognitive systems. This research explores the boundaries between artificial and natural intelligence, examining how systems develop awareness of their own states.",
    media: "/images/75-20-281-29.png",
    mediaType: "image" as const,
  },
  {
    id: 4,
    title: "Generative Wallpaper App",
    shortDescription: "AI-powered dynamic wallpaper generation system",
    description:
      "A generative art application that creates unique, personalized wallpapers using advanced AI algorithms. Each wallpaper is dynamically generated based on user preferences, time of day, and environmental factors.",
    media: "/abstract-generative-art-wallpaper.jpg",
    mediaType: "image" as const,
  },
]

export default function PortfolioPage() {
  const [selectedProject, setSelectedProject] = useState<(typeof projects)[0] | null>(null)

  return (
    <main className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: "#F2EFE9" }}>
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

      <div className="relative z-20 container mx-auto px-6 py-16">
        <div className="mb-16 text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-balance" style={{ color: "#1a1a1a" }}>
            Wiktor Tomasik
          </h1>

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: "rgba(26, 26, 26, 0.08)",
                border: "1px solid rgba(26, 26, 26, 0.15)",
              }}
            >
              <Linkedin className="w-5 h-5" style={{ color: "#1a1a1a" }} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: "rgba(26, 26, 26, 0.08)",
                border: "1px solid rgba(26, 26, 26, 0.15)",
              }}
            >
              <Github className="w-5 h-5" style={{ color: "#1a1a1a" }} />
            </a>
            <a
              href="https://archive.org"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: "rgba(26, 26, 26, 0.08)",
                border: "1px solid rgba(26, 26, 26, 0.15)",
              }}
            >
              <Archive className="w-5 h-5" style={{ color: "#1a1a1a" }} />
            </a>
          </div>

          <p className="text-lg md:text-xl text-pretty max-w-2xl mx-auto" style={{ color: "#4a4a4a" }}>
            Welcome to my portfolio. Here you'll find a curated selection of my work, showcasing projects that push
            creative and technical boundaries.
          </p>
        </div>

        {/* Grid of project cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-7xl mx-auto">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
          ))}
        </div>
      </div>

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </main>
  )
}
