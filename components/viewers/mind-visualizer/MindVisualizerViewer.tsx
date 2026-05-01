"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Activity,
  Brain,
  CirclePause,
  CirclePlay,
  Crosshair,
  Eraser,
  Gauge,
  GitBranch,
  Home,
  RefreshCcw,
  Sparkles,
  Waves,
} from "lucide-react"

type FieldMode = "mean" | "gated" | "mu1" | "mu2"
type ColorMode = "speed" | "entropy" | "deltaEntropy" | "directionalDelta"
type ColorMap = "turbo" | "rainbow" | "bipolar"

type MindVisSettings = {
  paused: boolean
  fieldMode: FieldMode
  colorMode: ColorMode
  colorMap: ColorMap
  particleCount: number
  speedScale: number
  lifetimeScale: number
  opacityScale: number
  dt: number
  pointSize: number
  speedFilter: boolean
  filterHigh: boolean
  filterFraction: number
  velocityClip: boolean
  velocityClipValue: number
  oosVisible: boolean
  boundsVisible: boolean
  boundsOpacity: number
  branching: boolean
  probeCount: 1 | 4 | 8
}

type ViewerStatus = {
  fps: number
  particles: number
  loaded: boolean
  message: string
  field: FieldMode
}

const initialSettings: MindVisSettings = {
  paused: false,
  fieldMode: "gated",
  colorMode: "speed",
  colorMap: "turbo",
  particleCount: 60000,
  speedScale: 0.48,
  lifetimeScale: 1,
  opacityScale: 0.78,
  dt: 0.018,
  pointSize: 3.2,
  speedFilter: false,
  filterHigh: true,
  filterFraction: 0.35,
  velocityClip: false,
  velocityClipValue: 0.72,
  oosVisible: false,
  boundsVisible: true,
  boundsOpacity: 0.28,
  branching: false,
  probeCount: 1,
}

const fieldLabels: Record<FieldMode, string> = {
  mean: "Mean",
  gated: "Gated",
  mu1: "Mu 1",
  mu2: "Mu 2",
}

const colorLabels: Record<ColorMode, string> = {
  speed: "Speed",
  entropy: "Entropy",
  deltaEntropy: "Delta Ent",
  directionalDelta: "Dir Delta",
}

