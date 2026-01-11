import type React from "react"
import Image from "next/image"
import { Download, Music2, Sparkles } from "lucide-react"

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
            Watch the 120‑day video
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
            through a sentence‑embedding model (Python/TensorFlow), mapped into a high‑dimensional semantic space, and then
            projected down into 3D so the trajectory could be seen. Connecting the points reveals loops, spirals, and
            knots — moments of getting stuck, recovering, repeating patterns, or breaking into a new direction.
          </p>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            From there I used symbolic regression to fit compact equations that reproduce the curve. Those equations became
            a generative recipe for the final artwork: attractor‑like forms rendered as sculptural objects, each representing
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
                <span className="font-medium">Render:</span> generate high‑quality attractor sculptures + captions.
              </li>
            </ol>
          </div>
          <div className="border-2 border-black p-5 bg-[#F7F3E9]">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#6a6a6a" }}>
              Backend & infra
            </h4>
            <ul className="list-disc pl-5 space-y-2" style={{ color: "#1a1a1a" }}>
              <li>
                Python + TensorFlow for embeddings and flow modeling
              </li>
              <li>
                AWS S3 for storing daily entries and generated artifacts
              </li>
              <li>
                AWS Lambda for lightweight processing / orchestration
              </li>
              <li>
                EC2 for heavier batch jobs (training, regression, rendering prep)
              </li>
              <li>
                Android (Java) client for journaling + interaction
              </li>
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
          <div className="border-2 border-black bg-black/5 overflow-hidden">
            <video
              src="/videos/emotion-attractor/output_audio.mp4"
              poster="/emotion-attractor-composite.png"
              controls
              playsInline
              className="w-full h-auto"
            />
          </div>
          <p className="text-sm" style={{ color: "#6a6a6a" }}>
            To enable playback, copy your file to: <span className="font-mono">public/videos/emotion-attractor/output_audio.mp4</span>
          </p>
        </div>

        <div id="gallery" className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
            Sculpture renders
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: "#4a4a4a" }}>
            Each render is a chapter — a different attractor‑like geometry extracted from the same diary trajectory.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <figure className="border-2 border-black bg-white overflow-hidden">
              <div className="relative aspect-[2/5]">
                <Image
                  src="/projects/emotion-attractor/renders/mind-led-upward-spiral.png"
                  alt="Mind-Led Upward Spiral"
                  fill
                  className="object-cover"
                />
              </div>
              <figcaption className="p-3">
                <div className="font-semibold" style={{ color: "#1a1a1a" }}>
                  Mind‑Led Upward Spiral
                </div>
                <div className="text-sm" style={{ color: "#6a6a6a" }}>
                  A chapter of climbing out — structure emerging from noise.
                </div>
              </figcaption>
            </figure>

            <figure className="border-2 border-black bg-white overflow-hidden">
              <div className="relative aspect-[2/5]">
                <Image
                  src="/projects/emotion-attractor/renders/reactive-flux-exhaustion-to-ascent.png"
                  alt="Reactive Flux: Exhaustion to Ascent"
                  fill
                  className="object-cover"
                />
              </div>
              <figcaption className="p-3">
                <div className="font-semibold" style={{ color: "#1a1a1a" }}>
                  Reactive Flux: Exhaustion to Ascent
                </div>
                <div className="text-sm" style={{ color: "#6a6a6a" }}>
                  Rapid oscillations — tiredness, adaptation, then lift.
                </div>
              </figcaption>
            </figure>

            <figure className="border-2 border-black bg-white overflow-hidden">
              <div className="relative aspect-[2/5]">
                <Image
                  src="/projects/emotion-attractor/renders/social-breathing-oasis.png"
                  alt="Social Breathing Oasis"
                  fill
                  className="object-cover"
                />
              </div>
              <figcaption className="p-3">
                <div className="font-semibold" style={{ color: "#1a1a1a" }}>
                  Social Breathing Oasis
                </div>
                <div className="text-sm" style={{ color: "#6a6a6a" }}>
                  A stable pocket — connection, relief, and room to breathe.
                </div>
              </figcaption>
            </figure>
          </div>
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
