"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Download, Maximize2, Music2, Sparkles, X } from "lucide-react"

type Sculpture = {
  src: string
  alt: string
}

const CARD_RADIUS = 12
const CARD_BORDER = 3

const MEDIA_CARD_STYLE: React.CSSProperties = {
  borderRadius: CARD_RADIUS,
  border: `${CARD_BORDER}px solid rgba(0,0,0,0.9)`,
  boxShadow: `
    0 6px 12px rgba(0, 0, 0, 0.25),
    0 16px 32px rgba(0, 0, 0, 0.35),
    0 32px 64px rgba(0, 0, 0, 0.45),
    0 64px 128px rgba(0, 0, 0, 0.5)
  `,
  willChange: "transform",
}

const INNER_GLOW_STYLE: React.CSSProperties = {
  borderRadius: Math.max(0, CARD_RADIUS - 3),
  boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.12)",
}

/**
 * Find the nearest scroll container (important because the modal scrolls internally).
 * This makes IntersectionObserver work reliably inside the project modal.
 */
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null
  let cur: HTMLElement | null = el.parentElement
  while (cur) {
    const style = window.getComputedStyle(cur)
    const overflowY = style.overflowY
    if (overflowY === "auto" || overflowY === "scroll") return cur
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
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.02)`
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
      {
        src: "/projects/emotion-attractor/renders/mind-led-upward-spiral.png",
        alt: "Mind-Led Upward Spiral",
      },
      {
        src: "/projects/emotion-attractor/renders/reactive-flux-exhaustion-to-ascent.png",
        alt: "Reactive Flux: Exhaustion to Ascent",
      },
      {
        src: "/projects/emotion-attractor/renders/social-breathing-oasis.png",
        alt: "Social Breathing Oasis",
      },
    ],
    [],
  )

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { onMouseMove, onMouseLeave } = useTiltHandlers()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoWrapRef = useRef<HTMLDivElement | null>(null)
  const shouldBePlayingRef = useRef(false)

  // Autoplay *only* when the video is visible inside the modal scroll container.
  useEffect(() => {
    const wrap = videoWrapRef.current
    const video = videoRef.current
    if (!wrap || !video) return

    // Autoplay policies: muted + playsInline gives best chance.
    video.muted = true
    video.playsInline = true

    const attemptPlay = () => {
      const v = videoRef.current
      if (!v) return
      if (!shouldBePlayingRef.current) return
      v.muted = true
      const p = v.play()
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          // Ignore — some browsers still block autoplay until user interacts.
        })
      }
    }

    const onCanPlay = () => attemptPlay()
    video.addEventListener("canplay", onCanPlay)

    const root = getScrollParent(wrap)
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.15
        shouldBePlayingRef.current = visible

        if (visible) {
          attemptPlay()
        } else {
          video.pause()
        }
      },
      {
        root,
        // lower threshold so it triggers even if the card is tall
        threshold: [0, 0.15, 0.3, 0.5, 0.8],
        // start a bit earlier / stop a bit earlier
        rootMargin: "0px 0px -10% 0px",
      },
    )

    obs.observe(wrap)

    // If tab hidden, pause.
    const onVis = () => {
      if (document.hidden) video.pause()
      else if (shouldBePlayingRef.current) attemptPlay()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      document.removeEventListener("visibilitychange", onVis)
      video.removeEventListener("canplay", onCanPlay)
      obs.disconnect()
    }
  }, [])

  // Lightbox keyboard controls.
  useEffect(() => {
    if (lightboxIndex === null) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null)
        return
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i === null ? 0 : (i - 1 + sculptures.length) % sculptures.length))
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? 0 : (i + 1) % sculptures.length))
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [lightboxIndex, sculptures.length])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: "#1a1a1a" }}>
            Geometry of the Soul — from diary text to a strange-attractor sculpture
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            Emotion Attractor started as a personal experiment: we feel emotional currents every day, but they’re hard to
            see while you’re inside them. It feels like chaos — until you zoom out far enough to see the shape. Modern
            language models can turn meaning into vectors, so I asked: can a daily diary become a trajectory through a
            semantic space — a geometric trace of how I change over time? Each day becomes a point; the path between days
            becomes a curve; and the curve becomes a sculpture.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PillLink href="#video">
            <Music2 className="w-4 h-4" />
            Watch the 120-day video
          </PillLink>
          <PillLink href="#gallery">
            <Sparkles className="w-4 h-4" />
            View sculpture renders
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
            I built an Android diary app (Java) where I logged daily experiences and emotional state. Each entry was sent
            through a sentence-embedding model (Python/TensorFlow), mapped into a high-dimensional semantic space, and then
            projected down into 3D so the trajectory could be seen. Connecting the points reveals loops, spirals, and
            knots — moments of getting stuck, recovering, repeating patterns, or breaking into a new direction.
          </p>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            From there I used symbolic regression to fit compact equations that reproduce the curve. Those equations became
            a generative recipe for the final artwork: attractor-like forms rendered as sculptural objects, each representing
            a different chapter.
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
              <li>AWS Lambda for lightweight processing / orchestration</li>
              <li>EC2 for heavier batch jobs (training, regression, rendering prep)</li>
              <li>Android (Java) client for journaling + interaction</li>
            </ul>
            <p className="text-sm mt-3" style={{ color: "#6a6a6a" }}>
              Note: the data was personal; the system was designed to keep the diary private while still enabling modeling.
            </p>
          </div>
        </div>

        <div id="video" className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Video — 120 days of emotional geometry + music chapters
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            This animation shows the sculpture evolving across ~120 days. The soundtrack shifts with chapters of my life,
            guided by listening history.
          </p>

          {/* Slightly smaller footprint vs full width */}
          <div className="mx-auto max-w-3xl">
            <div ref={videoWrapRef} className="relative overflow-hidden bg-white" style={MEDIA_CARD_STYLE}>
              <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  src="/videos/emotion-attractor/output_audio.mp4"
                  poster="/emotion-attractor-composite.png"
                  muted
                  playsInline
                  preload="metadata"
                  controls
                  // These don’t force autoplay by themselves, but help once play() is called.
                  autoPlay={false}
                  loop
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          <p className="text-sm" style={{ color: "#6a6a6a" }}>
            To enable playback, copy your file to:{" "}
            <span className="font-mono">public/videos/emotion-attractor/output_audio.mp4</span>
          </p>
        </div>

        <div id="gallery" className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Sculpture renders
          </h3>

          <div className="grid md:grid-cols-[1.05fr_1.95fr] gap-6 items-start">
            {/* Left description column */}
            <div className="space-y-4 md:sticky md:top-24">
              <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
                Each sculpture is a chapter: the same “emotional physics” seen from a different time window. Click a chapter
                to open the render full-screen.
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: "Mind-Led Upward Spiral",
                    body:
                      "Deliberate rebuilding. Structure emerges from noise — small routines compound into a clean upward arc.",
                  },
                  {
                    title: "Reactive Flux: Exhaustion to Ascent",
                    body:
                      "A feedback loop between pushing and recovering. The curve tightens, stalls, then finds lift — like breath returning.",
                  },
                  {
                    title: "Social Breathing Oasis",
                    body:
                      "Connection as a stabilizer. The space opens up, the trajectory smooths, and the system remembers calm.",
                  },
                ].map((c, i) => (
                  <button
                    key={c.title}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className="w-full text-left border-2 border-black bg-[#F7F3E9] hover:bg-white transition-colors p-4"
                    style={{
                      borderRadius: 10,
                      boxShadow: activeIndex === i ? "0 8px 20px rgba(0,0,0,0.18)" : "none",
                    }}
                    aria-label={`Open chapter render: ${c.title}`}
                  >
                    <div className="font-semibold text-base" style={{ color: "#1a1a1a" }}>
                      {c.title}
                    </div>
                    <div className="text-sm leading-relaxed mt-1" style={{ color: "#4a4a4a" }}>
                      {c.body}
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-sm" style={{ color: "#6a6a6a" }}>
                Tip: the cards on the right respond to your cursor like a physical object.
              </p>
            </div>

            {/* Right gallery grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sculptures.map((s, idx) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className="group text-left"
                  aria-label={`Open render: ${s.alt}`}
                >
                  <div
                    className="relative overflow-hidden bg-white transition-transform duration-200 ease-out"
                    style={{
                      ...MEDIA_CARD_STYLE,
                      outline: activeIndex === idx ? "2px solid rgba(255,255,255,0.35)" : "none",
                    }}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={INNER_GLOW_STYLE} />
                    <div className="relative aspect-[2/5]">
                      <Image
                        src={s.src}
                        alt={s.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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

              <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                <div className="relative w-full h-[82vh] overflow-hidden bg-black" style={MEDIA_CARD_STYLE}>
                  <Image
                    src={sculptures[lightboxIndex].src}
                    alt={sculptures[lightboxIndex].alt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
                  Tip: use ←/→ to navigate, Esc to close.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Interactive modeling
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            Beyond the static sculpture, the learned flow model lets you “probe” the space: adjust emotional axes and see
            how the model responds, or release a particle and watch the predicted path evolve. It’s a playful way to explore
            recurring loops, transitions, and stability in a personal emotional landscape.
          </p>
        </div>
      </div>
    </div>
  )
}