const basePath = () => (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")
const backendUrl = () => (process.env.NEXT_PUBLIC_MINDVIS_API_URL ?? "").replace(/\/$/, "")

export function MindVisualizerViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<MindVisRenderer | null>(null)
  const [settings, setSettings] = useState<MindVisSettings>(initialSettings)
  const [status, setStatus] = useState<ViewerStatus>({
    fps: 0,
    particles: initialSettings.particleCount,
    loaded: false,
    message: "Loading grid64 field",
    field: initialSettings.fieldMode,
  })
  const [analysis, setAnalysis] = useState("Probe trajectory analysis will appear here.")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new MindVisRenderer(canvas, settings, setStatus, setAnalysis)
    rendererRef.current = renderer
    renderer.load().catch((error) => {
      setStatus((current) => ({
        ...current,
        loaded: false,
        message: error instanceof Error ? error.message : "Failed to load MindVisualizer",
      }))
    })

    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    rendererRef.current?.setSettings(settings)
  }, [settings])

  const updateSetting = useCallback(<K extends keyof MindVisSettings>(key: K, value: MindVisSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }, [])

  const cycle = useCallback(<T extends string>(items: readonly T[], value: T, direction = 1) => {
    const index = items.indexOf(value)
    return items[(index + direction + items.length) % items.length]
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return

      setSettings((current) => {
        const next = { ...current }
        const key = event.key
        if (key === " ") next.paused = !current.paused
        else if (key.toLowerCase() === "f") next.fieldMode = cycle(["mean", "gated", "mu1", "mu2"] as const, current.fieldMode)
        else if (key.toLowerCase() === "v")
          next.colorMode = cycle(["speed", "entropy", "deltaEntropy", "directionalDelta"] as const, current.colorMode)
        else if (key.toLowerCase() === "m") next.colorMap = cycle(["turbo", "rainbow", "bipolar"] as const, current.colorMap)
        else if (key === "[") next.dt = clamp(current.dt / 1.25, 0.002, 0.08)
        else if (key === "]") next.dt = clamp(current.dt * 1.25, 0.002, 0.08)
        else if (key === "+" || key === "=") next.speedScale = clamp(current.speedScale * 1.25, 0.05, 2.5)
        else if (key === "-" || key === "_") next.speedScale = clamp(current.speedScale / 1.25, 0.05, 2.5)
        else if (key === "1") next.lifetimeScale = clamp(current.lifetimeScale / 1.25, 0.35, 3)
        else if (key === "2") next.lifetimeScale = clamp(current.lifetimeScale * 1.25, 0.35, 3)
        else if (key === "7") next.opacityScale = clamp(current.opacityScale / 1.25, 0.1, 1.5)
        else if (key === "8") next.opacityScale = clamp(current.opacityScale * 1.25, 0.1, 1.5)
        else if (key.toLowerCase() === "y") next.speedFilter = !current.speedFilter
        else if (key.toLowerCase() === "u") next.filterHigh = !current.filterHigh
        else if (key.toLowerCase() === "z") next.filterFraction = clamp(current.filterFraction / 1.25, 0.05, 0.95)
        else if (key.toLowerCase() === "x") next.filterFraction = clamp(current.filterFraction * 1.25, 0.05, 0.95)
        else if (key.toLowerCase() === "j") next.velocityClip = !current.velocityClip
        else if (key.toLowerCase() === "a") next.velocityClipValue = clamp(current.velocityClipValue / 1.25, 0.08, 1.3)
        else if (key.toLowerCase() === "d") next.velocityClipValue = clamp(current.velocityClipValue * 1.25, 0.08, 1.3)
        else if (key.toLowerCase() === "o") next.oosVisible = !current.oosVisible
        else if (key === "\\") next.boundsVisible = !current.boundsVisible
        else if (key === "9") next.boundsOpacity = clamp(current.boundsOpacity / 1.25, 0.04, 0.8)
        else if (key === "0") next.boundsOpacity = clamp(current.boundsOpacity * 1.25, 0.04, 0.8)
        else if (key.toLowerCase() === "b") next.branching = !current.branching
        else if (key.toLowerCase() === "n") next.probeCount = current.probeCount === 1 ? 4 : current.probeCount === 4 ? 8 : 1
        else if (key.toLowerCase() === "c") rendererRef.current?.clearProbes()
        else if (key.toLowerCase() === "g" && event.shiftKey) rendererRef.current?.explainProbe()
        else return current
        event.preventDefault()
        return next
      })
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [cycle])

  return (
    <div className="min-h-screen bg-[#070A0D] text-[#EFF7F1]">
      <main className="flex min-h-screen flex-col">
        <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-white/10 bg-[#0B1014] px-4 py-3 md:px-6">
          <a
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10"
            title="Home"
          >
            <Home className="h-5 w-5" />
          </a>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight md:text-2xl">MindVisualizer</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
              <span>grid64 MDN field</span>
              <span>{status.loaded ? "live WebGL2" : status.message}</span>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-white/70">
            <Metric icon={<Activity className="h-4 w-4" />} value={`${status.fps.toFixed(status.fps ? 1 : 0)} FPS`} />
            <Metric icon={<Waves className="h-4 w-4" />} value={`${status.particles.toLocaleString()} particles`} />
            <Metric icon={<Brain className="h-4 w-4" />} value={fieldLabels[status.field]} />
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="relative min-h-[58vh] overflow-hidden bg-black xl:min-h-0">
            <canvas ref={canvasRef} className="block h-full min-h-[58vh] w-full xl:min-h-0" />
            <div className="pointer-events-none absolute left-4 top-4 border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/70 backdrop-blur">
              {status.message}
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto border-l border-white/10 bg-[#0E1418]">
            <div className="space-y-5 p-4">
              <ControlSection title="Run">
                <div className="grid grid-cols-3 gap-2">
                  <IconButton
                    label={settings.paused ? "Play" : "Pause"}
                    active={!settings.paused}
                    onClick={() => updateSetting("paused", !settings.paused)}
                  >
                    {settings.paused ? <CirclePlay className="h-4 w-4" /> : <CirclePause className="h-4 w-4" />}
                  </IconButton>
                  <IconButton label="Reset" onClick={() => rendererRef.current?.reset()}>
                    <RefreshCcw className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Analyze" onClick={() => rendererRef.current?.explainProbe()}>
                    <Sparkles className="h-4 w-4" />
                  </IconButton>
                </div>
              </ControlSection>

              <ControlSection title="Field">
                <Segmented
                  value={settings.fieldMode}
                  items={["mean", "gated", "mu1", "mu2"] as const}
                  labels={fieldLabels}
                  onChange={(value) => updateSetting("fieldMode", value)}
                />
              </ControlSection>

              <ControlSection title="Color">
                <Segmented
                  value={settings.colorMode}
                  items={["speed", "entropy", "deltaEntropy", "directionalDelta"] as const}
                  labels={colorLabels}
                  onChange={(value) => updateSetting("colorMode", value)}
                />
                <SelectRow
                  label="Map"
                  value={settings.colorMap}
                  onChange={(value) => updateSetting("colorMap", value as ColorMap)}
                  options={[
                    ["turbo", "Turbo"],
                    ["rainbow", "Rainbow"],
                    ["bipolar", "Bipolar"],
                  ]}
                />
              </ControlSection>

              <ControlSection title="Particles">
                <SelectRow
                  label="Count"
                  value={String(settings.particleCount)}
                  onChange={(value) => updateSetting("particleCount", Number(value))}
                  options={[
                    ["25000", "25k"],
                    ["60000", "60k"],
                    ["100000", "100k"],
                    ["160000", "160k"],
                  ]}
                />
                <SliderRow label="Speed" min={0.05} max={2.5} step={0.01} value={settings.speedScale} onChange={(value) => updateSetting("speedScale", value)} />
                <SliderRow label="Lifetime" min={0.35} max={3} step={0.01} value={settings.lifetimeScale} onChange={(value) => updateSetting("lifetimeScale", value)} />
                <SliderRow label="Opacity" min={0.1} max={1.5} step={0.01} value={settings.opacityScale} onChange={(value) => updateSetting("opacityScale", value)} />
                <SliderRow label="dt" min={0.002} max={0.08} step={0.001} value={settings.dt} onChange={(value) => updateSetting("dt", value)} />
                <SliderRow label="Point" min={1} max={8} step={0.1} value={settings.pointSize} onChange={(value) => updateSetting("pointSize", value)} />
              </ControlSection>

              <ControlSection title="Filters">
                <ToggleRow label="Speed filter" checked={settings.speedFilter} onChange={(value) => updateSetting("speedFilter", value)} />
                <ToggleRow label="High speeds" checked={settings.filterHigh} onChange={(value) => updateSetting("filterHigh", value)} />
                <SliderRow label="Fraction" min={0.05} max={0.95} step={0.01} value={settings.filterFraction} onChange={(value) => updateSetting("filterFraction", value)} />
                <ToggleRow label="Velocity clip" checked={settings.velocityClip} onChange={(value) => updateSetting("velocityClip", value)} />
                <SliderRow label="Clip" min={0.08} max={1.3} step={0.01} value={settings.velocityClipValue} onChange={(value) => updateSetting("velocityClipValue", value)} />
              </ControlSection>

              <ControlSection title="Probe">
                <div className="grid grid-cols-3 gap-2">
                  <IconButton label="Probe" active>
                    <Crosshair className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Branch" active={settings.branching} onClick={() => updateSetting("branching", !settings.branching)}>
                    <GitBranch className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Clear" onClick={() => rendererRef.current?.clearProbes()}>
                    <Eraser className="h-4 w-4" />
                  </IconButton>
                </div>
                <SelectRow
                  label="Count"
                  value={String(settings.probeCount)}
                  onChange={(value) => updateSetting("probeCount", Number(value) as 1 | 4 | 8)}
                  options={[
                    ["1", "1"],
                    ["4", "4"],
                    ["8", "8"],
                  ]}
                />
                <div className="min-h-24 border border-white/10 bg-black/25 p-3 text-sm leading-relaxed text-white/70">
                  {analysis}
                </div>
              </ControlSection>

              <ControlSection title="Overlay">
                <ToggleRow label="OOS cloud" checked={settings.oosVisible} onChange={(value) => updateSetting("oosVisible", value)} />
                <ToggleRow label="Bounds" checked={settings.boundsVisible} onChange={(value) => updateSetting("boundsVisible", value)} />
                <SliderRow label="Bounds alpha" min={0.04} max={0.8} step={0.01} value={settings.boundsOpacity} onChange={(value) => updateSetting("boundsOpacity", value)} />
                <div className="flex items-center gap-2 border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">
                  <Gauge className="h-4 w-4 shrink-0" />
                  <span>WebGL2 static export for GitHub Pages</span>
                </div>
              </ControlSection>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function Metric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="inline-flex h-9 items-center gap-2 border border-white/10 bg-white/[0.04] px-3">
      {icon}
      <span className="font-mono">{value}</span>
    </div>
  )
}

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex h-10 items-center justify-center gap-2 border text-sm transition-colors ${
        active ? "border-[#7AF7B1] bg-[#0D2A1B] text-[#BFFFD8]" : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/10"
      }`}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  )
}

function Segmented<T extends string>({
  value,
  items,
  labels,
  onChange,
}: {
  value: T
  items: readonly T[]
  labels: Record<T, string>
  onChange: (value: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`h-9 border px-2 text-sm transition-colors ${
            value === item ? "border-[#7AF7B1] bg-[#0D2A1B] text-[#BFFFD8]" : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10"
          }`}
        >
          {labels[item]}
        </button>
      ))}
    </div>
  )
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: [string, string][]
  onChange: (value: string) => void
}) {
  return (
    <label className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3 text-sm text-white/65">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 border border-white/10 bg-[#111A20] px-2 text-white outline-none"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="grid grid-cols-[92px_minmax(0,1fr)_52px] items-center gap-3 text-sm text-white/65">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 accent-[#7AF7B1]"
      />
      <span className="text-right font-mono text-xs text-white/50">{value.toFixed(value < 0.1 ? 3 : 2)}</span>
    </label>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex h-9 items-center justify-between gap-3 border border-white/10 bg-white/[0.035] px-3 text-sm text-white/70">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#7AF7B1]" />
    </label>
  )
}

type GridMeta = {
  grid: number
  axisMin: [number, number, number]
  axisMax: [number, number, number]
  span: [number, number, number]
  oosCount: number
  speedP98: number
  speedMax: number
}

type Probe = {
  slot: number
  path: number[][]
}

class MindVisRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private settings: MindVisSettings
  private setStatus: React.Dispatch<React.SetStateAction<ViewerStatus>>
  private setAnalysis: React.Dispatch<React.SetStateAction<string>>
  private meta: GridMeta | null = null
  private textures = new Map<FieldMode, WebGLTexture>()
  private entropyTexture: WebGLTexture | null = null
  private updateProgram: WebGLProgram | null = null
  private renderProgram: WebGLProgram | null = null
  private oosProgram: WebGLProgram | null = null
  private lineProgram: WebGLProgram | null = null
  private particleBuffers: [WebGLBuffer | null, WebGLBuffer | null] = [null, null]
  private particleVaos: [WebGLVertexArrayObject | null, WebGLVertexArrayObject | null] = [null, null]
  private transformFeedback: WebGLTransformFeedback | null = null
  private useA = true
  private particleCount = 0
  private oosBuffer: WebGLBuffer | null = null
  private oosCount = 0
  private boxBuffer: WebGLBuffer | null = null
  private trailBuffer: WebGLBuffer | null = null
  private animationFrame = 0
  private disposed = false
  private frames = 0
  private fpsT0 = performance.now()
  private fps = 0
  private azimuth = 0.72
  private elevation = 0.34
  private zoom = 2.15
  private pointer: { id: number; x: number; y: number; drag: boolean } | null = null
  private probes: Probe[] = []

  private readonly strideFloats = 10
  private readonly strideBytes = 10 * 4
  private readonly displayScale: [number, number, number] = [1.72, 1.5, 1.42]

  constructor(
    canvas: HTMLCanvasElement,
    settings: MindVisSettings,
    setStatus: React.Dispatch<React.SetStateAction<ViewerStatus>>,
    setAnalysis: React.Dispatch<React.SetStateAction<string>>,
  ) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    })
    if (!gl) throw new Error("WebGL2 is not available in this browser.")

    this.canvas = canvas
    this.gl = gl
    this.settings = settings
    this.setStatus = setStatus
    this.setAnalysis = setAnalysis
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onWheel = this.onWheel.bind(this)
    this.onVisibility = this.onVisibility.bind(this)
  }

  async load() {
    const gl = this.gl
    gl.getExtension("EXT_color_buffer_float")
    const linearFloat = gl.getExtension("OES_texture_float_linear")

    this.setStatus((current) => ({ ...current, message: "Loading field binaries" }))
    const root = `${basePath()}/data/mindvis`
    const fieldRoot = `${root}/field/grid64`
    const meta = (await fetchJson(`${fieldRoot}/meta.json`)) as GridMeta
    this.meta = meta

    const [mean, gated, mu1, mu2, entropy, oos] = await Promise.all([
      fetchBytes(`${fieldRoot}/field_mean.f16.bin`),
      fetchBytes(`${fieldRoot}/field_gated.f16.bin`),
      fetchBytes(`${fieldRoot}/field_mu1.f16.bin`),
      fetchBytes(`${fieldRoot}/field_mu2.f16.bin`),
      fetchBytes(`${fieldRoot}/field_entropy.f16.bin`),
      fetchBytes(`${fieldRoot}/oos_points.f16.bin`),
    ])

    this.textures.set("mean", this.uploadFieldTexture(mean, meta.grid, Boolean(linearFloat)))
    this.textures.set("gated", this.uploadFieldTexture(gated, meta.grid, Boolean(linearFloat)))
    this.textures.set("mu1", this.uploadFieldTexture(mu1, meta.grid, Boolean(linearFloat)))
    this.textures.set("mu2", this.uploadFieldTexture(mu2, meta.grid, Boolean(linearFloat)))
    this.entropyTexture = this.uploadEntropyTexture(entropy, meta.grid, Boolean(linearFloat))
    this.uploadOos(oos)

    this.updateProgram = linkProgram(
      gl,
      updateVertexShader,
      emptyFragmentShader,
      ["v_pos", "v_age", "v_ttl", "v_seed", "v_entropyPrev", "v_entropyEma"],
    )
    this.renderProgram = linkProgram(gl, particleVertexShader, particleFragmentShader)
    this.oosProgram = linkProgram(gl, oosVertexShader, oosFragmentShader)
    this.lineProgram = linkProgram(gl, lineVertexShader, lineFragmentShader)
    this.transformFeedback = gl.createTransformFeedback()
    this.boxBuffer = makeBuffer(gl, new Float32Array(makeBoxLines(this.displayScale)), gl.STATIC_DRAW)
    this.trailBuffer = gl.createBuffer()
    this.setParticleCount(this.settings.particleCount)
    this.bindEvents()

    this.setStatus({
      fps: 0,
      particles: this.particleCount,
      loaded: true,
      message: "Ready",
      field: this.settings.fieldMode,
    })
    this.animationFrame = requestAnimationFrame(() => this.frame())
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    this.canvas.removeEventListener("pointerdown", this.onPointerDown)
    this.canvas.removeEventListener("pointermove", this.onPointerMove)
    this.canvas.removeEventListener("pointerup", this.onPointerUp)
    this.canvas.removeEventListener("pointercancel", this.onPointerUp)
    this.canvas.removeEventListener("wheel", this.onWheel)
    document.removeEventListener("visibilitychange", this.onVisibility)
  }

  setSettings(settings: MindVisSettings) {
    const previousCount = this.settings.particleCount
    this.settings = settings
    if (settings.particleCount !== previousCount && this.meta) {
      this.setParticleCount(settings.particleCount)
    }
    this.setStatus((current) => ({ ...current, field: settings.fieldMode, particles: settings.particleCount }))
  }

  reset() {
    if (!this.meta) return
    this.setParticleCount(this.settings.particleCount)
    this.clearProbes()
  }

  clearProbes() {
    this.probes = []
    this.setAnalysis("Probe trajectory analysis will appear here.")
  }

  async explainProbe() {
    if (!this.meta || this.probes.length === 0 || this.probes[0].path.length < 2) {
      this.setAnalysis("No complete probe path yet.")
      return
    }

    const probe = this.probes[0]
    const api = backendUrl()
    if (api) {
      this.setAnalysis("Asking the Python backend for probe interpretation...")
      try {
        const response = await fetch(`${api}/api/mindvis/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldMode: this.settings.fieldMode,
            trajectory: probe.path,
          }),
        })
        if (!response.ok) throw new Error(`backend returned ${response.status}`)
        const data = (await response.json()) as { text?: string; summary?: string }
        this.setAnalysis(data.text ?? data.summary ?? "Backend returned no explanation text.")
        return
      } catch (error) {
        this.setAnalysis(
          `Python backend unavailable (${error instanceof Error ? error.message : "request failed"}). Showing local trajectory summary instead.`,
        )
      }
    }

    const first = probe.path[0]
    const last = probe.path[probe.path.length - 1]
    const delta = [last[0] - first[0], last[1] - first[1], last[2] - first[2]]
    const worldDelta = delta.map((value, index) => value * this.meta!.span[index])
    const distance = Math.hypot(worldDelta[0], worldDelta[1], worldDelta[2])
    const dominantAxis = Math.max(Math.abs(worldDelta[0]), Math.abs(worldDelta[1]), Math.abs(worldDelta[2]))
    const parts = []
    if (Math.abs(worldDelta[0]) === dominantAxis) parts.push(worldDelta[0] > 0 ? "rightward" : "leftward")
    if (Math.abs(worldDelta[1]) === dominantAxis) parts.push(worldDelta[1] > 0 ? "anterior" : "posterior")
    if (Math.abs(worldDelta[2]) === dominantAxis) parts.push(worldDelta[2] > 0 ? "superior" : "inferior")

    this.setAnalysis(
      `Probe path ${probe.path.length} samples, ${distance.toFixed(3)} field units. Dominant drift is ${parts.join(
        " / ",
      )}; entropy/color response is taken from the shipped grid64 MDN snapshot.`,
    )
  }

  private bindEvents() {
    this.canvas.addEventListener("pointerdown", this.onPointerDown)
    this.canvas.addEventListener("pointermove", this.onPointerMove)
    this.canvas.addEventListener("pointerup", this.onPointerUp)
    this.canvas.addEventListener("pointercancel", this.onPointerUp)
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false })
    document.addEventListener("visibilitychange", this.onVisibility)
  }

  private onVisibility() {
    if (document.hidden) {
      this.settings = { ...this.settings, paused: true }
    }
  }

  private onPointerDown(event: PointerEvent) {
    this.canvas.setPointerCapture(event.pointerId)
    this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, drag: false }
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return
    const dx = event.clientX - this.pointer.x
    const dy = event.clientY - this.pointer.y
    if (Math.hypot(dx, dy) > 3) this.pointer.drag = true
    if (this.pointer.drag) {
      this.azimuth += dx * 0.006
      this.elevation = clamp(this.elevation + dy * 0.004, -1.1, 1.1)
      this.pointer.x = event.clientX
      this.pointer.y = event.clientY
    }
  }

  private onPointerUp(event: PointerEvent) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return
    const wasDrag = this.pointer.drag
    this.pointer = null
    if (!wasDrag) this.spawnProbe(event.clientX, event.clientY)
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault()
    this.zoom = clamp(this.zoom + event.deltaY * 0.0014, 1.15, 4.2)
  }

  private spawnProbe(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    const x = clamp((clientX - rect.left) / Math.max(rect.width, 1), 0.01, 0.99)
    const y = clamp(1 - (clientY - rect.top) / Math.max(rect.height, 1), 0.01, 0.99)
    const count = this.settings.branching ? this.settings.probeCount : 1
    const offsets = makeProbeOffsets(count)
    this.probes = []

    offsets.forEach((offset, index) => {
      const pos = [clamp(x + offset[0], 0.01, 0.99), clamp(y + offset[1], 0.01, 0.99), clamp(0.5 + offset[2], 0.01, 0.99)]
      this.writeParticle(index, pos, 0, 1000000, pos, 0, 0)
      this.probes.push({ slot: index, path: [pos] })
    })
    this.setAnalysis(`${count} probe${count === 1 ? "" : "s"} active.`)
  }

  private uploadFieldTexture(buffer: ArrayBuffer, grid: number, linear: boolean) {
    const gl = this.gl
    const tex = gl.createTexture()
    if (!tex) throw new Error("Could not create field texture.")
    gl.bindTexture(gl.TEXTURE_3D, tex)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA16F, grid, grid, grid, 0, gl.RGBA, gl.HALF_FLOAT, new Uint16Array(buffer))
    return tex
  }

  private uploadEntropyTexture(buffer: ArrayBuffer, grid: number, linear: boolean) {
    const gl = this.gl
    const tex = gl.createTexture()
    if (!tex) throw new Error("Could not create entropy texture.")
    gl.bindTexture(gl.TEXTURE_3D, tex)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F, grid, grid, grid, 0, gl.RED, gl.HALF_FLOAT, new Uint16Array(buffer))
    return tex
  }

  private uploadOos(buffer: ArrayBuffer) {
    const gl = this.gl
    this.oosBuffer = gl.createBuffer()
    this.oosCount = buffer.byteLength / 2 / 3
    gl.bindBuffer(gl.ARRAY_BUFFER, this.oosBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(buffer), gl.STATIC_DRAW)
  }

  private setParticleCount(count: number) {
    const gl = this.gl
    this.particleCount = count
    for (const vao of this.particleVaos) if (vao) gl.deleteVertexArray(vao)
    for (const buffer of this.particleBuffers) if (buffer) gl.deleteBuffer(buffer)

    const data = new Float32Array(count * this.strideFloats)
    for (let i = 0; i < count; i += 1) {
      const seed = randomPointInSphere()
      const offset = i * this.strideFloats
      data[offset] = seed[0]
      data[offset + 1] = seed[1]
      data[offset + 2] = seed[2]
      data[offset + 3] = Math.random() * 90
      data[offset + 4] = 55 + Math.random() * 90
      data[offset + 5] = seed[0]
      data[offset + 6] = seed[1]
      data[offset + 7] = seed[2]
      data[offset + 8] = 0
      data[offset + 9] = 0
    }

    const empty = new Float32Array(count * this.strideFloats)
    this.particleBuffers = [makeBuffer(gl, data, gl.DYNAMIC_COPY), makeBuffer(gl, empty, gl.DYNAMIC_COPY)]
    this.particleVaos = [this.makeParticleVao(this.particleBuffers[0]), this.makeParticleVao(this.particleBuffers[1])]
    this.useA = true
    this.probes = []
    this.setStatus((current) => ({ ...current, particles: count }))
  }

  private makeParticleVao(buffer: WebGLBuffer | null) {
    const gl = this.gl
    const vao = gl.createVertexArray()
    if (!vao || !buffer) throw new Error("Could not create particle VAO.")
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, this.strideBytes, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, this.strideBytes, 12)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, this.strideBytes, 16)
    gl.enableVertexAttribArray(3)
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, this.strideBytes, 20)
    gl.enableVertexAttribArray(4)
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, this.strideBytes, 32)
    gl.enableVertexAttribArray(5)
    gl.vertexAttribPointer(5, 1, gl.FLOAT, false, this.strideBytes, 36)
    gl.bindVertexArray(null)
    return vao
  }

  private writeParticle(slot: number, pos: number[], age: number, ttl: number, seed: number[], entropyPrev: number, entropyEma: number) {
    const gl = this.gl
    const data = new Float32Array([pos[0], pos[1], pos[2], age, ttl, seed[0], seed[1], seed[2], entropyPrev, entropyEma])
    for (const buffer of this.particleBuffers) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferSubData(gl.ARRAY_BUFFER, slot * this.strideBytes, data)
    }
  }

  private fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    const rect = this.canvas.getBoundingClientRect()
    const width = Math.max(2, Math.floor(rect.width * dpr))
    const height = Math.max(2, Math.floor(rect.height * dpr))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
      this.gl.viewport(0, 0, width, height)
    }
  }

  private frame() {
    if (this.disposed) return
    this.fit()
    this.captureProbes()
    this.render()
    if (!this.settings.paused && !document.hidden) this.updateParticles()
    this.updateFps()
    this.animationFrame = requestAnimationFrame(() => this.frame())
  }

  private updateParticles() {
    if (!this.updateProgram || !this.meta || !this.entropyTexture) return
    const gl = this.gl
    const srcIndex = this.useA ? 0 : 1
    const dstIndex = this.useA ? 1 : 0
    const field = this.textures.get(this.settings.fieldMode)
    if (!field) return

    gl.useProgram(this.updateProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_3D, field)
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, "u_field"), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_3D, this.entropyTexture)
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, "u_entropy"), 1)
    gl.uniform3fv(gl.getUniformLocation(this.updateProgram, "u_span"), this.meta.span)
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, "u_dt"), this.settings.dt)
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, "u_speedScale"), this.settings.speedScale)
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, "u_ttlScale"), this.settings.lifetimeScale)
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, "u_speedNorm"), Math.max(this.meta.speedP98, 0.001))
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, "u_speedFilter"), this.settings.speedFilter ? 1 : 0)
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, "u_filterHigh"), this.settings.filterHigh ? 1 : 0)
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, "u_filterFraction"), this.settings.filterFraction)
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, "u_velocityClip"), this.settings.velocityClip ? 1 : 0)
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, "u_velocityClipValue"), this.settings.velocityClipValue)

    gl.bindVertexArray(this.particleVaos[srcIndex])
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedback)
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.particleBuffers[dstIndex])
    gl.enable(gl.RASTERIZER_DISCARD)
    gl.beginTransformFeedback(gl.POINTS)
    gl.drawArrays(gl.POINTS, 0, this.particleCount)
    gl.endTransformFeedback()
    gl.disable(gl.RASTERIZER_DISCARD)
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null)
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
    gl.bindVertexArray(null)
    this.useA = !this.useA
  }

  private captureProbes() {
    if (!this.probes.length) return
    const gl = this.gl
    const current = this.useA ? this.particleBuffers[0] : this.particleBuffers[1]
    if (!current) return
    gl.bindBuffer(gl.ARRAY_BUFFER, current)
    const pos = new Float32Array(3)
    for (const probe of this.probes) {
      gl.getBufferSubData(gl.ARRAY_BUFFER, probe.slot * this.strideBytes, pos)
      const last = probe.path[probe.path.length - 1]
      if (!last || Math.hypot(pos[0] - last[0], pos[1] - last[1], pos[2] - last[2]) > 0.0025) {
        probe.path.push([pos[0], pos[1], pos[2]])
        if (probe.path.length > 700) probe.path.shift()
      }
    }
  }

  private render() {
    if (!this.renderProgram || !this.oosProgram || !this.lineProgram || !this.meta || !this.entropyTexture) return
    const gl = this.gl
    const mvp = this.mvp()
    gl.clearColor(0.005, 0.008, 0.012, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)

    if (this.settings.boundsVisible) this.drawBounds(mvp)
    if (this.settings.oosVisible) this.drawOos(mvp)
    this.drawParticles(mvp)
    this.drawTrails(mvp)
  }

  private drawParticles(mvp: Float32Array) {
    if (!this.renderProgram || !this.meta || !this.entropyTexture) return
    const gl = this.gl
    const field = this.textures.get(this.settings.fieldMode)
    if (!field) return
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.useProgram(this.renderProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_3D, field)
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, "u_field"), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_3D, this.entropyTexture)
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, "u_entropy"), 1)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.renderProgram, "u_mvp"), false, mvp)
    gl.uniform3fv(gl.getUniformLocation(this.renderProgram, "u_displayScale"), this.displayScale)
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, "u_speedNorm"), Math.max(this.meta.speedP98, 0.001))
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, "u_pointSize"), this.settings.pointSize)
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, "u_alphaScale"), this.settings.opacityScale)
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, "u_colorMode"), colorModeIndex(this.settings.colorMode))
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, "u_colormap"), colorMapIndex(this.settings.colorMap))
    gl.bindVertexArray(this.useA ? this.particleVaos[0] : this.particleVaos[1])
    gl.drawArrays(gl.POINTS, 0, this.particleCount)
  }

  private drawOos(mvp: Float32Array) {
    if (!this.oosProgram || !this.oosBuffer || !this.meta) return
    const gl = this.gl
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(this.oosProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.oosProgram, "u_mvp"), false, mvp)
    gl.uniform3fv(gl.getUniformLocation(this.oosProgram, "u_amin"), this.meta.axisMin)
    gl.uniform3fv(gl.getUniformLocation(this.oosProgram, "u_span"), this.meta.span)
    gl.uniform3fv(gl.getUniformLocation(this.oosProgram, "u_displayScale"), this.displayScale)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.oosBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.HALF_FLOAT, false, 0, 0)
    gl.drawArrays(gl.POINTS, 0, this.oosCount)
  }

  private drawBounds(mvp: Float32Array) {
    if (!this.lineProgram || !this.boxBuffer) return
    const gl = this.gl
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(this.lineProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, "u_mvp"), false, mvp)
    gl.uniform4f(gl.getUniformLocation(this.lineProgram, "u_color"), 0.48, 0.97, 0.7, this.settings.boundsOpacity)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boxBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.LINES, 0, 24)
  }

  private drawTrails(mvp: Float32Array) {
    if (!this.lineProgram || !this.trailBuffer || !this.probes.length) return
    const gl = this.gl
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(this.lineProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, "u_mvp"), false, mvp)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)

    for (let i = 0; i < this.probes.length; i += 1) {
      const probe = this.probes[i]
      if (probe.path.length < 2) continue
      const points = new Float32Array(probe.path.length * 3)
      for (let j = 0; j < probe.path.length; j += 1) {
        points[j * 3] = (probe.path[j][0] - 0.5) * this.displayScale[0]
        points[j * 3 + 1] = (probe.path[j][1] - 0.5) * this.displayScale[1]
        points[j * 3 + 2] = (probe.path[j][2] - 0.5) * this.displayScale[2]
      }
      gl.bufferData(gl.ARRAY_BUFFER, points, gl.DYNAMIC_DRAW)
      const hue = i / Math.max(this.probes.length, 1)
      gl.uniform4f(gl.getUniformLocation(this.lineProgram, "u_color"), 1.0 - hue * 0.35, 0.9, 0.25 + hue * 0.6, 0.95)
      gl.drawArrays(gl.LINE_STRIP, 0, probe.path.length)
    }
  }

  private mvp() {
    const proj = mat4Identity()
    const view = mat4Identity()
    const mvp = mat4Identity()
    const aspect = this.canvas.width / Math.max(this.canvas.height, 1)
    mat4Perspective(proj, Math.PI / 3, aspect, 0.01, 50)
    const eye: [number, number, number] = [
      Math.sin(this.azimuth) * Math.cos(this.elevation) * this.zoom,
      Math.sin(this.elevation) * this.zoom,
      Math.cos(this.azimuth) * Math.cos(this.elevation) * this.zoom,
    ]
    mat4LookAt(view, eye, [0, 0, 0], [0, 1, 0])
    mat4Multiply(mvp, proj, view)
    return mvp
  }

  private updateFps() {
    this.frames += 1
    const now = performance.now()
    if (now - this.fpsT0 > 500) {
      const instant = (this.frames * 1000) / (now - this.fpsT0)
      this.fps = this.fps ? this.fps * 0.65 + instant * 0.35 : instant
      this.frames = 0
      this.fpsT0 = now
      this.setStatus((current) => ({
        ...current,
        fps: this.fps,
        particles: this.particleCount,
        message: this.settings.paused ? "Paused" : "Ready",
        field: this.settings.fieldMode,
      }))
    }
  }
}

