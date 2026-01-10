"use client"

import { useState } from "react"
import { ProjectCard } from "@/components/project-card"
import { ProjectModal } from "@/components/project-modal"
import { Linkedin, Github, Archive } from "lucide-react"

const projects = [
  {
    id: 1,
    title: "Emotion Attractor",
    shortDescription: "Diary → embeddings → 3D trajectory → symbolic regression sculptures",
    description:
      "A personal research + art system that turns daily diary text into a 3D emotional trajectory, then fits symbolic equations and renders the path as strange-attractor-like sculptures. On top of the geometry, I learned a flow model you can interact with—nudging emotion axes and watching the system respond.",
    media: "/emotion-attractor-composite.png",
    mediaType: "image" as const,

    // Modal / full-screen page
    heroMedia: "/videos/emotion-attractor/output_audio.mp4",
    heroMediaType: "video" as const,
    heroPoster: "/emotion-attractor-composite.png",
    year: "2024–2025",
    role: "Creator (research • engineering • generative art)",
    technologies:
      "Android (Kotlin), sentence embeddings, UMAP/PCA, symbolic regression, Mixture Density Networks (MDN), 3D rendering",
    status: "Personal R&D",
    sections: [
      {
        title: "What it is",
        paragraphs: [
          "Every day I wrote a short diary entry: emotions, feelings, and what happened. Each entry is encoded with a sentence-embedding model into a high-dimensional semantic vector.",
          "I then project that semantic space down to 3D, where each point becomes the ‘state’ of a day. Connecting the points forms a path: a visible story of how my emotions drift, loop, and recover over time.",
          "I’ve always loved strange attractors—how simple equations can carve out living, organic forms. This project asks: what if a life (or a season of it) also has an equation?",
        ],
      },
      {
        title: "How it works",
        bullets: [
          "Android diary app to capture daily emotion + experience text",
          "Sentence encoder → semantic embedding per day",
          "Dimensionality reduction → 3D coordinates",
          "Trajectory + chapter segmentation → distinct emotional ‘scenes’",
          "Symbolic regression → compact mathematical equations that recreate the curves",
          "Mixture Density Network (MDN) → learned flow field over the trajectory",
          "Interactive explorer: tweak an axis (e.g., tension) and see the implied response",
          "Probe particle: drop a point into the learned flow and watch the path unfold",
        ],
      },
      {
        title: "Audiovisual render",
        paragraphs: [
          "The full-screen video shows how the sculpture morphs across ~120 days. The soundtrack shifts with the chapters, driven by my Spotify listening history from the same period.",
          "The renders below are ‘snapshots’ of those chapters — each one a different emotional landscape with its own fitted equation.",
        ],
      },
    ],
    gallery: [
      {
        src: "/projects/emotion-attractor/renders/mind-led-upward-spiral.png",
        alt: "Mind-Led Upward Spiral",
        caption: "Mind-Led Upward Spiral",
      },
      {
        src: "/projects/emotion-attractor/renders/reactive-flux-exhaustion-to-ascent.png",
        alt: "Reactive Flux: Exhaustion to Ascent",
        caption: "Reactive Flux: Exhaustion to Ascent",
      },
      {
        src: "/projects/emotion-attractor/renders/social-breathing-oasis.png",
        alt: "Social Breathing Oasis",
        caption: "Social Breathing Oasis",
      },
    ],
  },
  {
    id: 2,
    title: "Brain Information Flow Research",
    shortDescription: "Preprint + visualization of information flow through brain-like networks",
    description:
      "A research project and visual explainer about how information propagates through brain-like systems—framed as dynamic routes, bottlenecks, and flows. Includes a preprint + an accompanying video walkthrough.",
    media: "/images/brain-flow0000.jpeg",
    mediaType: "image" as const,

    // Modal / full-screen page
    heroMedia: "3UFpiJIKwHs",
    heroMediaType: "youtube" as const,
    year: "2024",
    role: "Author (research • visualization)",
    technologies: "Python, scientific writing, visualization, modeling",
    status: "Preprint",
    links: [
      { label: "Preprint (LinkedIn)", href: "https://lnkd.in/dWefyu94" },
      { label: "DOI: 10.5281/zenodo.18200414", href: "https://doi.org/10.5281/zenodo.18200414" },
      { label: "YouTube video", href: "https://youtu.be/3UFpiJIKwHs" },
    ],
    sections: [
      {
        title: "What’s inside",
        bullets: [
          "A conceptual + quantitative framing of ‘information flow’ in brain-like networks",
          "Visualizations that make the flow legible (paths, mixing, bottlenecks)",
          "A narrated video overview for a fast, intuitive grasp of the ideas",
        ],
      },
    ],
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
