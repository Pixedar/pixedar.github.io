"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  Download,
  Maximize2,
  Music2,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react"

type Sculpture = { src: string; alt: string }
type Chapter = { title: string; body: string }

const MEDIA_CARD_STYLE: React.CSSProperties = {
  borderRadius: 10, // slightly rounded (less than homepage)
  border: "2px solid rgba(0,0,0,0.9)",
  boxShadow: [
    "0 5px 10px rgba(0, 0, 0, 0.19)",
    "0 14px 28px rgba(0, 0, 0, 0.24)",
    "0 27px 54px rgba(0, 0, 0, 0.29)",
    "0 54px 108px rgba(0, 0, 0, 0.32)",
  ].join(", "),
  willChange: "transform",
}

const INNER_GLOW_STYLE: React.CSSProperties = {
  borderRadius: 10,
  boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.12)",
}

/**
 * The modal scrolls inside its own container.
 * Find the nearest scroll parent so IntersectionObserver triggers correctly.
 */
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null
  let cur: HTMLElement | null = el.parentElement
  while (cur) {
    const style = window.getComputedStyle(cur)
    const oy = style.overflowY
    if (oy === "auto" || oy === "scroll") return cur
    cur = cur.parentElement
  }
  return null
}

function useTiltHandlers() {
  const raf = useRef<number | null>(null)

  const onMouseMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const rx = (py - 0.5) * -7
    const ry = (px - 0.5) * 7

    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(
        2,
      )}deg) rotateY(${ry.toFixed(2)}deg) scale(1.02)`
    })
  }

  const onMouseLeave: React.MouseEventHandler<HTMLElement> = (e) => {
    const el = e.currentTarget
    if (raf.current) cancelAnimationFrame(raf.current)
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)"
  }

  return { onMouseMove, onMouseLeave }
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
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#F7F3E9] hover:bg-white transition-colors"
    >
      {children}
    </a>
  )
}

export function ProjectDetailEmotionAttractor() {
  const sculptures = useMemo<Sculpture[]>(
    () => [
      { src: "/projects/emotion-attractor/renders/mind-led-upward-spiral.png", alt: "Mind-Led Upward Spiral" },
      {
        src: "/projects/emotion-attractor/renders/reactive-flux-exhaustion-to-ascent.png",
        alt: "Reactive Flux: Exhaustion to Ascent",
      },
      { src: "/projects/emotion-attractor/renders/social-breathing-oasis.png", alt: "Social Breathing Oasis" },
    ],
    [],
  )

  const chapters = useMemo<Chapter[]>(
    () => [
      {
        title: "Mind-Led Upward Spiral",
        body: "Deliberate rebuilding. Structure emerging from noise — small routines compounding into a clean upward arc.",
      },
      {
        title: "Reactive Flux: Exhaustion to Ascent",
        body: "A feedback loop between pushing and recovering. The curve tightens, stalls, then finds lift — like breath returning.",
      },
      {
        title: "Social Breathing Oasis",
        body: "Connection as a stabilizer. The space opens up, the trajectory smooths, and the system remembers calm.",
      },
    ],
    [],
  )

  const { onMouseMove, onMouseLeave } = useTiltHandlers()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Videos
  const appVideoRef = useRef<HTMLVideoElement | null>(null)
  const appVideoWrapRef = useRef<HTMLDivElement | null>(null)
  const shouldPlayAppVideoRef = useRef(false)
  const [appMuted, setAppMuted] = useState(true)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoWrapRef = useRef<HTMLDivElement | null>(null)
  const shouldPlayRef = useRef(false)
  const [muted, setMuted] = useState(true)

  // ✅ Autoplay only when visible inside modal scroll container; loop; no controls.
  useEffect(() => {
    const wrap = appVideoWrapRef.current
    const video = appVideoRef.current
    if (!wrap || !video) return

    video.playsInline = true
    video.loop = true

    const attemptPlay = async () => {
      const v = appVideoRef.current
      if (!v) return
      if (!shouldPlayAppVideoRef.current) return

      try {
        await v.play()
      } catch {
        // If autoplay fails (usually because sound), force mute and try again
        v.muted = true
        setAppMuted(true)
        try {
          await v.play()
        } catch {
          // ignore
        }
      }
    }

    const onCanPlay = () => {
      if (shouldPlayAppVideoRef.current) void attemptPlay()
    }
    video.addEventListener("canplay", onCanPlay)

    const root = getScrollParent(wrap)
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.15
        shouldPlayAppVideoRef.current = visible

        if (visible) void attemptPlay()
        else video.pause()
      },
      {
        root,
        threshold: [0, 0.15, 0.3, 0.55, 0.8],
        rootMargin: "0px 0px -10% 0px",
      },
    )

    obs.observe(wrap)

    const onVis = () => {
      const v = appVideoRef.current
      if (!v) return
      if (document.hidden) v.pause()
      else if (shouldPlayAppVideoRef.current) void attemptPlay()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      document.removeEventListener("visibilitychange", onVis)
      video.removeEventListener("canplay", onCanPlay)
      obs.disconnect()
    }
  }, [])

  useEffect(() => {
    const wrap = videoWrapRef.current
    const video = videoRef.current
    if (!wrap || !video) return

    video.playsInline = true
    video.loop = true

    const attemptPlay = async () => {
      const v = videoRef.current
      if (!v) return
      if (!shouldPlayRef.current) return

      try {
        await v.play()
      } catch {
        // If autoplay fails (usually because sound), force mute and try again
        v.muted = true
        setMuted(true)
        try {
          await v.play()
        } catch {
          // ignore
        }
      }
    }

    const onCanPlay = () => {
      if (shouldPlayRef.current) void attemptPlay()
    }
    video.addEventListener("canplay", onCanPlay)

    const root = getScrollParent(wrap)
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.15
        shouldPlayRef.current = visible

        if (visible) void attemptPlay()
        else video.pause()
      },
      {
        root,
        threshold: [0, 0.15, 0.3, 0.55, 0.8],
        rootMargin: "0px 0px -10% 0px",
      },
    )

    obs.observe(wrap)

    const onVis = () => {
      const v = videoRef.current
      if (!v) return
      if (document.hidden) v.pause()
      else if (shouldPlayRef.current) void attemptPlay()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      document.removeEventListener("visibilitychange", onVis)
      video.removeEventListener("canplay", onCanPlay)
      obs.disconnect()
    }
  }, [])

  // Keep actual element muted in sync with state.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = muted
  }, [muted])

  useEffect(() => {
    const v = appVideoRef.current
    if (!v) return
    v.muted = appMuted
  }, [appMuted])

  // Lightbox keyboard controls
  useEffect(() => {
    if (lightboxIndex === null) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? 0 : (i - 1 + sculptures.length) % sculptures.length))
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? 0 : (i + 1) % sculptures.length))
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [lightboxIndex, sculptures.length])

  const goPrev = () => setLightboxIndex((i) => (i === null ? 0 : (i - 1 + sculptures.length) % sculptures.length))
  const goNext = () => setLightboxIndex((i) => (i === null ? 0 : (i + 1) % sculptures.length))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: "#1a1a1a" }}>
            Geometry of the Soul — from diary text to a strange-attractor sculpture
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            Emotion Attractor started as a personal experiment: we feel emotional currents every day, but they’re hard to see while you’re
            inside them. It feels like chaos — until you zoom out far enough to see the shape. Modern language models can turn meaning into
            vectors, so I asked: can a daily diary become a trajectory through a semantic space — a geometric trace of how I change over time?
            Each day becomes a point; the path between days becomes a curve; and the curve becomes a sculpture.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PillLink href="#app-video">
            <Music2 className="w-4 h-4" />
            Watch the app video
          </PillLink>
          <PillLink href="#gallery">
            <Sparkles className="w-4 h-4" />
            View sculpture renders
          </PillLink>
          <PillLink href="#video">
            <Music2 className="w-4 h-4" />
            Watch the 120-day video
          </PillLink>
          <PillLink href="#" disabled>
            <Download className="w-4 h-4" />
            Download APK (soon)
          </PillLink>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            What this project is
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            I built an Android diary app (Java) where I logged daily experiences and emotional state. Each entry was sent through a
            sentence-embedding model (Python/TensorFlow), mapped into a high-dimensional semantic space, and then projected down into 3D so the
            trajectory could be seen. Connecting the points reveals loops, spirals, and knots — moments of getting stuck, recovering, repeating
            patterns, or breaking into a new direction.
          </p>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            From there I used symbolic regression to fit compact equations that reproduce the curve. Those equations became a generative recipe
            for the final artwork: attractor-like forms rendered as sculptural objects, each representing a different chapter.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-black p-5 bg-[#F7F3E9]">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
              Pipeline
            </h4>
            <ol className="list-decimal pl-5 space-y-2" style={{ color: "#1a1a1a" }}>
              <li>
                <span className="font-medium">Capture:</span> Android app logs daily text + a lightweight emotion profile.
              </li>
              <li>
                <span className="font-medium">Embed:</span> sentence encoder → vector representation (semantic space).
              </li>
              <li>
                <span className="font-medium">Project:</span> dimensionality reduction into 3D for visualization.
              </li>
              <li>
                <span className="font-medium">Model:</span> MDN learns a probabilistic “flow” between emotional states.
              </li>
              <li>
                <span className="font-medium">Discover:</span> symbolic regression yields equations describing the curve.
              </li>
              <li>
                <span className="font-medium">Render:</span> generate high-quality attractor sculptures.
              </li>
            </ol>
          </div>
          <div className="border-2 border-black p-5 bg-[#F7F3E9]">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
              Backend & infra
            </h4>
            <ul className="list-disc pl-5 space-y-2" style={{ color: "#1a1a1a" }}>
              <li>Python + TensorFlow for embeddings and flow modeling</li>
              <li>AWS S3 for storing daily entries and generated artifacts</li>
              <li>EC2 for heavier batch jobs (training, regression, rendering)</li>
              <li>Android (Java) client for journaling + interactive exploration</li>
              <li>LLM-based interpretation for trajectories and chapter summaries</li>
            </ul>
            <p className="text-sm mt-3" style={{ color: "#6a6a6a" }}>
              Note: the data was personal; the system was designed to keep the diary private while still enabling modeling.
            </p>
          </div>
        </div>

        {/* ✅ Android app walkthrough video (same card style as the 120-day video) */}
        <div id="app-video" className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Video — Android app walkthrough (diary clusters, trajectories, attractors)
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            This demo shows the Android app that turns diary entries into a 3D emotional map. Days cluster into recurring states, connect into a
            trajectory through time, and reveal stable “attractor” regions in the flow field. You can color the space by speed or valence,
            interactively probe dimensions like stress escalation, then release the probe and get an LLM interpretation of the path.
            High-quality chapter sculptures are generated by automatically segmenting the trajectory — and each chapter is distilled into its
            own symbolic equation.
          </p>

          <div className="mx-auto max-w-[720px]">
            <div ref={appVideoWrapRef} className="relative overflow-hidden bg-white" style={MEDIA_CARD_STYLE}>
              <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />

              <video
                ref={appVideoRef}
                src="/videos/emotion-attractor/app_demo.mp4"
                poster="/emotion-attractor-composite.png"
                preload="metadata"
                playsInline
                muted={appMuted}
                className="w-full h-auto block pointer-events-none"
              />

              <button
                type="button"
                onClick={() => {
                  setAppMuted((m) => !m)
                  const v = appVideoRef.current
                  if (v && shouldPlayAppVideoRef.current) {
                    const p = v.play()
                    if (p && typeof p.catch === "function") p.catch(() => {})
                  }
                }}
                className="absolute bottom-3 right-3 w-11 h-11 flex items-center justify-center"
                style={{
                  borderRadius: 12,
                  backgroundColor: "rgba(26, 26, 26, 0.86)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.30)",
                }}
                aria-label={appMuted ? "Unmute" : "Mute"}
                title={appMuted ? "Unmute" : "Mute"}
              >
                {appMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Sculpture renders section stays exactly as before */}
        <div id="gallery" className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Sculpture renders
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            Click any render to open it full-screen. The cards respond to your cursor like a physical object.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {sculptures.map((s, idx) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="group text-left"
                aria-label={`Open render: ${s.alt}`}
              >
                <div
                  className="relative overflow-hidden bg-white transition-transform duration-200 ease-out"
                  style={MEDIA_CARD_STYLE}
                  onMouseMove={onMouseMove}
                  onMouseLeave={onMouseLeave}
                >
                  <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />
                  <div className="relative aspect-[2/5]">
                    <Image
                      src={s.src}
                      alt={s.alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                      priority={idx === 0}
                    />
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

          {/* ✅ Lightbox with left description panel ONLY when clicked */}
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
                className="hidden md:flex absolute right-20 md:right-24 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(26, 26, 26, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
                {/* ✅ Single fullscreen card: image + chapter description in ONE unified container */}
                <div
                  className="overflow-hidden border-2 border-black bg-[#a6a09f]"
                  style={{
                    borderRadius: 14,
                    boxShadow: "0 15px 38px rgba(0,0,0,0.38)",
                  }}
                >
                  <div className="grid md:grid-cols-[1fr_420px]">
                    {/* Image */}
                    <div className="relative w-full h-[72vh] md:h-[78vh] bg-[#a6a09f]">
                      <Image
                        src={sculptures[lightboxIndex].src}
                        alt={sculptures[lightboxIndex].alt}
                        fill
                        sizes="100vw"
                        className="object-contain"
                        priority
                      />
                    </div>

                    {/* Chapter (right side) */}
                    <div className="p-5 md:p-6 bg-[#a6a09f]">
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6a6a6a" }}>
                        Chapter
                      </div>
                      <div className="mt-1 text-xl md:text-2xl font-semibold text-balance" style={{ color: "#1a1a1a" }}>
                        {chapters[lightboxIndex]?.title ?? sculptures[lightboxIndex].alt}
                      </div>
                      <div className="mt-3 text-base leading-relaxed" style={{ color: "#4a4a4a" }}>
                        {chapters[lightboxIndex]?.body ?? ""}
                      </div>

                      <div className="mt-6 text-xs" style={{ color: "#6a6a6a" }}>
                        Tip: use ←/→ to navigate, Esc to close.
                      </div>

                      <div className="mt-5 flex md:hidden gap-2">
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

        {/* ✅ 120-day video (moved to the end, below Sculpture renders) */}
        <div id="video" className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Video — 120 days of emotional geometry + music chapters
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            This animation shows the sculpture evolving across ~120 days. The soundtrack shifts with chapters of my life, guided by listening
            history.
          </p>

          <div className="mx-auto max-w-[720px]">
            <div ref={videoWrapRef} className="relative overflow-hidden bg-white" style={MEDIA_CARD_STYLE}>
              <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />

              <video
                ref={videoRef}
                src="/videos/emotion-attractor/output_audio.mp4"
                poster="/emotion-attractor-composite.png"
                preload="metadata"
                playsInline
                muted={muted}
                className="w-full h-auto block pointer-events-none"
              />

              <button
                type="button"
                onClick={() => {
                  setMuted((m) => !m)
                  const v = videoRef.current
                  if (v && shouldPlayRef.current) {
                    const p = v.play()
                    if (p && typeof p.catch === "function") p.catch(() => {})
                  }
                }}
                className="absolute bottom-3 right-3 w-11 h-11 flex items-center justify-center"
                style={{
                  borderRadius: 12,
                  backgroundColor: "rgba(26, 26, 26, 0.86)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.30)",
                }}
                aria-label={muted ? "Unmute" : "Mute"}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