const updateVertexShader = `#version 300 es
precision highp float;
precision highp sampler3D;
layout(location=0) in vec3 a_pos;
layout(location=1) in float a_age;
layout(location=2) in float a_ttl;
layout(location=3) in vec3 a_seed;
layout(location=4) in float a_entropyPrev;
layout(location=5) in float a_entropyEma;
uniform sampler3D u_field;
uniform sampler3D u_entropy;
uniform vec3 u_span;
uniform float u_dt;
uniform float u_speedScale;
uniform float u_ttlScale;
uniform float u_speedNorm;
uniform int u_speedFilter;
uniform int u_filterHigh;
uniform float u_filterFraction;
uniform int u_velocityClip;
uniform float u_velocityClipValue;
out vec3 v_pos;
out float v_age;
out float v_ttl;
out vec3 v_seed;
out float v_entropyPrev;
out float v_entropyEma;
void main() {
  vec3 p = clamp(a_pos, vec3(0.001), vec3(0.999));
  vec3 vWorld = texture(u_field, p).xyz;
  float speed = length(vWorld);
  if (u_velocityClip == 1 && speed > u_velocityClipValue) {
    vWorld *= u_velocityClipValue / max(speed, 0.0001);
    speed = u_velocityClipValue;
  }
  float speedN = clamp(speed / max(u_speedNorm, 0.0001), 0.0, 1.5);
  float filtered = 0.0;
  if (u_speedFilter == 1) {
    filtered = (u_filterHigh == 1)
      ? float(speedN < u_filterFraction)
      : float(speedN > u_filterFraction);
  }
  vec3 stepv = (vWorld / max(u_span, vec3(0.0001))) * (u_dt * u_speedScale);
  p = fract(p + stepv);
  float ent = texture(u_entropy, p).r;
  float age = a_age + 1.0 + filtered * a_ttl;
  float ttl = a_ttl * u_ttlScale;
  float ema = mix(a_entropyEma, ent - a_entropyPrev, 0.2);
  if (age > ttl) {
    p = a_seed;
    age = 0.0;
    ent = texture(u_entropy, p).r;
    ema = 0.0;
  }
  v_pos = p;
  v_age = age;
  v_ttl = a_ttl;
  v_seed = a_seed;
  v_entropyPrev = ent;
  v_entropyEma = ema;
}`

