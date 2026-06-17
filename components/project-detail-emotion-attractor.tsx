"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  Download,
  Github,
  Maximize2,
  Music2,
  Sparkles,
  SkipForward,
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
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

const APP_TRAJECTORY_START = 56
const APP_FLOW_HINT_END = 78
const APP_FLOW_FIELD_START = 178

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
  const [appMuted, setAppMuted] = useState(true)
  const [appPaused, setAppPaused] = useState(true)
  const [showAppSkipIntro, setShowAppSkipIntro] = useState(false)
  const [showAppSkipFlow, setShowAppSkipFlow] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(true)
  const [alphaOpen, setAlphaOpen] = useState(false)

  // Replace with your own Google Form embed link (works best with "?embedded=true")
  const ALPHA_FORM_URL =
    process.env.NEXT_PUBLIC_EMOTION_ATTRACTOR_ALPHA_FORM_URL ??
    "https://docs.google.com/forms/d/e/1FAIpQLScZvt_NKFrZr3PVIENcOo5WDMk5OeGcd34T03c5XFm0WrsRVw/viewform?embedded=true"

  // Keep actual element muted in sync with state.
  // Sculpture Evolution video plays at reduced volume so it doesn't overpower.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = muted
    v.volume = 0.35
  }, [muted])

  useEffect(() => {
    const v = appVideoRef.current
    if (!v) return
    v.muted = appMuted
    v.volume = 0.9
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

  const startVideoWithSound = async (
    v: HTMLVideoElement,
    volume: number,
    setMutedState: React.Dispatch<React.SetStateAction<boolean>>,
    setPausedState: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    const playAttempt = async () => {
      const playPromise = v.play()
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(() => {})
        await Promise.race([
          playPromise,
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("play-timeout")), 700)
          }),
        ])
      }
      if (v.paused) throw new Error("play-paused")
    }

    v.muted = false
    v.volume = volume
    setMutedState(false)

    try {
      await playAttempt()
      setPausedState(false)
    } catch {
      v.muted = true
      setMutedState(true)

      try {
        await playAttempt()
        setPausedState(false)
      } catch {
        setPausedState(true)
      }
    }
  }

  const playAppVideo = async () => {
    const v = appVideoRef.current
    if (!v) return
    await startVideoWithSound(v, 0.9, setAppMuted, setAppPaused)
    updateAppSkipHints(v)
  }

  const updateAppSkipHints = (v: HTMLVideoElement) => {
    const isPlaying = !v.paused
    setShowAppSkipIntro(isPlaying && v.currentTime < APP_TRAJECTORY_START)
    setShowAppSkipFlow(
      isPlaying && v.currentTime >= APP_TRAJECTORY_START && v.currentTime < APP_FLOW_HINT_END,
    )
  }

  const pauseAppVideo = () => {
    const v = appVideoRef.current
    if (!v) return
    v.pause()
    setAppPaused(true)
    setShowAppSkipIntro(false)
    setShowAppSkipFlow(false)
  }

  const skipAppIntro = () => {
    const v = appVideoRef.current
    if (!v) return
    v.currentTime = APP_TRAJECTORY_START
    setShowAppSkipIntro(false)
    if (v.paused) void playAppVideo()
    else updateAppSkipHints(v)
  }

  const skipAppFlow = () => {
    const v = appVideoRef.current
    if (!v) return
    v.currentTime = APP_FLOW_FIELD_START
    setShowAppSkipIntro(false)
    setShowAppSkipFlow(false)
    if (v.paused) void playAppVideo()
  }

  const playSculptureVideo = async () => {
    const v = videoRef.current
    if (!v) return
    await startVideoWithSound(v, 0.35, setMuted, setPaused)
  }

  const pauseSculptureVideo = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    setPaused(true)
  }

  return (
    <div className="max-w-5xl mx-auto">
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
          <PillLink href="#tracescope">
            <Github className="w-4 h-4" />
            TraceScope
          </PillLink>
          <PillLink href="#video">
            <Music2 className="w-4 h-4" />
            Watch the 120-day video
          </PillLink>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#1a1a1a" }}>
            What this project is
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            I built an Android diary app where I logged daily experiences and emotional state. Each entry was sent through a
            sentence-embedding model, mapped into a high-dimensional semantic space, and then projected down into 3D so the
            trajectory could be seen. Connecting the points reveals the underlying shape of emotional experience over time.
            What makes this especially useful is that the structure becomes something a person can engage with directly.
            Instead of reading past entries one by one, you can see where you tend to drift, where you circle, and where change actually happens — and then play with the flow itself, experimenting with how different emotional pressures might gently push you out of a loop or pull you toward a more stable state.
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
                <span className="font-medium">Capture:</span> Android app for journaling, clustering, and interactive 3D exploration.
              </li>
              <li>
                <span className="font-medium">Encode:</span> a fine-tuned sentence model compresses each entry into an emotional state vector.
              </li>
              <li>
                <span className="font-medium">Project:</span> the space is reduced into 3D using an automatically selected projection.
              </li>
              <li>
                <span className="font-medium">Cluster:</span> recurring states are discovered and organized into meaningful regions.
              </li>
              <li>
                <span className="font-medium">Flow:</span> an MDN learns a probabilistic motion field and stable attractor zones.
              </li>
              <li>
                <span className="font-medium">Sculpt:</span> chapters are segmented, approximated with symbolic regression, and rendered as sculptures.
              </li>
            </ol>
          </div>
          <div className="border-2 border-black p-5 bg-[#F7F3E9]">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
              Backend & infra
            </h4>
            <ul className="list-disc pl-5 space-y-2" style={{ color: "#1a1a1a" }}>
              <li>Android client written in Java for journaling and interactive 3D exploration</li>
              <li>Custom embedding pipeline built around a fine-tuned emotion encoder</li>
              <li>Topology and clustering algorithms for state discovery and chapter segmentation</li>
              <li>AWS EC2 for flow modeling, symbolic regression, and Blender rendering</li>
              <li>LLM-based interpretation for trajectories and chapter summaries</li>
            </ul>
            <p className="text-sm mt-3" style={{ color: "#6a6a6a" }}>
              Note: the data was personal; the system was designed to keep the diary private while still enabling modeling.
            </p>
          </div>
        </div>

        {/* ✅ Android app walkthrough video (same card style as the 120-day video) */}
        <div id="app-video" className="space-y-4">
          <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#1a1a1a" }}>
            Android app walkthrough — diary clusters, trajectories, attractors
          </h3>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Description (right on desktop, under title on mobile) */}
            <div className="w-full md:flex-[1_1_44%] order-1 md:order-2">
              <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
                This demo shows the Android app that turns diary entries into a 3D emotional map. Days cluster into recurring states, connect
                into a trajectory through time, and reveal stable “attractor” regions in the flow field. You can color the space by speed or
                valence, interactively probe dimensions like stress escalation, then release the probe and get an LLM interpretation of the
                path. High-quality chapter sculptures are generated by automatically segmenting the trajectory — and each chapter is distilled
                into its own symbolic equation.
              </p>
              <p className="mt-4 text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
                The map is built with an{" "}
                <strong className="font-semibold" style={{ color: "#1a1a1a" }}>
                  emotion-tuned semantic embedding model
                </strong>{" "}
                setup: the encoder is fine-tuned around human affect and paired with a task-specific embedding prompt,
                so the coordinates emphasize appraisal, intensity, regulation, and recurring emotional-state patterns. A{" "}
                <strong className="font-semibold" style={{ color: "#1a1a1a" }}>
                  learned flow model
                </strong>{" "}
                turns those trajectories into a continuous field, letting you play with your own emotional dynamics and
                see how a state tends to evolve from a chosen starting condition.
              </p>
            </div>

            {/* Video card (left on desktop, below description on mobile) */}
            <div className="w-full md:flex-[0_0_56%] md:max-w-[56%] order-2 md:order-1 md:pr-2">
              <div className="relative overflow-hidden bg-white" style={MEDIA_CARD_STYLE}>
                <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />

                <video
                  ref={appVideoRef}
                  src="/videos/emotion-attractor/app_demo.mp4"
                  poster="/videos/emotion-attractor/app_demo_poster_2m58.jpg"
                  preload="metadata"
                  playsInline
                  loop
                  muted={appMuted}
                  onPlay={() => {
                    const v = appVideoRef.current
                    setAppPaused(false)
                    if (v) updateAppSkipHints(v)
                  }}
                  onPause={() => {
                    setAppPaused(true)
                    setShowAppSkipIntro(false)
                    setShowAppSkipFlow(false)
                  }}
                  onTimeUpdate={() => {
                    const v = appVideoRef.current
                    if (v) updateAppSkipHints(v)
                  }}
                  className={`w-full h-auto block pointer-events-none transition duration-500 ${
                    appPaused ? "scale-[1.02] blur-[3px] brightness-[0.62]" : "scale-100 blur-0 brightness-100"
                  }`}
                />

                {appPaused ? (
                  <button
                    type="button"
                    onClick={() => void playAppVideo()}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
                    aria-label="Play Android app walkthrough"
                    title="Play Android app walkthrough"
                  >
                    <span
                      className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105"
                      style={{
                        backgroundColor: "rgba(26, 26, 26, 0.88)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.36)",
                      }}
                    >
                      <Play className="ml-1 h-8 w-8 text-white" />
                    </span>
                    <span
                      className="mt-3 max-w-[24rem] text-sm font-medium leading-snug text-white"
                      style={{ textShadow: "0 2px 10px rgba(0,0,0,0.75)" }}
                    >
                      Watch toward the end to see how these paths create a flow field model.
                    </span>
                  </button>
                ) : null}

                {showAppSkipIntro ? (
                  <button
                    type="button"
                    onClick={skipAppIntro}
                    className="absolute top-3 right-3 z-30 inline-flex h-8 max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium text-white/80 transition hover:bg-black/60 hover:text-white"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.42)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.20)",
                    }}
                    aria-label="Skip intro and jump to trajectory"
                    title="Skip intro and jump to trajectory"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    <span className="truncate">Skip to trajectory</span>
                    <span className="text-white/45">0:56</span>
                  </button>
                ) : null}

                {showAppSkipFlow ? (
                  <button
                    type="button"
                    onClick={skipAppFlow}
                    className="absolute top-3 right-3 z-30 inline-flex h-8 max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium text-white/80 transition hover:bg-black/60 hover:text-white"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.42)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.20)",
                    }}
                    aria-label="Skip trajectory and jump to flow field"
                    title="Skip trajectory and jump to flow field"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    <span className="truncate">Skip to flow field</span>
                    <span className="text-white/45">2:58</span>
                  </button>
                ) : null}

                {/* Mute / unmute (left) */}
                <button
                  type="button"
                  onClick={() => {
                    setAppMuted((m) => {
                      const next = !m
                      const v = appVideoRef.current
                      if (v) v.muted = next
                      return next
                    })
                  }}
                  className="absolute bottom-3 left-3 z-30 w-11 h-11 flex items-center justify-center"
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

                {/* Pause / play (right) */}
                <button
                  type="button"
                  onClick={() => {
                    const v = appVideoRef.current
                    if (!v) return
                    if (appPaused || v.paused) void playAppVideo()
                    else pauseAppVideo()
                  }}
                  className="absolute bottom-3 right-3 z-30 w-11 h-11 flex items-center justify-center"
                  style={{
                    borderRadius: 12,
                    backgroundColor: "rgba(26, 26, 26, 0.86)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.30)",
                  }}
                  aria-label={appPaused ? "Play" : "Pause"}
                  title={appPaused ? "Play" : "Pause"}
                >
                  {appPaused ? <Play className="w-5 h-5 text-white" /> : <Pause className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Sculpture renders section stays exactly as before */}
        <div id="gallery" className="space-y-4">
          <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#1a1a1a" }}>
            Sculpture renders
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            Click any render to open it full-screen. These are high-quality, handpicked chapter sculptures — automatically sliced from the full
            trajectory using the topology of your emotional semantic space. Every month, the system batch-renders new chapters on an AWS EC2
            instance and stores results in S3. Spotify-guided soundtrack alignment is already integrated, but still in a very early stage.
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
          className="fixed inset-0 z-[60] overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.82)" }}
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* Keep controls visible even when the modal content scrolls on mobile */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="fixed top-6 right-6 md:top-8 md:right-8 w-12 h-12 rounded-full flex items-center justify-center"
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
            className="hidden md:flex fixed left-6 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center"
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
            className="hidden md:flex fixed right-20 md:right-24 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center"
            style={{
              backgroundColor: "rgba(26, 26, 26, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          <div className="min-h-full flex items-start md:items-center justify-center p-4 md:p-8">
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

        </div>
      ) : null}

        </div>

        {/* TraceScope — general-purpose tool born from this project */}
        <div id="tracescope" className="mt-12 space-y-4">
          <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#1a1a1a" }}>
            TraceScope — a general-purpose tool born from this project
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            The pipeline behind Emotion Attractor — embedding, clustering, flow-field learning, trajectory interpretation — turned out to be useful far beyond personal diaries. So I extracted and generalized it into{" "}
            <a
              href="https://github.com/Pixedar/TraceScope"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium"
              style={{ color: "#1a1a1a" }}
            >
              TraceScope
            </a>
            , an open-source research tool for studying how ordered text sequences move through semantic space.
          </p>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            In practice, it embeds ordered texts, labels clusters and axes, learns a continuous flow field, and helps inspect where trajectories stabilize, drift, or cross between attractor basins.
          </p>

          <div className="relative overflow-hidden bg-black" style={MEDIA_CARD_STYLE}>
            <Image
              src="/flow-steering/prm-demo-v2.gif"
              alt="TraceScope PRM800K flow-field visualization"
              width={950}
              height={534}
              unoptimized
              className="block h-auto w-full"
            />
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "#6a6a6a" }}>
            The GIF shows TraceScope on PRM800K math-reasoning chains: reasoning steps form paths through semantic space, with clusters, attractor basins, and the learned flow field revealing where solution strategies tend to move.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <PillLink href="https://github.com/Pixedar/TraceScope">
              <Github className="w-4 h-4" />
              GitHub repo
            </PillLink>
          </div>
        </div>

        {/* ✅ 120-day video (moved to the end, below TraceScope) */}
        <div id="video" className="space-y-4">
          <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#1a1a1a" }}>
            Sculpture Evolution — chapters over time
          </h3>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Description (right on desktop, under title on mobile) */}
            <div className="w-full md:flex-[1_1_44%] order-1 md:order-2">
              <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
                This animation shows the sculpture evolving across time as new entries accumulate.{" "}
                <strong className="font-semibold" style={{ color: "#1a1a1a" }}>
                  Chapters are detected automatically from the trajectory&apos;s topology
                </strong>
                , and the soundtrack shifts with each chapter using Spotify listening history from the same period.
                It’s implemented as an automated monthly pipeline. An EC2 job batch-renders the updated animation and stores it in S3, so the app gradually builds a growing archive of chapters, motion, and form.
              </p>
            </div>

            {/* Video card (left on desktop, below description on mobile) */}
            <div className="w-full md:flex-[0_0_56%] md:max-w-[56%] order-2 md:order-1 md:pr-2">
              <div className="relative overflow-hidden bg-white" style={MEDIA_CARD_STYLE}>
                <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />

                <video
                  ref={videoRef}
                  src="/videos/emotion-attractor/output_audio.mp4"
                  poster="/emotion-attractor-composite.png"
                  preload="metadata"
                  playsInline
                  loop
                  muted={muted}
                  onPlay={() => setPaused(false)}
                  onPause={() => setPaused(true)}
                  className={`w-full h-auto block pointer-events-none transition duration-500 ${
                    paused ? "scale-[1.02] blur-[3px] brightness-[0.62]" : "scale-100 blur-0 brightness-100"
                  }`}
                />

                {paused ? (
                  <button
                    type="button"
                    onClick={() => void playSculptureVideo()}
                    className="absolute inset-0 z-20 flex items-center justify-center"
                    aria-label="Play sculpture evolution video"
                    title="Play sculpture evolution video"
                  >
                    <span
                      className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105"
                      style={{
                        backgroundColor: "rgba(26, 26, 26, 0.88)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.36)",
                      }}
                    >
                      <Play className="ml-1 h-8 w-8 text-white" />
                    </span>
                  </button>
                ) : null}

                {/* Mute / unmute (left) */}
                <button
                  type="button"
                  onClick={() => {
                    setMuted((m) => {
                      const next = !m
                      const v = videoRef.current
                      if (v) v.muted = next
                      return next
                    })
                  }}
                  className="absolute bottom-3 left-3 z-30 w-11 h-11 flex items-center justify-center"
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

                {/* Pause / play (right) */}
                <button
                  type="button"
                  onClick={() => {
                    const v = videoRef.current
                    if (!v) return
                    if (paused || v.paused) void playSculptureVideo()
                    else pauseSculptureVideo()
                  }}
                  className="absolute bottom-3 right-3 z-30 w-11 h-11 flex items-center justify-center"
                  style={{
                    borderRadius: 12,
                    backgroundColor: "rgba(26, 26, 26, 0.86)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.30)",
                  }}
                  aria-label={paused ? "Play" : "Pause"}
                  title={paused ? "Play" : "Pause"}
                >
                  {paused ? <Play className="w-5 h-5 text-white" /> : <Pause className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Early alpha testing form */}
        <div id="alpha" className="mt-12 space-y-4">
          <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#1a1a1a" }}>
            Early alpha testing
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            If you’d like to join the first alpha wave for Emotion Attractor (or leave suggestions), this form lets you register interest.
            I’m mainly measuring whether there’s enough demand to run a proper testing campaign. If there’s enough interest, I’ll start the first stage of alpha/beta testing.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => setAlphaOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#F7F3E9] hover:bg-white transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Open alpha form
            </button>
          </div>
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
                title="Emotion Attractor Alpha Signup"
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
