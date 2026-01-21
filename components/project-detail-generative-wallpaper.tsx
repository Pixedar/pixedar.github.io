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
        title: "Collapsing bubble and matrix reality",
        why: "Environment impact\n" +
            "The 'collapsing bubble' metaphor was chosen because the atmospheric pressure seems to be dropping quickly. Dropping atmospheric pressure allows air to rise upward typically sianaling cloudier, rainier conditions. The 'matrix realitv' phrase was chosen because quantum random number generators showed an unusual pattern, and some believe truly random data can reflect mysterious global events.",
        representation:
          "The image metaphorically represents the concept of a \"collapsing bubble\" through the depiction of transparent and reflective orbs that seem fragile, suggesting impermanence and transition. The \"matrix reality\" is conveved by the intricate, interconnected network of golden structures, svmbolizing a complex, underlying framework that holds these bubbles in a suspended state, hinting at the interplay between chaos and order.",
        alternatePath:
          "The chosen quantum seed path led to dynamic, chaotic imagery, contrasting with alternatives of stability, order, abstraction, and unpredictability. Each path uniquely manipulates pressure, style, and artist choice, impacting theme continuity. Through collapsing bubble visuals, the artist conveys fragility in the face of uncertainty and change.",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-02.jpg",
        title: "Locked door",
        why: "A locked door precisely svmbolizes restriction and controlled access, reflectina the impact of covid restrictions, states of emergency",
        representation:
          "The locked door metaphorically represents a barrier or threshold to be crossed, adorned with beauty and mystery inviting exploration beyond the immediate while shrouded in natural vibrancy and the silent guardianship of the surrounding lush foliage",
        alternatePath:
            "The algorithm's stages explore \"locked door\" and potential \"closed book\" themes, impacted by artist choice and quantum seeds. Each decision influences trend. environment and image, yielding diverse societal interpretations. Alternative paths reveal varying perspectives on restriction and secrecy. Artist examines restricted access in modern society creatively",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-08.jpg",
        title: "Broken clock",
        why: "A broken clock symbolizes halted progress, suspended time, and unresolved conflict, reflecting ceasefire, tensions and uncertainty present in the listed geopolitical trends and dates.",
        representation:
          "The shattered clock face represents the idea of time being fraamented and unreliable. The missing and disordered pieces svmbolize chaos and a loss of control, suagestina disruption in the flow of time and life's unpredictability",
        alternatePath:
          "The algorithm's \"broken clock\" theme symbolizes halted progress and geopolitical tension, contrasting with potentia alternatives like \"shattered glass\" for fragility or \"melting clock\" for transformation. Artist's choice directs these outcomes, ensuring varied yet interconnected reflections on qlobal dynamics. The artist shows us: \"Time's halt echoes geopolitical discord and change.'",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-04.jpg",
        title: "Surrounded by clear sky",
        why: "Environment impact: The 'surrounded by clear sky' phrase was chosen because it reflects the current weather conditions.",
        representation:
          "The image metaphorically depicts the sky as a vibrant radiant portal amidst the darkness, suggesting transcendence and the boundless possibilities of the horizon beyond constraints",
        alternatePath:
          "Quantum-controlled seeds introduce variabilitv to image generation, influencina atmospheric outcomes. A 'clear sky' reflects serenity, while alternative seeds yield diverse narratives, like somber stormy settings. Interactions across algorithm stages maintain aesthetic coherence, merging unpredictability with artistic intent. Artist explores chance, influencing narrative depth. Embrace randomness to enrich visual storytellinq",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-10.jpg",
        title: "Cash and surrounded by broken clouds",
        why: "Environment impact:\n" +
          "The 'cash' phrase was chosen because there was a strong shift in global markets.\n" +
          "The 'surrounded by broken clouds' phrase was chosen because it reflects the current weather conditions",
        representation:
          "The cash is represented by the structured, geometric shapes and lined patterns conveying wealth, stability, and control while the broken clouds are symbolized by fragmented abstract patches that suggest disruption, impermanence, and a barrier to clarity.",
        alternatePath:
          "The chosen path emphasizes material economics via \"cash.\" contrasting with an alternative \"matrix reality\" rooted in philosophy. Quantum seeds further influence imagery, with volatility depicted through \"broken clouds,\" unlike the stable \"clear skies.\" This highlights quantum-driven creativity's variability and unpredictability\n" +
            "\"Art mirrors chaotic market forces through creative unpredictability.'.",
      },
      {
        src: "/projects/generative-wallpaper/gallery/wallpaper-06.jpg",
        title: "Gold record",
        why: "Both Brad Pitt and Katy Perry are entertainment icons; a gold record uniquely symbolizes fame, achievement, and their collective impact in music and film.",
        representation:
          "The image presents a harmonious blend of textures and patterns, with a central disc-like form adorned with intricate gold embellishments, svmbolizina the fusion of music's timeless beauty and the grandeur of achievement, akin to a gold record's representation of success in sound",
        alternatePath:
          "The algorithm utilizes quantum seeds, combining artist choice to select paths like \"gold record,\" influencing image outcomes with fame associations. Alternatives like \"silk scarf\" suggest varied cultural narratives. This showcases how quantum variability enriches artistic creativity, exploring multiple possibilities. The artist emphasizes unpredictability's role in creative interpretation.",
      },
    ],
    [],
  )

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [alphaOpen, setAlphaOpen] = useState(false)

  // Replace with your own Google Form embed link (works best with "?embedded=true")
  const ALPHA_FORM_URL =
    process.env.NEXT_PUBLIC_METAMORPH_ALPHA_FORM_URL ??
    "https://docs.google.com/forms/d/e/1FAIpQLSe27aZArFlIxnLd3ob_fZZL2RxxloDWGqSJtHKnVjfIjMq1IA/viewform?embedded=true"

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
          <PillLink href="#app-demo">
            <Sparkles className="w-4 h-4" />
            Watch Android demo
          </PillLink>
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


        {/* ✅ Android app demo (silent loop) */}
        <div id="app-demo" className="space-y-4">
          <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#1a1a1a" }}>
            Android app demo — wallpaper gallery + explanations
          </h3>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Description (right on desktop, under title on mobile) */}
            <div className="w-full md:flex-[1_1_44%] order-1 md:order-2">
              <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
                A quick walkthrough of the MetaMorph Android client: a scrollable grid of generated wallpapers, one-tap full-screen viewing, and
                the metadata that explains the why behind each image — what signal triggered it, how that idea appears visually, and what
                alternate algorithmic path the system could have taken at generation time.
              </p>
            </div>

            {/* Video card */}
            <div className="w-full md:flex-[0_0_56%] md:max-w-[56%] order-2 md:order-1 md:pr-2">
              <div className="relative overflow-hidden bg-white" style={MEDIA_CARD_STYLE}>
                <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />
                <video
                  src="/videos/metamorph/app_demo.mp4"
                  poster="/abstract-generative-art-wallpaper.png"
                  preload="metadata"
                  playsInline
                  autoPlay
                  loop
                  muted
                  className="w-full h-auto block pointer-events-none"
                />
              </div>
            </div>
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
                        <div className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a", whiteSpace: "pre-line" }}>
                          {wallpapers[lightboxIndex].why}
                        </div>
                      </div>

                      <div className="border-2 border-black bg-white/60 p-4" style={{ borderRadius: 12 }}>
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>
                          How it appears in the image
                        </div>
                        <div className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a", whiteSpace: "pre-line" }}>
                          {wallpapers[lightboxIndex].representation}
                        </div>
                      </div>

                      <div className="border-2 border-black bg-white/60 p-4" style={{ borderRadius: 12 }}>
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>
                          Alternate path considered
                        </div>
                        <div className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a", whiteSpace: "pre-line" }}>
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

        {/* ✅ Early alpha testing form */}
        <div id="alpha" className="mt-12 space-y-4">
          <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#1a1a1a" }}>
            Early alpha testing
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            If you’d like to join the first alpha wave for MetaMorph (or leave suggestions), this form lets you register interest.
            I’m mainly measuring whether there’s enough demand to run a proper testing campaign. If there’s enough interest, I’ll start the first stage of alpha/beta testing.
          </p>

          <button
            type="button"
            onClick={() => setAlphaOpen(true)}
            className="border-2 border-black bg-white px-4 py-2 text-sm font-semibold"
            style={{ borderRadius: 12, boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}
          >
            Open alpha form
          </button>
        </div>

        {/* Fullscreen alpha form */}
        {alphaOpen ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
            onClick={() => setAlphaOpen(false)}
          >
            <div
              className="relative w-full max-w-5xl rounded-2xl overflow-hidden bg-white"
              style={{
                border: "2px solid rgba(255,255,255,0.22)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setAlphaOpen(false)}
                className="absolute top-3 right-3 px-3 py-1.5 text-sm font-semibold"
                style={{
                  borderRadius: 999,
                  backgroundColor: "rgba(0,0,0,0.72)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "white",
                }}
                aria-label="Close"
              >
                Close
              </button>

              <iframe
                src={ALPHA_FORM_URL}
                title="MetaMorph Alpha Signup"
                className="w-full"
                style={{ height: "82vh", border: "none" }}
                loading="lazy"
              />
            </div>
          </div>
        ) : null}

        {/* Subtle rights notice (Android app projects only) */}
        <p className="mt-10 text-[10px] leading-snug text-black/40 text-center">
          © 2026 Wiktor Tomasik. All rights reserved. For licensing/collaboration, contact me.
        </p>
      </div>
    </div>
  )
}