const emptyFragmentShader = `#version 300 es
precision highp float;
out vec4 outColor;
void main() { outColor = vec4(0.0); }`

const particleVertexShader = `#version 300 es
precision highp float;
precision highp sampler3D;
layout(location=0) in vec3 a_pos;
layout(location=1) in float a_age;
layout(location=2) in float a_ttl;
layout(location=4) in float a_entropyPrev;
layout(location=5) in float a_entropyEma;
uniform mat4 u_mvp;
uniform sampler3D u_field;
uniform sampler3D u_entropy;
uniform vec3 u_displayScale;
uniform float u_speedNorm;
uniform float u_pointSize;
out float v_speed;
out float v_entropy;
out float v_deltaEntropy;
out float v_alpha;
void main() {
  vec3 v = texture(u_field, a_pos).xyz;
  v_speed = clamp(length(v) / max(u_speedNorm, 0.0001), 0.0, 1.0);
  v_entropy = texture(u_entropy, a_pos).r;
  v_deltaEntropy = a_entropyEma;
  float ageN = a_age / max(a_ttl, 1.0);
  v_alpha = smoothstep(0.0, 0.08, ageN) * (1.0 - smoothstep(0.82, 1.0, ageN));
  vec3 p = (a_pos - 0.5) * u_displayScale;
  gl_Position = u_mvp * vec4(p, 1.0);
  gl_PointSize = u_pointSize * (0.8 + 0.9 * v_speed);
}`

