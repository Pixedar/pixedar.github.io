"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Download, Maximize2, Sparkles, X } from "lucide-react"

type Wallpaper = {
  src: string
  title: string
  why: string
  representation: string
  alternatePath: string
}

const MEDIA_CARD_STYLE: React.CSSProperties = {
  borderRadius: 10,
  border: "2px solid rgba(0,0,0,0.9)",
  boxShadow: [
    "0 6px 12px rgba(0, 0, 0, 0.22)",
    "0 16px 32px rgba(0, 0, 0, 0.28)",
    "0 32px 64px rgba(0, 0, 0, 0.34)",
    "0 64px 128px rgba(0, 0, 0, 0.38)",
  ].join(", "),
}

const INNER_GLOW_STYLE: React.CSSProperties = {
  borderRadius: 10,
  boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.12)",
}

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
      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#F7F3E9] hover:bg-white transition-colors"
    >
      {children}
    </a>
  )
}

export function ProjectDetailGenerativeWallpaper() {
  const wallpapers = useMemo<Wallpaper[]>(
    () => [
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-01.jpg",
        title: "Pressure Break",
        why: "A fast local pressure drop + rising humidity signaled an incoming front. The model treated it as an outlier worth visual emphasis.",
        representation:
          "Hard edges soften into foggy gradients — geometry ‘melts’ into mist as the atmosphere destabilizes.",
        alternatePath:
          "Could have focused on trending search topics instead, but weather was the strongest anomaly at generation time.",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-02.jpg",
        title: "Trend Surge",
        why: "The search stream briefly concentrated around a single global event (spike + high novelty).",
        representation:
          "A central luminous ‘headline’ motif pulls the composition inward, while peripheral symbols dissolve like background noise.",
        alternatePath:
          "A market-first prompt was possible, but the news signal had higher salience and stronger cross-source agreement.",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-03.jpg",
        title: "Cold Snap",
        why: "Temperature deviated sharply from the recent 7‑day baseline.",
        representation:
          "Crystalline structures and high-frequency detail appear — ‘frozen’ textures amplifying the sudden drop.",
        alternatePath:
          "Could have leaned into moon phase imagery, but the thermal delta was the cleanest outlier.",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-04.jpg",
        title: "Market Gravity",
        why: "A notable index swing + volatility clustering made finance the dominant signal cluster.",
        representation:
          "A subtle grid emerges under the image, with curves bending like a price chart under tension.",
        alternatePath:
          "The system considered sports-heavy search results, but filtered them as ‘expected noise’ for that day.",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-05.jpg",
        title: "Moon Bias",
        why: "Moon phase transition coincided with a calm signal landscape elsewhere.",
        representation:
          "Arc highlights and crescent shadows steer the palette — a quiet composition with orbital rhythm.",
        alternatePath:
          "Could have used NASA imagery as reference, but the prompt favored abstract symbolism over literal space photography.",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-06.jpg",
        title: "Alignment Day",
        why: "Planetary/astronomy feeds hit a rare configuration marker, nudging the cosmic theme upward.",
        representation:
          "Radial symmetry and ‘tuned’ spacing — like a system snapping into harmonic alignment.",
        alternatePath:
          "The model could have prioritized local weather gradients, but astronomy scored higher on rarity.",
      },
    ],
    [],
  )

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Keyboard controls for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? 0 : (i - 1 + wallpapers.length) % wallpapers.length))
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? 0 : (i + 1) % wallpapers.length))
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [lightboxIndex, wallpapers.length])

  const goPrev = () => setLightboxIndex((i) => (i === null ? 0 : (i - 1 + wallpapers.length) % wallpapers.length))
  const goNext = () => setLightboxIndex((i) => (i === null ? 0 : (i + 1) % wallpapers.length))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: "#1a1a1a" }}>
            A wallpaper engine that listens to the world
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            This app generates a new wallpaper by combining real‑time signals: current top Google search results, local weather conditions
            (temperature, pressure, humidity and rapid changes), moon phase, stock market movement, astronomy/planet alignment hints, and
            other public data feeds. Each wallpaper becomes a visual snapshot of the day — shaped by the strongest signals and the most meaningful anomalies.
          </p>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            A custom attention/anomaly scoring layer filters the noise (for example: if search is flooded with football, the system looks for
            unusual spikes, fresh events, or cross‑source outliers). The highest‑salience signals are fused into a prompt and sent to an image
            model to produce the final wallpaper.
          </p>
          <p className="text-sm" style={{ color: "#6a6a6a" }}>
            Optional: the seed can be sourced from quantum random noise — a playful touch that makes each generation feel a little more "alive".
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PillLink href="#gallery">
            <Sparkles className="w-4 h-4" />
            View generated gallery
          </PillLink>
          <PillLink href="#" disabled>
            <Download className="w-4 h-4" />
            Download APK (soon)
          </PillLink>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-black p-5 bg-[#F7F3E9]" style={{ borderRadius: 12 }}>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
              Pipeline
            </h4>
            <ol className="list-decimal pl-5 space-y-2" style={{ color: "#1a1a1a" }}>
              <li>
                <span className="font-medium">Ingest signals:</span> search trends, weather, moon/astro, markets, NASA/other APIs.
              </li>
              <li>
                <span className="font-medium">Score anomalies:</span> detect spikes, deltas vs baselines, rare configurations.
              </li>
              <li>
                <span className="font-medium">Attention fusion:</span> weigh what’s “most relevant right now” and suppress expected noise.
              </li>
              <li>
                <span className="font-medium">Prompt compose:</span> build a structured prompt + negative prompt + style constraints.
              </li>
              <li>
                <span className="font-medium">Generate & curate:</span> produce candidates, pick the strongest, save metadata.
              </li>
            </ol>
          </div>

          <div className="border-2 border-black p-5 bg-[#F7F3E9]" style={{ borderRadius: 12 }}>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
              Tech stack
            </h4>
            <ul className="list-disc pl-5 space-y-2" style={{ color: "#1a1a1a" }}>
              <li>Android client: Java</li>
              <li>Backend orchestration: Python</li>
              <li>Image generation: OpenAI + Stability AI APIs</li>
              <li>Signals: Google Search/Trends, weather API, NASA API, finance feeds, astronomy sources</li>
              <li>Custom attention + anomaly heuristics for prompt building</li>
            </ul>
          </div>
        </div>

        <div id="gallery" className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Gallery
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            A growing grid of wallpapers generated by the app. Click any image to see the full prompt rationale.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallpapers.map((w, idx) => (
              <button
                key={w.src}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="group text-left"
                aria-label={`Open wallpaper: ${w.title}`}
              >
                <div className="relative overflow-hidden bg-white" style={MEDIA_CARD_STYLE}>
                  <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />
                  <div className="relative aspect-[9/16]">
                    <Image
                      src={w.src}
                      alt={w.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                      priority={idx === 0}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0))" }}>
                    <div className="text-sm font-semibold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}>
                      {w.title}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                      className="w-9 h-9 flex items-center justify-center"
                      style={{
                        borderRadius: 10,
                        backgroundColor: "rgba(26, 26, 26, 0.85)",
                        border: "1px solid rgba(255, 255, 255, 0.18)",
                      }}
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {lightboxIndex !== null ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
              style={{ backgroundColor: "rgba(0,0,0,0.82)" }}
              onClick={() => setLightboxIndex(null)}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-6 right-6 md:top-8 md:right-8 w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(26, 26, 26, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                aria-label="Close image"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                className="hidden md:flex absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(26, 26, 26, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                className="hidden md:flex absolute right-6 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(26, 26, 26, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
                {/* Single unified card */}
                <div
                  className="overflow-hidden border-2 border-black bg-[#F7F3E9]"
                  style={{ borderRadius: 14, boxShadow: "0 18px 44px rgba(0,0,0,0.45)" }}
                >
                  <div className="grid md:grid-cols-[1fr_460px]">
                    {/* Image */}
                    <div className="relative w-full h-[72vh] md:h-[78vh] bg-black">
                      <Image
                        src={wallpapers[lightboxIndex].src}
                        alt={wallpapers[lightboxIndex].title}
                        fill
                        sizes="100vw"
                        className="object-contain"
                        priority
                      />
                    </div>

                    {/* Rationale cards */}
                    <div className="p-5 md:p-6 border-t-2 md:border-t-0 md:border-l-2 border-black/20 space-y-4">
                      <div className="border-2 border-black bg-white/60 p-4" style={{ borderRadius: 12 }}>
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>
                          Title
                        </div>
                        <div className="mt-1 text-xl font-semibold" style={{ color: "#1a1a1a" }}>
                          {wallpapers[lightboxIndex].title}
                        </div>
                      </div>

                      <div className="border-2 border-black bg-white/60 p-4" style={{ borderRadius: 12 }}>
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>
                          Why this was generated
                        </div>
                        <div className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
                          {wallpapers[lightboxIndex].why}
                        </div>
                      </div>

                      <div className="border-2 border-black bg-white/60 p-4" style={{ borderRadius: 12 }}>
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>
                          How it appears in the image
                        </div>
                        <div className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
                          {wallpapers[lightboxIndex].representation}
                        </div>
                      </div>

                      <div className="border-2 border-black bg-white/60 p-4" style={{ borderRadius: 12 }}>
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>
                          Alternate path considered
                        </div>
                        <div className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
                          {wallpapers[lightboxIndex].alternatePath}
                        </div>
                      </div>

                      <div className="text-xs" style={{ color: "#6a6a6a" }}>
                        Tip: use ←/→ to navigate, Esc to close.
                      </div>

                      <div className="flex md:hidden gap-2">
                        <button
                          type="button"
                          onClick={goPrev}
                          className="flex-1 border-2 border-black bg-white px-3 py-2"
                          style={{ borderRadius: 10 }}
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          className="flex-1 border-2 border-black bg-white px-3 py-2"
                          style={{ borderRadius: 10 }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