const particleFragmentShader = `#version 300 es
precision highp float;
in float v_speed;
in float v_entropy;
in float v_deltaEntropy;
in float v_alpha;
uniform float u_alphaScale;
uniform int u_colorMode;
uniform int u_colormap;
out vec4 outColor;
vec3 turbo(float x) {
  x = clamp(x, 0.0, 1.0);
  float r = (34.61 + x * (1172.33 + x * (-10793.56 + x * (33300.12 + x * (-38345.17 + 14829.80 * x))))) / 255.0;
  float g = (23.31 + x * (557.33 + x * (1225.33 + x * (-3574.96 + x * 2199.29)))) / 255.0;
  float b = (27.20 + x * (3211.10 + x * (-15327.97 + x * (34592.87 + x * (-30538.66 + 9347.97 * x))))) / 255.0;
  return clamp(vec3(r, g, b), 0.0, 1.0);
}
vec3 rainbow(float t) {
  t = clamp(t, 0.0, 1.0);
  float h = t * 4.0;
  float i = floor(h);
  float f = h - i;
  if (i < 1.0) return vec3(0.0, f, 1.0);
  if (i < 2.0) return vec3(0.0, 1.0, 1.0 - f);
  if (i < 3.0) return vec3(f, 1.0, 0.0);
  return vec3(1.0, 1.0 - f, 0.0);
}
vec3 bipolar(float d) {
  float a = clamp(abs(d) * 4.0, 0.0, 1.0);
  vec3 white = vec3(0.94);
  vec3 pos = vec3(1.0, 0.42, 0.12);
  vec3 neg = vec3(0.1, 0.55, 1.0);
  return mix(white, d >= 0.0 ? pos : neg, a);
}
vec3 palette(float t, float signedValue) {
  if (u_colormap == 1) return rainbow(t);
  if (u_colormap == 2) return bipolar(signedValue);
  return turbo(t);
}
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if (r > 0.5) discard;
  float sprite = smoothstep(0.5, 0.05, r);
  float metric = v_speed;
  float signedMetric = v_deltaEntropy;
  if (u_colorMode == 1) metric = v_entropy;
  if (u_colorMode == 2) metric = clamp(abs(v_deltaEntropy) * 4.0, 0.0, 1.0);
  if (u_colorMode == 3) metric = clamp(0.5 + v_deltaEntropy * 2.0, 0.0, 1.0);
  vec3 color = (u_colorMode == 2 || u_colorMode == 3) ? bipolar(signedMetric) : palette(metric, signedMetric);
  outColor = vec4(color * sprite, sprite * v_alpha * u_alphaScale * 0.72);
}`

const oosVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_world;
uniform mat4 u_mvp;
uniform vec3 u_amin;
uniform vec3 u_span;
uniform vec3 u_displayScale;
void main() {
  vec3 p = ((a_world - u_amin) / max(u_span, vec3(0.0001)) - 0.5) * u_displayScale;
  gl_Position = u_mvp * vec4(p, 1.0);
  gl_PointSize = 1.5;
}`

const oosFragmentShader = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  if (length(d) > 0.5) discard;
  outColor = vec4(0.7, 0.95, 1.0, 0.16);
}`

const lineVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_pos;
uniform mat4 u_mvp;
void main() {
  gl_Position = u_mvp * vec4(a_pos, 1.0);
}`

const lineFragmentShader = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
}`

function colorModeIndex(mode: ColorMode) {
  return ["speed", "entropy", "deltaEntropy", "directionalDelta"].indexOf(mode)
}

function colorMapIndex(map: ColorMap) {
  return ["turbo", "rainbow", "bipolar"].indexOf(map)
}

async function fetchJson(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load ${url}`)
  return response.json()
}

async function fetchBytes(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load ${url}`)
  return response.arrayBuffer()
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error("Could not create shader.")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed.")
  }
  return shader
}

function linkProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string, varyings?: string[]) {
  const program = gl.createProgram()
  if (!program) throw new Error("Could not create WebGL program.")
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource))
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource))
  if (varyings) gl.transformFeedbackVaryings(program, varyings, gl.INTERLEAVED_ATTRIBS)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Program link failed.")
  }
  return program
}

function makeBuffer(gl: WebGL2RenderingContext, data: BufferSource, usage: number) {
  const buffer = gl.createBuffer()
  if (!buffer) throw new Error("Could not create WebGL buffer.")
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, usage)
  return buffer
}

function randomPointInSphere() {
  let x = 0
  let y = 0
  let z = 0
  let r = 2
  while (r > 0.78) {
    x = Math.random() * 0.96 + 0.02
    y = Math.random() * 0.96 + 0.02
    z = Math.random() * 0.96 + 0.02
    const dx = x - 0.5
    const dy = y - 0.5
    const dz = z - 0.5
    r = Math.hypot(dx, dy, dz)
  }
  return [x, y, z]
}

function makeProbeOffsets(count: number) {
  if (count === 1) return [[0, 0, 0]]
  if (count === 4)
    return [
      [-0.025, -0.025, 0],
      [0.025, -0.025, 0],
      [-0.025, 0.025, 0],
      [0.025, 0.025, 0],
    ]
  return [
    [-0.03, -0.03, -0.018],
    [0.03, -0.03, -0.018],
    [-0.03, 0.03, -0.018],
    [0.03, 0.03, -0.018],
    [-0.03, -0.03, 0.018],
    [0.03, -0.03, 0.018],
    [-0.03, 0.03, 0.018],
    [0.03, 0.03, 0.018],
  ]
}

function makeBoxLines(scale: [number, number, number]) {
  const x = scale[0] * 0.5
  const y = scale[1] * 0.5
  const z = scale[2] * 0.5
  const p = [
    [-x, -y, -z],
    [x, -y, -z],
    [x, y, -z],
    [-x, y, -z],
    [-x, -y, z],
    [x, -y, z],
    [x, y, z],
    [-x, y, z],
  ]
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ]
  return edges.flatMap(([a, b]) => [...p[a], ...p[b]])
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function mat4Identity() {
  const m = new Float32Array(16)
  m[0] = 1
  m[5] = 1
  m[10] = 1
  m[15] = 1
  return m
}

function mat4Perspective(out: Float32Array, fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2)
  out.fill(0)
  out[0] = f / aspect
  out[5] = f
  out[10] = (far + near) / (near - far)
  out[11] = -1
  out[14] = (2 * far * near) / (near - far)
}

function mat4LookAt(out: Float32Array, eye: number[], target: number[], up: number[]) {
  const zx = eye[0] - target[0]
  const zy = eye[1] - target[1]
  const zz = eye[2] - target[2]
  let zl = Math.hypot(zx, zy, zz) || 1
  const z0 = zx / zl
  const z1 = zy / zl
  const z2 = zz / zl
  let xx = up[1] * z2 - up[2] * z1
  let xy = up[2] * z0 - up[0] * z2
  let xz = up[0] * z1 - up[1] * z0
  let xl = Math.hypot(xx, xy, xz) || 1
  xx /= xl
  xy /= xl
  xz /= xl
  const y0 = z1 * xz - z2 * xy
  const y1 = z2 * xx - z0 * xz
  const y2 = z0 * xy - z1 * xx
  out[0] = xx
  out[1] = y0
  out[2] = z0
  out[3] = 0
  out[4] = xy
  out[5] = y1
  out[6] = z1
  out[7] = 0
  out[8] = xz
  out[9] = y2
  out[10] = z2
  out[11] = 0
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2])
  out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2])
  out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2])
  out[15] = 1
}

function mat4Multiply(out: Float32Array, a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16)
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0
      for (let k = 0; k < 4; k += 1) sum += a[k * 4 + row] * b[col * 4 + k]
      o[col * 4 + row] = sum
    }
  }
  out.set(o)
}
