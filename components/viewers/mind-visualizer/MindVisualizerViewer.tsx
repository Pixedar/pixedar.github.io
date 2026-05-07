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
  Home,
  RefreshCcw,
  Sparkles,
  X,
  Waves,
} from "lucide-react"

type FieldMode = "mean" | "gated" | "mu1" | "mu2" | "mu3" | "mu4" | "mu5" | "mu6"
type ColorMode = "speed" | "entropy"
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
  meshVisible: boolean
  meshOpacity: number
  branching: boolean
  probeMoveMode: boolean
  probeCount: 1 | 4 | 8
}

type ViewerStatus = {
  fps: number
  particles: number
  loaded: boolean
  message: string
  field: FieldMode
}

type ProbeGuide = {
  visible: boolean
  title: string
  detail: string
  tone: "move" | "flow" | "processing" | "warn"
}

const initialSettings: MindVisSettings = {
  paused: false,
  fieldMode: "mean",
  colorMode: "speed",
  colorMap: "turbo",
  particleCount: 100000,
  speedScale: 1,
  lifetimeScale: 1,
  opacityScale: 1,
  dt: 1,
  pointSize: 5,
  speedFilter: false,
  filterHigh: true,
  filterFraction: 1,
  velocityClip: false,
  velocityClipValue: 1,
  oosVisible: false,
  boundsVisible: true,
  boundsOpacity: 0.28,
  meshVisible: false,
  meshOpacity: 0.14,
  branching: false,
  probeMoveMode: false,
  probeCount: 1,
}

const fieldLabels: Record<FieldMode, string> = {
  mean: "Mean",
  gated: "Gated",
  mu1: "Mu 1",
  mu2: "Mu 2",
  mu3: "Mu 3",
  mu4: "Mu 4",
  mu5: "Mu 5",
  mu6: "Mu 6",
}

const fieldModes = ["mean", "gated", "mu1", "mu2", "mu3", "mu4", "mu5", "mu6"] as const

const colorLabels: Record<ColorMode, string> = {
  speed: "Speed",
  entropy: "Entropy",
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
    message: "Loading grid125 field",
    field: initialSettings.fieldMode,
  })
  const [analysis, setAnalysis] = useState("Probe trajectory analysis will appear here.")
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [probeGuide, setProbeGuide] = useState<ProbeGuide>({
    visible: false,
    title: "",
    detail: "",
    tone: "move",
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new MindVisRenderer(canvas, settings, setSettings, setStatus, setAnalysis, setAnalysisOpen, setProbeGuide)
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
      if (event.key === "Enter") {
        event.preventDefault()
        rendererRef.current?.startProbeFlow()
        return
      }

      setSettings((current) => {
        const next = { ...current }
        const key = event.key
        if (key === " ") next.paused = !current.paused
        else if (key.toLowerCase() === "f") next.fieldMode = cycle(fieldModes, current.fieldMode)
        else if (key.toLowerCase() === "v") next.colorMode = cycle(["speed", "entropy"] as const, current.colorMode)
        else if (key.toLowerCase() === "m") next.colorMap = cycle(["turbo", "rainbow", "bipolar"] as const, current.colorMap)
        else if (key === "[") next.dt = clamp(current.dt / 1.25, 0.05, 4)
        else if (key === "]") next.dt = clamp(current.dt * 1.25, 0.05, 4)
        else if (key === "+" || key === "=") next.speedScale = clamp(current.speedScale * 1.25, 0.05, 2.5)
        else if (key === "-" || key === "_") next.speedScale = clamp(current.speedScale / 1.25, 0.05, 2.5)
        else if (key === "1") next.lifetimeScale = clamp(current.lifetimeScale / 1.25, 0.35, 3)
        else if (key === "2") next.lifetimeScale = clamp(current.lifetimeScale * 1.25, 0.35, 3)
        else if (key === "7") next.opacityScale = clamp(current.opacityScale / 1.25, 0.02, 1)
        else if (key === "8") next.opacityScale = clamp(current.opacityScale * 1.25, 0.02, 1)
        else if (key.toLowerCase() === "y") next.speedFilter = !current.speedFilter
        else if (key.toLowerCase() === "u") next.filterHigh = !current.filterHigh
        else if (key.toLowerCase() === "z") next.filterFraction = clamp(current.filterFraction / 1.25, 0, 1)
        else if (key.toLowerCase() === "x") next.filterFraction = clamp(current.filterFraction * 1.25, 0, 1)
        else if (key.toLowerCase() === "j") next.velocityClip = !current.velocityClip
        else if (key.toLowerCase() === "a") next.velocityClipValue = clamp(current.velocityClipValue / 1.25, 0.02, 10)
        else if (key.toLowerCase() === "d") next.velocityClipValue = clamp(current.velocityClipValue * 1.25, 0.02, 10)
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
    <div className="h-screen overflow-hidden bg-[#070A0D] text-[#EFF7F1]">
      <main className="flex h-screen flex-col">
        <header className="flex min-h-14 flex-wrap items-center gap-3 border-b border-white/10 bg-[#0B1014] px-4 py-2 md:px-6">
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
              <span>grid125 MDN field</span>
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
          <section className="relative min-h-0 overflow-hidden bg-black">
            <canvas ref={canvasRef} className="block h-full min-h-0 w-full" />
            {!status.loaded && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/82">
                <div className="flex max-w-md flex-col items-center gap-4 border border-[#7AF7B1]/30 bg-[#081014]/88 px-8 py-7 text-center shadow-2xl backdrop-blur">
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#7AF7B1]/15 border-t-[#7AF7B1]" />
                    <Brain className="h-8 w-8 text-[#7AF7B1]" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">Loading MindVisualizer</div>
                    <div className="mt-1 text-sm text-white/65">{status.message}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute left-4 top-4 border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/70 backdrop-blur">
              {status.message}
            </div>
            {status.loaded && probeGuide.visible && (
              <div
                className={`pointer-events-none absolute left-1/2 top-4 max-w-[min(44rem,calc(100%-2rem))] -translate-x-1/2 border px-5 py-3 text-center shadow-xl backdrop-blur ${
                  probeGuide.tone === "warn"
                    ? "border-[#FFB86B]/55 bg-[#1C1006]/78"
                    : probeGuide.tone === "flow"
                      ? "border-[#7AF7B1]/45 bg-[#061710]/75"
                      : probeGuide.tone === "processing"
                        ? "border-[#88CCFF]/45 bg-[#06111C]/75"
                        : "border-[#FFE45E]/45 bg-black/65"
                }`}
              >
                <div
                  className={`text-base font-semibold md:text-lg ${
                    probeGuide.tone === "warn"
                      ? "text-[#FFB86B]"
                      : probeGuide.tone === "flow"
                        ? "text-[#7AF7B1]"
                        : probeGuide.tone === "processing"
                          ? "text-[#88CCFF]"
                          : "text-[#FFE45E]"
                  }`}
                >
                  {probeGuide.title}
                </div>
                <div className="mt-1 text-sm text-white/78">
                  {probeGuide.detail}
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute bottom-4 left-4 max-h-28 max-w-[min(34rem,calc(100%-2rem))] overflow-hidden border border-[#7AF7B1]/25 bg-black/45 px-3 py-2 text-xs leading-relaxed text-white/72 backdrop-blur">
              {analysis}
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
                  items={fieldModes}
                  labels={fieldLabels}
                  onChange={(value) => updateSetting("fieldMode", value)}
                />
              </ControlSection>

              <ControlSection title="Color">
                <Segmented
                  value={settings.colorMode}
                  items={["speed", "entropy"] as const}
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
                <SliderRow label="Opacity" min={0.02} max={1} step={0.01} value={settings.opacityScale} onChange={(value) => updateSetting("opacityScale", value)} />
                <SliderRow label="dt" min={0.05} max={4} step={0.01} value={settings.dt} onChange={(value) => updateSetting("dt", value)} />
                <SliderRow label="Point" min={1} max={8} step={0.1} value={settings.pointSize} onChange={(value) => updateSetting("pointSize", value)} />
              </ControlSection>

              <ControlSection title="Filters">
                <ToggleRow label="Speed filter" checked={settings.speedFilter} onChange={(value) => updateSetting("speedFilter", value)} />
                <ToggleRow label="High speeds" checked={settings.filterHigh} onChange={(value) => updateSetting("filterHigh", value)} />
                <SliderRow label="Fraction" min={0} max={1} step={0.01} value={settings.filterFraction} onChange={(value) => updateSetting("filterFraction", value)} />
                <ToggleRow label="Velocity clip" checked={settings.velocityClip} onChange={(value) => updateSetting("velocityClip", value)} />
                <SliderRow label="Clip" min={0.02} max={10} step={0.01} value={settings.velocityClipValue} onChange={(value) => updateSetting("velocityClipValue", value)} />
              </ControlSection>

              <ControlSection title="Probe">
                <div className="grid grid-cols-4 gap-2">
                  <IconButton label="Probe" active>
                    <Crosshair className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Move" active={settings.probeMoveMode} onClick={() => updateSetting("probeMoveMode", !settings.probeMoveMode)}>
                    <Gauge className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Start"
                    onClick={() => {
                      rendererRef.current?.startProbeFlow()
                    }}
                  >
                    <CirclePlay className="h-4 w-4" />
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
                <ToggleRow label="Cortex mesh" checked={settings.meshVisible} onChange={(value) => updateSetting("meshVisible", value)} />
                <SliderRow label="Mesh alpha" min={0.03} max={0.45} step={0.01} value={settings.meshOpacity} onChange={(value) => updateSetting("meshOpacity", value)} />
                <ToggleRow label="Bounds" checked={settings.boundsVisible} onChange={(value) => updateSetting("boundsVisible", value)} />
                <SliderRow label="Bounds alpha" min={0.04} max={0.8} step={0.01} value={settings.boundsOpacity} onChange={(value) => updateSetting("boundsOpacity", value)} />
                <div className="flex items-center gap-2 border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">
                  <Gauge className="h-4 w-4 shrink-0" />
                  <span>Click empty space to place probe. Drag the probe ball or colored gizmo to move it. Drag elsewhere rotates the view.</span>
                </div>
              </ControlSection>
            </div>
          </aside>
        </div>
      </main>
      {analysisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <section className="max-h-[78vh] w-full max-w-2xl overflow-auto border border-[#7AF7B1]/35 bg-[#0B1115] p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Probe Analysis</h2>
              <button
                type="button"
                onClick={() => setAnalysisOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center border border-white/15 bg-white/5 text-white hover:bg-white/10"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/78">{analysis}</p>
          </section>
        </div>
      )}
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
  regions: string[]
  lastRegion: string | null
  active: boolean
  pending?: boolean
}

type LabelGrid = {
  grid: Int16Array
  n: number
  origin: [number, number, number]
  spacing: [number, number, number]
  keys: string[]
}

type StructureInfo = {
  id: number
  name: string
  acronym?: string
  rgb_triplet?: [number, number, number]
}

type RegionMeshItem = {
  positions: string
  indices: string
  vertexCount: number
  indexCount: number
}

type MeshManifest = {
  defaultMesh: string
  meshes: Record<
    string,
    {
      name: string
      positions: string
      indices: string
      vertexCount: number
      indexCount: number
    }
  >
}

class MindVisRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private settings: MindVisSettings
  private setSettingsState: React.Dispatch<React.SetStateAction<MindVisSettings>>
  private setStatus: React.Dispatch<React.SetStateAction<ViewerStatus>>
  private setAnalysis: React.Dispatch<React.SetStateAction<string>>
  private setAnalysisOpen: React.Dispatch<React.SetStateAction<boolean>>
  private setProbeGuide: React.Dispatch<React.SetStateAction<ProbeGuide>>
  private meta: GridMeta | null = null
  private textures = new Map<FieldMode, WebGLTexture>()
  private fieldData = new Map<FieldMode, Uint16Array>()
  private entropyTexture: WebGLTexture | null = null
  private entropyData: Uint16Array | null = null
  private updateProgram: WebGLProgram | null = null
  private renderProgram: WebGLProgram | null = null
  private oosProgram: WebGLProgram | null = null
  private lineProgram: WebGLProgram | null = null
  private highlightProgram: WebGLProgram | null = null
  private meshProgram: WebGLProgram | null = null
  private particleBuffers: [WebGLBuffer | null, WebGLBuffer | null] = [null, null]
  private particleVaos: [WebGLVertexArrayObject | null, WebGLVertexArrayObject | null] = [null, null]
  private transformFeedback: WebGLTransformFeedback | null = null
  private useA = true
  private particleCount = 0
  private oosBuffer: WebGLBuffer | null = null
  private oosCount = 0
  private seedPoints: Float32Array | null = null
  private particleMask: Uint8Array | null = null
  private boxBuffer: WebGLBuffer | null = null
  private meshBuffer: WebGLBuffer | null = null
  private meshIndexBuffer: WebGLBuffer | null = null
  private meshIndexCount = 0
  private trailBuffer: WebGLBuffer | null = null
  private regionHighlightBuffer: WebGLBuffer | null = null
  private regionHighlightCount = 0
  private regionMeshManifest: Record<string, RegionMeshItem> = {}
  private regionMeshCache = new Map<string, { vertex: WebGLBuffer; index: WebGLBuffer; count: number }>()
  private activeRegionMesh: { vertex: WebGLBuffer; index: WebGLBuffer; count: number } | null = null
  private currentRegionKey: string | null = null
  private labelGrid: LabelGrid | null = null
  private regionNames = new Map<string, string>()
  private regionColors = new Map<string, [number, number, number]>()
  private animationFrame = 0
  private disposed = false
  private frames = 0
  private fpsT0 = performance.now()
  private fps = 0
  private analysisBusy = false
  private lastLiveLogAt = 0
  private azimuth = 0.72
  private elevation = 0.34
  private zoom = 2.15
  private pointer: {
    id: number
    x: number
    y: number
    drag: boolean
    mode: "camera" | "probe"
    axis?: number
    startClick?: [number, number]
    startPaths?: number[][][]
    axisScreenN?: [number, number]
    pxPerFieldUnit?: number
    axisSign?: number
  } | null = null
  private probes: Probe[] = []
  private probePlayback: {
    probe: Probe
    trajectory: number[][]
    transitions: Array<{ region_key?: string; region_name?: string }>
    regionText?: string
    index: number
    lastStep: number
  } | null = null

  private readonly strideFloats = 10
  private readonly strideBytes = 10 * 4
  private readonly displayScale: [number, number, number] = [1.55, 1.51, 2.0]

  constructor(
    canvas: HTMLCanvasElement,
    settings: MindVisSettings,
    setSettingsState: React.Dispatch<React.SetStateAction<MindVisSettings>>,
    setStatus: React.Dispatch<React.SetStateAction<ViewerStatus>>,
    setAnalysis: React.Dispatch<React.SetStateAction<string>>,
    setAnalysisOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setProbeGuide: React.Dispatch<React.SetStateAction<ProbeGuide>>,
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
    this.setSettingsState = setSettingsState
    this.setStatus = setStatus
    this.setAnalysis = setAnalysis
    this.setAnalysisOpen = setAnalysisOpen
    this.setProbeGuide = setProbeGuide
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
    const fieldRoot = `${root}/field/grid125`
    const meta = (await fetchJson(`${fieldRoot}/meta.json`)) as GridMeta
    this.meta = meta

    const [fieldBuffers, entropy, oos, labelGrid, structures] = await Promise.all([
      Promise.all(fieldModes.map((mode) => fetchBytes(`${fieldRoot}/field_${mode}.f16.bin`))),
      fetchBytes(`${fieldRoot}/field_entropy.f16.bin`),
      fetchBytes(`${fieldRoot}/oos_points.f16.bin`),
      this.loadLabelGrid(root),
      fetchJson(`${root}/structures.json`).catch(() => []),
    ])

    fieldModes.forEach((mode, index) => {
      this.fieldData.set(mode, new Uint16Array(fieldBuffers[index]))
      this.textures.set(mode, this.uploadFieldTexture(fieldBuffers[index], meta.grid, Boolean(linearFloat)))
    })
    this.entropyData = new Uint16Array(entropy)
    this.entropyTexture = this.uploadEntropyTexture(entropy, meta.grid, Boolean(linearFloat))
    this.uploadOos(oos)
    this.labelGrid = labelGrid
    this.loadStructures(structures as StructureInfo[])

    this.updateProgram = linkProgram(
      gl,
      updateVertexShader,
      emptyFragmentShader,
      ["v_pos", "v_age", "v_ttl", "v_seed", "v_entropyPrev", "v_entropyEma"],
    )
    this.renderProgram = linkProgram(gl, particleVertexShader, particleFragmentShader)
    this.oosProgram = linkProgram(gl, oosVertexShader, oosFragmentShader)
    this.lineProgram = linkProgram(gl, lineVertexShader, lineFragmentShader)
    this.highlightProgram = linkProgram(gl, highlightVertexShader, highlightFragmentShader)
    this.meshProgram = linkProgram(gl, meshVertexShader, meshFragmentShader)
    this.transformFeedback = gl.createTransformFeedback()
    this.boxBuffer = makeBuffer(gl, new Float32Array(makeBoxLines(this.displayScale)), gl.STATIC_DRAW)
    this.trailBuffer = gl.createBuffer()
    this.regionHighlightBuffer = gl.createBuffer()
    await this.loadMesh(root)
    await this.loadRegionMeshManifest(root)
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
    if (this.meshBuffer) this.gl.deleteBuffer(this.meshBuffer)
    if (this.meshIndexBuffer) this.gl.deleteBuffer(this.meshIndexBuffer)
    if (this.regionHighlightBuffer) this.gl.deleteBuffer(this.regionHighlightBuffer)
    for (const mesh of this.regionMeshCache.values()) {
      this.gl.deleteBuffer(mesh.vertex)
      this.gl.deleteBuffer(mesh.index)
    }
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
    this.probePlayback = null
    this.analysisBusy = false
    this.currentRegionKey = null
    this.regionHighlightCount = 0
    this.activeRegionMesh = null
    this.setAnalysis("Probe trajectory analysis will appear here.")
    this.setProbeGuide({ visible: false, title: "", detail: "", tone: "move" })
  }

  async explainProbe(options: { auto?: boolean } = {}) {
    if (!this.meta || this.probes.length === 0 || this.probes[0].path.length < 2) {
      this.setAnalysis("No complete probe path yet. Place the probe in the flow, press Enter, let it travel, then press Enter again.")
      this.setProbeGuide({
        visible: true,
        title: "Probe needs a path",
        detail: "Click deeper inside the visible flow, let the probe move for a moment, then stop it to analyze the traveled path.",
        tone: "warn",
      })
      return
    }

    const probe = this.probes[0]
    const quality = this.probePathQuality(probe)
    if (!quality.ok) {
      const message = `The probe barely moved (${probe.path.length} samples, ${quality.distance.toFixed(4)} field units). Place it deeper in the flow, make sure it draws a visible trail, then stop it again.`
      this.setAnalysis(message)
      this.setProbeGuide({
        visible: true,
        title: "Probe did not travel enough",
        detail: "Move the probe to a stronger stream inside the brain volume, press Enter to follow the flow, and stop after a visible path forms.",
        tone: "warn",
      })
      return
    }

    if (this.analysisBusy) return
    this.analysisBusy = true
    const api = backendUrl()
    if (api) {
      const logs = [
        `Preparing ${probe.path.length} probe samples (${quality.distance.toFixed(3)} field units traveled).`,
        "Sending trajectory to the Python backend.",
      ]
      this.setAnalysis(logs.join("\n"))
      this.setProbeGuide({
        visible: true,
        title: "Explanation is processing",
        detail: "The backend is identifying anatomical regions and asking the LLM for the path interpretation.",
        tone: "processing",
      })
      try {
        const text = await this.fetchExplanation(api, probe, logs)
        this.setAnalysis(text)
        this.setAnalysisOpen(true)
        this.setProbeGuide({
          visible: true,
          title: "Analysis ready",
          detail: "The probe path has been interpreted. Move the probe again or press Enter to collect a new path.",
          tone: "move",
        })
        this.analysisBusy = false
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
    const transitions = uniqueConsecutive(probe.regions).map((key) => this.regionLabel(key))

    this.setAnalysis(
      `Probe path ${probe.path.length} samples, ${distance.toFixed(3)} field units. ${
        transitions.length ? `Region path: ${transitions.join(" -> ")}. ` : ""
      }Dominant drift is ${parts.join(
        " / ",
      )}; entropy/color response is taken from the shipped grid125 MDN snapshot.`,
    )
    this.setAnalysisOpen(true)
    if (options.auto) {
      this.setProbeGuide({
        visible: true,
        title: "Local path summary ready",
        detail: "The hosted backend was not available, so this uses the browser-side region and direction summary.",
        tone: "warn",
      })
    }
    this.analysisBusy = false
  }

  private async fetchExplanation(api: string, probe: Probe, logs: string[]) {
    const body = JSON.stringify({
      fieldMode: this.settings.fieldMode,
      trajectory: probe.path,
    })
    const streamed = await fetch(`${api}/api/mindvis/explain/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => null)

    if (streamed?.ok && streamed.body) {
      const reader = streamed.body.getReader()
      const decoder = new TextDecoder()
      let pending = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        pending += decoder.decode(value, { stream: true })
        const lines = pending.split("\n")
        pending = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as { type?: string; message?: string; text?: string; summary?: string }
          if (event.type === "log" && event.message) {
            logs.push(`backend: ${event.message}`)
            this.setAnalysis(logs.join("\n"))
          } else if (event.type === "result") {
            return event.text ?? event.summary ?? "Backend returned no explanation text."
          } else if (event.type === "error") {
            throw new Error(event.message ?? "backend stream failed")
          }
        }
      }
    }

    const response = await fetch(`${api}/api/mindvis/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
    if (!response.ok) throw new Error(`backend returned ${response.status}`)
    const data = (await response.json()) as { text?: string; summary?: string }
    return data.text ?? data.summary ?? "Backend returned no explanation text."
  }

  startProbeFlow() {
    const probe = this.probes[0]
    if (!probe || !this.meta || probe.path.length === 0) {
      this.setAnalysis("Click to place the probe first, then press Enter or Start.")
      this.setProbeGuide({
        visible: true,
        title: "Place the probe first",
        detail: "Click inside the visible brain flow. The move gizmo will appear immediately, then Enter starts the probe following the field.",
        tone: "warn",
      })
      return
    }
    if (probe.active) {
      this.stopLiveProbe(probe, `Probe stopped after ${probe.path.length} samples. Checking whether the path is long enough to explain.`, true)
      return
    }
    if (!this.fieldData.get(this.settings.fieldMode)) {
      this.setAnalysis("This field is still loading; try Start again in a moment.")
      return
    }
    this.probePlayback = null
    probe.pending = false
    probe.active = true
    this.settings = { ...this.settings, probeMoveMode: false }
    this.setSettingsState((current) => ({ ...current, probeMoveMode: false }))
    this.lastLiveLogAt = 0
    this.setAnalysis("Probe is following the live MDN field.\nPress Enter to stop; the traveled path will be analyzed automatically.")
    this.setProbeGuide({
      visible: true,
      title: "Probe is following the flow",
      detail: "Watch the yellow trail grow. Press Enter to stop the probe and automatically analyze the path it traveled.",
      tone: "flow",
    })
  }

  private stopLiveProbe(probe: Probe, message?: string, autoExplain = false) {
    probe.active = false
    probe.pending = false
    if (message) this.setAnalysis(message)
    this.setProbeGuide({
      visible: true,
      title: "Probe stopped",
      detail: "Checking the path length and region coverage before starting the explanation.",
      tone: "processing",
    })
    if (autoExplain && probe.slot === this.probes[0]?.slot) void this.explainProbe({ auto: true })
  }

  private probePathQuality(probe: Probe) {
    if (!this.meta || probe.path.length < 2) return { ok: false, distance: 0 }
    let distance = 0
    for (let i = 1; i < probe.path.length; i += 1) {
      const a = probe.path[i - 1]
      const b = probe.path[i]
      distance += Math.hypot(
        (b[0] - a[0]) * this.meta.span[0],
        (b[1] - a[1]) * this.meta.span[1],
        (b[2] - a[2]) * this.meta.span[2],
      )
    }
    return { ok: probe.path.length >= 12 && distance >= 0.015, distance }
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
    let axisPick: ReturnType<MindVisRenderer["pickProbeAxis"]> = null
    if (this.probes.length > 0 && !this.probePlayback && !this.probes.some((probe) => probe.active || probe.pending)) {
      axisPick = this.pickProbeAxis(event.clientX, event.clientY)
    }
    if (axisPick) {
      this.settings = { ...this.settings, probeMoveMode: true }
      this.setSettingsState((current) => ({ ...current, probeMoveMode: true }))
    }
    this.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      drag: false,
      mode: axisPick ? "probe" : "camera",
      axis: axisPick?.axis,
      startClick: axisPick ? [event.clientX, event.clientY] : undefined,
      startPaths: axisPick ? this.probes.map((probe) => probe.path.map((point) => [...point])) : undefined,
      axisScreenN: axisPick?.axisScreenN,
      pxPerFieldUnit: axisPick?.pxPerFieldUnit,
      axisSign: axisPick?.axisSign,
    }
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return
    const dx = event.clientX - this.pointer.x
    const dy = event.clientY - this.pointer.y
    if (Math.hypot(dx, dy) > 3) this.pointer.drag = true
    if (this.pointer.drag) {
      if (this.pointer.mode === "probe") {
        this.moveProbeAlongPickedAxis(event.clientX, event.clientY)
      } else {
        this.azimuth += dx * 0.006
        this.elevation = clamp(this.elevation + dy * 0.004, -1.1, 1.1)
      }
      this.pointer.x = event.clientX
      this.pointer.y = event.clientY
    }
  }

  private onPointerUp(event: PointerEvent) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return
    const wasDrag = this.pointer.drag
    const mode = this.pointer.mode
    this.pointer = null
    if (mode === "probe") {
      if (wasDrag) {
        this.setAnalysis("Probe moved. Press Enter or Start to follow the live flow.")
        this.setProbeGuide({
          visible: true,
          title: "Move mode is on",
          detail: "Keep adjusting with the colored gizmo or click a new spot in the flow. Press Enter when you want the probe to be dragged by the field.",
          tone: "move",
        })
      } else {
        this.settings = { ...this.settings, probeMoveMode: true }
        this.setSettingsState((current) => ({ ...current, probeMoveMode: true }))
        this.setAnalysis("Probe gizmo active. Drag a colored axis with a broad margin, or click another point to place the probe there.")
        this.setProbeGuide({
          visible: true,
          title: "Move mode is on",
          detail: "Drag a colored gizmo axis to refine the probe position. You can also click somewhere else in the flow, then press Enter to start.",
          tone: "move",
        })
      }
    } else if (!wasDrag) {
      this.placeProbe(event.clientX, event.clientY, false)
    }
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault()
    this.zoom = clamp(this.zoom + event.deltaY * 0.0014, 1.15, 4.2)
  }

  private placeProbe(clientX: number, clientY: number, quiet: boolean) {
    const picked = this.screenToFieldPosition(clientX, clientY)
    if (!picked) {
      if (!quiet) this.setAnalysis("Click inside the brain volume to place a probe.")
      return
    }

    const count = this.settings.probeCount
    const offsets = makeProbeOffsets(count)
    this.probes = []
    this.probePlayback = null

    offsets.forEach((offset, index) => {
      const pos = [
        clamp(picked[0] + offset[0], 0.01, 0.99),
        clamp(picked[1] + offset[1], 0.01, 0.99),
        clamp(picked[2] + offset[2], 0.01, 0.99),
      ]
      const region = this.lookupRegion(pos)
      this.probes.push({
        slot: index,
        path: [pos],
        regions: region ? [region.key] : [],
        lastRegion: region?.key ?? null,
        active: false,
      })
    })
    this.setCurrentRegion(this.probes[0]?.lastRegion ?? null)

    const world = this.meta
      ? picked.map((value, axis) => this.meta!.axisMin[axis] + value * this.meta!.span[axis])
      : picked
    if (!quiet) {
      this.settings = { ...this.settings, probeMoveMode: true }
      this.setSettingsState((current) => ({ ...current, probeMoveMode: true }))
      this.setAnalysis(
        `${count} probe${count === 1 ? "" : "s"} placed at ${world.map((value) => value.toFixed(3)).join(", ")}${
          this.currentRegionKey ? ` in ${this.regionLabel(this.currentRegionKey)}` : ""
        }.\nMove mode is on: drag the gizmo to adjust it or click another flow point. Press Enter to let the field drag the probe.`,
      )
      this.setProbeGuide({
        visible: true,
        title: "Move mode is on",
        detail: "Set the probe anywhere in the flow with the gizmo or by clicking. When it is where you want it, press Enter to start dragging it along the MDN field.",
        tone: "move",
      })
    }
  }

  private moveProbeAlongPickedAxis(clientX: number, clientY: number) {
    const pointer = this.pointer
    if (
      !pointer ||
      pointer.mode !== "probe" ||
      pointer.axis === undefined ||
      !pointer.startClick ||
      !pointer.startPaths ||
      !pointer.axisScreenN ||
      !pointer.pxPerFieldUnit ||
      !pointer.axisSign
    ) {
      return
    }

    const mouseDelta: [number, number] = [clientX - pointer.startClick[0], clientY - pointer.startClick[1]]
    const alongPx = mouseDelta[0] * pointer.axisScreenN[0] + mouseDelta[1] * pointer.axisScreenN[1]
    const fieldDelta = (alongPx / pointer.pxPerFieldUnit) * pointer.axisSign

    for (let i = 0; i < this.probes.length; i += 1) {
      const probe = this.probes[i]
      const start = pointer.startPaths[i]?.[pointer.startPaths[i].length - 1]
      if (!start) continue
      const next = [...start]
      next[pointer.axis] = clamp(start[pointer.axis] + fieldDelta, 0.01, 0.99)
      probe.path = [next]
      const region = this.lookupRegion(next)
      probe.regions = region ? [region.key] : []
      probe.lastRegion = region?.key ?? null
      probe.active = false
      probe.pending = false
    }
    this.probePlayback = null
    this.setCurrentRegion(this.probes[0]?.lastRegion ?? null)
  }

  private hitProbeMarker(clientX: number, clientY: number) {
    return Boolean(this.pickProbeAxis(clientX, clientY))
  }

  private pickProbeAxis(clientX: number, clientY: number) {
    if (!this.probes.length) return null
    const rect = this.canvas.getBoundingClientRect()
    const mvp = this.mvp()
    const axisHitRadius = 150
    const ballHitRadius = 72
    const probe = this.probes[0]
    const point = probe.path[probe.path.length - 1]
    if (!point) return null
    const center = this.projectFieldToScreen(point, mvp, rect)
    if (!center) return null
    const click: [number, number] = [clientX, clientY]
    const ballDist = Math.hypot(center[0] - clientX, center[1] - clientY)
    if (!this.settings.probeMoveMode && ballDist > ballHitRadius) return null

    let best:
      | {
          axis: number
          distance: number
          axisScreenN: [number, number]
          pxPerFieldUnit: number
          axisSign: number
        }
      | null = null

    for (let axis = 0; axis < 3; axis += 1) {
      const sign = point[axis] < 0.82 ? 1 : -1
      const delta = 0.1 * sign
      const tip = [...point]
      tip[axis] = clamp(tip[axis] + delta, 0.01, 0.99)
      const tipScreen = this.projectFieldToScreen(tip, mvp, rect)
      if (!tipScreen) continue
      const axisVec: [number, number] = [tipScreen[0] - center[0], tipScreen[1] - center[1]]
      const axisPixels = Math.hypot(axisVec[0], axisVec[1])
      if (axisPixels < 1e-3) continue
      const dist = distanceToSegment(click, center, tipScreen)
      if (!best || dist < best.distance) {
        best = {
          axis,
          distance: dist,
          axisScreenN: [axisVec[0] / axisPixels, axisVec[1] / axisPixels],
          pxPerFieldUnit: axisPixels / Math.abs(tip[axis] - point[axis]),
          axisSign: sign,
        }
      }
    }
    if (!best) return null
    if (ballDist <= ballHitRadius || best.distance <= axisHitRadius) return best
    return null
  }

  private projectFieldToScreen(point: number[], mvp: Float32Array, rect: DOMRect): [number, number] | null {
    return this.projectSceneToScreen(this.fieldToScene(point), mvp, rect)
  }

  private projectSceneToScreen(point: number[], mvp: Float32Array, rect: DOMRect): [number, number] | null {
    const x = point[0]
    const y = point[1]
    const z = point[2]
    const w = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15]
    if (Math.abs(w) < 1e-6) return null
    const clipX = (mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12]) / w
    const clipY = (mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13]) / w
    if (clipX < -1.2 || clipX > 1.2 || clipY < -1.2 || clipY > 1.2) return null
    return [rect.left + ((clipX + 1) * 0.5) * rect.width, rect.top + ((1 - clipY) * 0.5) * rect.height]
  }

  private probeGizmoRadius() {
    return 0.13
  }

  private screenToFieldPosition(clientX: number, clientY: number): [number, number, number] | null {
    const rect = this.canvas.getBoundingClientRect()
    const ndcX = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1
    const ndcY = 1 - ((clientY - rect.top) / Math.max(rect.height, 1)) * 2
    const aspect = this.canvas.width / Math.max(this.canvas.height, 1)
    const tan = Math.tan(Math.PI / 6)
    const eye = this.cameraEye()
    const backward = vec3Normalize(eye)
    const forward = vec3Scale(backward, -1)
    const right = vec3Normalize(vec3Cross([0, 1, 0], backward))
    const up = vec3Normalize(vec3Cross(backward, right))
    const dir = vec3Normalize(
      vec3Add(vec3Add(forward, vec3Scale(right, ndcX * tan * aspect)), vec3Scale(up, ndcY * tan)),
    )
    const half: [number, number, number] = [
      this.displayScale[0] * 0.5,
      this.displayScale[1] * 0.5,
      this.displayScale[2] * 0.5,
    ]
    const range = intersectBoxRange(eye, dir, [-half[0], -half[1], -half[2]], [half[0], half[1], half[2]])
    if (!range) return null
    const [t0, t1] = range
    const start = t0 + (t1 - t0) * 0.14
    const end = t0 + (t1 - t0) * 0.86
    for (let i = 0; i <= 48; i += 1) {
      const t = start + (end - start) * (i / 48)
      const field = this.sceneToField([eye[0] + dir[0] * t, eye[1] + dir[1] * t, eye[2] + dir[2] * t])
      if (this.lookupRegion(field)) return field
    }
    const fallbackT = t0 + (t1 - t0) * 0.38
    return this.sceneToField([
      eye[0] + dir[0] * fallbackT,
      eye[1] + dir[1] * fallbackT,
      eye[2] + dir[2] * fallbackT,
    ])
  }

  private fieldToScene(point: number[]): [number, number, number] {
    return [
      (point[0] - 0.5) * this.displayScale[0],
      (point[2] - 0.5) * this.displayScale[1],
      (point[1] - 0.5) * this.displayScale[2],
    ]
  }

  private sceneToField(point: number[]): [number, number, number] {
    return [
      clamp(point[0] / this.displayScale[0] + 0.5, 0.01, 0.99),
      clamp(point[2] / this.displayScale[2] + 0.5, 0.01, 0.99),
      clamp(point[1] / this.displayScale[1] + 0.5, 0.01, 0.99),
    ]
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
    if (this.meta) {
      this.seedPoints = decodeF16WorldPoints(buffer, this.meta)
      this.buildParticleMask()
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.oosBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(buffer), gl.STATIC_DRAW)
  }

  private buildParticleMask() {
    if (!this.seedPoints) return
    const n = 32
    const mask = new Uint8Array(n * n * n)
    const radius = 3
    for (let i = 0; i < this.seedPoints.length; i += 3) {
      const cx = clamp(Math.floor(this.seedPoints[i] * n), 0, n - 1)
      const cy = clamp(Math.floor(this.seedPoints[i + 1] * n), 0, n - 1)
      const cz = clamp(Math.floor(this.seedPoints[i + 2] * n), 0, n - 1)
      for (let dx = -radius; dx <= radius; dx += 1) {
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dz = -radius; dz <= radius; dz += 1) {
            const x = cx + dx
            const y = cy + dy
            const z = cz + dz
            if (x < 0 || y < 0 || z < 0 || x >= n || y >= n || z >= n) continue
            mask[(x * n + y) * n + z] = 1
          }
        }
      }
    }
    this.particleMask = mask
  }

  private isInsideParticleCloud(pos: number[]) {
    if (!this.particleMask) return true
    const n = 32
    const x = Math.floor(pos[0] * n)
    const y = Math.floor(pos[1] * n)
    const z = Math.floor(pos[2] * n)
    if (x < 0 || y < 0 || z < 0 || x >= n || y >= n || z >= n) return false
    return this.particleMask[(x * n + y) * n + z] > 0
  }

  private async loadLabelGrid(root: string): Promise<LabelGrid | null> {
    try {
      const meta = (await fetchJson(`${root}/label_grid/meta.json`)) as {
        shape: [number, number, number]
        origin: [number, number, number]
        spacing: [number, number, number]
        keys: string[]
      }
      const bytes = await fetchBytes(`${root}/label_grid/grid.i16.bin`)
      return {
        grid: new Int16Array(bytes),
        n: meta.shape[0],
        origin: meta.origin,
        spacing: meta.spacing,
        keys: meta.keys,
      }
    } catch (error) {
      console.warn("MindVisualizer label grid unavailable", error)
      return null
    }
  }

  private loadStructures(items: StructureInfo[]) {
    for (const item of items) {
      const key = String(item.id)
      const suffix = item.acronym && item.acronym !== "root" ? ` (${item.acronym})` : ""
      this.regionNames.set(key, `${item.name}${suffix}`)
      if (item.rgb_triplet) {
        this.regionColors.set(key, [
          item.rgb_triplet[0] / 255,
          item.rgb_triplet[1] / 255,
          item.rgb_triplet[2] / 255,
        ])
      }
    }
  }

  private lookupRegion(pos: number[]) {
    if (!this.meta || !this.labelGrid) return null
    const grid = this.labelGrid
    const world = [
      this.meta.axisMin[0] + pos[0] * this.meta.span[0],
      this.meta.axisMin[1] + pos[1] * this.meta.span[1],
      this.meta.axisMin[2] + pos[2] * this.meta.span[2],
    ]
    const ix = Math.floor((world[0] - grid.origin[0]) / grid.spacing[0])
    const iy = Math.floor((world[1] - grid.origin[1]) / grid.spacing[1])
    const iz = Math.floor((world[2] - grid.origin[2]) / grid.spacing[2])
    if (ix < 0 || iy < 0 || iz < 0 || ix >= grid.n || iy >= grid.n || iz >= grid.n) return null
    const value = grid.grid[(ix * grid.n + iy) * grid.n + iz]
    if (value <= 0) return null
    const key = grid.keys[value]
    return key ? { key, world } : null
  }

  private setCurrentRegion(key: string | null) {
    if (this.currentRegionKey === key) return
    this.currentRegionKey = key
    this.activeRegionMesh = key ? this.regionMeshCache.get(key) ?? null : null
    if (key && !this.activeRegionMesh) void this.loadRegionMesh(key)
    this.rebuildRegionHighlight(key)
  }

  private regionLabel(key: string) {
    return this.regionNames.get(key) ?? `region ${key}`
  }

  private rebuildRegionHighlight(key: string | null) {
    this.regionHighlightCount = 0
    if (!key || !this.labelGrid || !this.meta || !this.regionHighlightBuffer) return
    const keyIndex = this.labelGrid.keys.indexOf(key)
    if (keyIndex <= 0) return

    const points: number[] = []
    const n = this.labelGrid.n
    const stride = 2
    for (let ix = 0; ix < n; ix += stride) {
      for (let iy = 0; iy < n; iy += stride) {
        for (let iz = 0; iz < n; iz += stride) {
          if (this.labelGrid.grid[(ix * n + iy) * n + iz] !== keyIndex) continue
          const world = [
            this.labelGrid.origin[0] + (ix + 0.5) * this.labelGrid.spacing[0],
            this.labelGrid.origin[1] + (iy + 0.5) * this.labelGrid.spacing[1],
            this.labelGrid.origin[2] + (iz + 0.5) * this.labelGrid.spacing[2],
          ]
          const field = [
            (world[0] - this.meta.axisMin[0]) / this.meta.span[0],
            (world[1] - this.meta.axisMin[1]) / this.meta.span[1],
            (world[2] - this.meta.axisMin[2]) / this.meta.span[2],
          ]
          points.push(...this.fieldToScene(field))
        }
      }
    }

    this.regionHighlightCount = points.length / 3
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.regionHighlightBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(points), this.gl.DYNAMIC_DRAW)
  }

  private async loadMesh(root: string) {
    try {
      const manifest = (await fetchJson(`${root}/meshes/manifest.json`)) as MeshManifest
      const item = manifest.meshes[manifest.defaultMesh]
      if (!item) return

      const [positions, indices] = await Promise.all([
        fetchBytes(`${root}/meshes/${item.positions}`),
        fetchBytes(`${root}/meshes/${item.indices}`),
      ])

      this.meshBuffer = makeBuffer(this.gl, new Float32Array(positions), this.gl.STATIC_DRAW)
      this.meshIndexBuffer = this.gl.createBuffer()
      if (!this.meshIndexBuffer) return
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.meshIndexBuffer)
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW)
      this.meshIndexCount = item.indexCount
    } catch (error) {
      console.warn("MindVisualizer mesh overlay unavailable", error)
    }
  }

  private async loadRegionMeshManifest(root: string) {
    try {
      const manifest = (await fetchJson(`${root}/region_meshes/manifest.json`)) as { meshes: Record<string, RegionMeshItem> }
      this.regionMeshManifest = manifest.meshes ?? {}
    } catch (error) {
      console.warn("MindVisualizer region mesh manifest unavailable", error)
    }
  }

  private async loadRegionMesh(key: string) {
    if (this.regionMeshCache.has(key)) {
      this.activeRegionMesh = this.regionMeshCache.get(key) ?? null
      return
    }
    const item = this.regionMeshManifest[key]
    if (!item) return
    try {
      const root = `${basePath()}/data/mindvis/region_meshes`
      const [positions, indices] = await Promise.all([fetchBytes(`${root}/${item.positions}`), fetchBytes(`${root}/${item.indices}`)])
      if (this.disposed) return
      const vertex = makeBuffer(this.gl, new Float32Array(positions), this.gl.STATIC_DRAW)
      const index = this.gl.createBuffer()
      if (!index) return
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, index)
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW)
      const mesh = { vertex, index, count: item.indexCount }
      this.regionMeshCache.set(key, mesh)
      if (this.currentRegionKey === key) this.activeRegionMesh = mesh
    } catch (error) {
      console.warn(`MindVisualizer region mesh unavailable for ${key}`, error)
    }
  }

  private setParticleCount(count: number) {
    const gl = this.gl
    this.particleCount = count
    for (const vao of this.particleVaos) if (vao) gl.deleteVertexArray(vao)
    for (const buffer of this.particleBuffers) if (buffer) gl.deleteBuffer(buffer)

    const data = new Float32Array(count * this.strideFloats)
    for (let i = 0; i < count; i += 1) {
      const seed = this.sampleSeedPoint()
      const offset = i * this.strideFloats
      data[offset] = seed[0]
      data[offset + 1] = seed[1]
      data[offset + 2] = seed[2]
      const ttl = 30 + Math.floor(Math.random() * 31)
      data[offset + 3] = Math.random() * ttl
      data[offset + 4] = ttl
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

  private sampleSeedPoint() {
    if (!this.seedPoints || this.seedPoints.length < 3) return randomPointInSphere()
    const index = Math.floor(Math.random() * (this.seedPoints.length / 3)) * 3
    return [
      clamp(this.seedPoints[index] + gaussian01() * 0.004, 0.001, 0.999),
      clamp(this.seedPoints[index + 1] + gaussian01() * 0.004, 0.001, 0.999),
      clamp(this.seedPoints[index + 2] + gaussian01() * 0.004, 0.001, 0.999),
    ]
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
    this.advanceProbePlayback()
    this.advanceLiveProbes()
    this.render()
    if (!this.settings.paused && !document.hidden) this.updateParticles()
    this.updateFps()
    this.animationFrame = requestAnimationFrame(() => this.frame())
  }

  private advanceProbePlayback() {
    const playback = this.probePlayback
    if (!playback || this.settings.paused) return
    const now = performance.now()
    const elapsed = Math.max(16, now - playback.lastStep)
    const samples = Math.max(1, Math.floor(elapsed / 16) * 4)
    playback.lastStep = now
    for (let i = 0; i < samples && playback.index < playback.trajectory.length; i += 1) {
      const next = playback.trajectory[playback.index]
      playback.probe.path.push(next)
      if (playback.probe.path.length > 900) playback.probe.path.shift()
      const region = this.lookupRegion(next)
      if (region && region.key !== playback.probe.lastRegion) {
        playback.probe.lastRegion = region.key
        playback.probe.regions.push(region.key)
        this.setCurrentRegion(region.key)
      }
      playback.index += 1
    }
    if (playback.index >= playback.trajectory.length) {
      playback.probe.pending = false
      playback.probe.active = false
      playback.probe.regions = playback.transitions.map((item) => String(item.region_key ?? "")).filter(Boolean)
      playback.probe.lastRegion = playback.probe.regions[playback.probe.regions.length - 1] ?? playback.probe.lastRegion
      this.setCurrentRegion(playback.probe.lastRegion)
      this.setAnalysis(playback.regionText ?? `Python backend returned ${playback.trajectory.length} probe samples.`)
      this.probePlayback = null
    }
  }

  private advanceLiveProbes() {
    if (this.settings.paused || !this.meta || !this.probes.some((probe) => probe.active)) return
    const stepScale = this.settings.dt * this.settings.speedScale * this.stepNorm()
    for (const probe of this.probes) {
      if (!probe.active) continue
      const last = probe.path[probe.path.length - 1]
      if (!last) {
        this.stopLiveProbe(probe, undefined, probe.slot === this.probes[0]?.slot)
        continue
      }
      const vector = this.sampleFieldVector(last)
      if (!vector) {
        this.stopLiveProbe(probe, "Probe stopped because the selected field sample is unavailable.", probe.slot === this.probes[0]?.slot)
        continue
      }
      if (this.settings.velocityClip) {
        const len = Math.hypot(vector[0], vector[1], vector[2])
        const limit = Math.max(this.settings.velocityClipValue, 1e-6)
        if (len > limit) {
          const scale = limit / Math.max(len, 1e-6)
          vector[0] *= scale
          vector[1] *= scale
          vector[2] *= scale
        }
      }

      const step = [
        (vector[0] / Math.max(this.meta.span[0], 0.0001)) * stepScale,
        (vector[1] / Math.max(this.meta.span[1], 0.0001)) * stepScale,
        (vector[2] / Math.max(this.meta.span[2], 0.0001)) * stepScale,
      ]
      if (Math.hypot(step[0], step[1], step[2]) < 0.000012) {
        this.stopLiveProbe(probe, `Probe stopped after ${probe.path.length} samples because the local flow became too weak.`, probe.slot === this.probes[0]?.slot)
        continue
      }

      let next = [last[0] + step[0], last[1] + step[1], last[2] + step[2]]
      if (!insideUnitCube(next) || !this.isInsideParticleCloud(next)) {
        const half = [last[0] + step[0] * 0.5, last[1] + step[1] * 0.5, last[2] + step[2] * 0.5]
        if (!insideUnitCube(half) || !this.isInsideParticleCloud(half)) {
          this.stopLiveProbe(probe, `Probe stopped after ${probe.path.length} samples at the edge of the particle flow.`, probe.slot === this.probes[0]?.slot)
          continue
        }
        next = half
      }

      probe.path.push(next)
      if (probe.path.length > 1600) probe.path.shift()
      const region = this.lookupRegion(next)
      if (region && region.key !== probe.lastRegion) {
        probe.lastRegion = region.key
        probe.regions.push(region.key)
        if (probe.regions.length > 120) probe.regions.shift()
        if (probe.slot === this.probes[0]?.slot) {
          this.setCurrentRegion(region.key)
          this.setAnalysis(`Probe entered ${this.regionLabel(region.key)}.\nPress Enter to stop; explanation starts automatically if the path is long enough.`)
        }
      } else if (probe.slot === this.probes[0]?.slot && region) {
        this.setCurrentRegion(region.key)
      }
      if (probe.slot === this.probes[0]?.slot) this.updateLiveProbeLog(probe, next, vector, region)
    }
  }

  private updateLiveProbeLog(
    probe: Probe,
    pos: number[],
    vector: [number, number, number],
    region: { key: string; world: number[] } | null,
  ) {
    const now = performance.now()
    if (now - this.lastLiveLogAt < 450) return
    this.lastLiveLogAt = now
    const world = this.meta
      ? [
          this.meta.axisMin[0] + pos[0] * this.meta.span[0],
          this.meta.axisMin[1] + pos[1] * this.meta.span[1],
          this.meta.axisMin[2] + pos[2] * this.meta.span[2],
        ]
      : pos
    const speed = Math.hypot(vector[0], vector[1], vector[2])
    const entropy = this.sampleEntropy(pos)
    const quality = this.probePathQuality(probe)
    const regionName = region ? this.regionLabel(region.key) : "unlabeled flow / near boundary"
    this.setAnalysis(
      [
        `Probe following field | samples ${probe.path.length} | traveled ${quality.distance.toFixed(3)} field units`,
        `Current region: ${regionName}`,
        `World position: ${world.map((value) => value.toFixed(2)).join(", ")}`,
        `Flow vector: ${vector.map((value) => value.toFixed(4)).join(", ")} | strength ${speed.toFixed(4)}`,
        `Model entropy: ${entropy === null ? "unavailable" : entropy.toFixed(3)} | field ${fieldLabels[this.settings.fieldMode]} | dt ${this.settings.dt.toFixed(2)}`,
        "Press Enter to stop and analyze the path automatically.",
      ].join("\n"),
    )
  }

  private sampleFieldVector(pos: number[]): [number, number, number] | null {
    if (!this.meta) return null
    const data = this.fieldData.get(this.settings.fieldMode) ?? this.fieldData.get("mean")
    if (!data) return null
    return sampleVectorFieldF16(data, this.meta.grid, [pos[2], pos[1], pos[0]])
  }

  private sampleEntropy(pos: number[]) {
    if (!this.meta || !this.entropyData) return null
    return sampleScalarFieldF16(this.entropyData, this.meta.grid, [pos[2], pos[1], pos[0]])
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
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, "u_stepNorm"), this.stepNorm())
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, "u_stepSpeedMax"), Math.max(this.meta.speedMax, 1e-6))
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

  private render() {
    if (!this.renderProgram || !this.oosProgram || !this.lineProgram || !this.meta || !this.entropyTexture) return
    const gl = this.gl
    const mvp = this.mvp()
    gl.clearColor(0.005, 0.008, 0.012, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)

    if (this.settings.boundsVisible) this.drawBounds(mvp)
    if (this.settings.meshVisible) this.drawMesh(mvp)
    if (this.settings.oosVisible) this.drawOos(mvp)
    this.drawParticles(mvp)
    this.drawActiveRegionMesh(mvp)
    this.drawRegionHighlight(mvp)
    this.drawTrails(mvp)
    this.drawProbeGizmo(mvp)
    this.drawProbeMarkers(mvp)
  }

  private stepNorm() {
    if (!this.meta) return 1
    const diag = Math.hypot(this.meta.span[0], this.meta.span[1], this.meta.span[2])
    return (0.01 * diag) / Math.max(this.meta.speedMax, 1e-6)
  }

  private drawMesh(mvp: Float32Array) {
    if (!this.meshProgram || !this.meshBuffer || !this.meshIndexBuffer || this.meshIndexCount <= 0) return
    const gl = this.gl
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(this.meshProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.meshProgram, "u_mvp"), false, mvp)
    gl.uniform3fv(gl.getUniformLocation(this.meshProgram, "u_displayScale"), this.displayScale)
    gl.uniform4f(gl.getUniformLocation(this.meshProgram, "u_color"), 0.82, 0.96, 1.0, this.settings.meshOpacity)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.meshBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.meshIndexBuffer)
    gl.drawElements(gl.TRIANGLES, this.meshIndexCount, gl.UNSIGNED_INT, 0)
  }

  private drawActiveRegionMesh(mvp: Float32Array) {
    if (!this.meshProgram || !this.activeRegionMesh || !this.currentRegionKey) return
    const gl = this.gl
    const color = this.regionColors.get(this.currentRegionKey) ?? [1, 0.86, 0.25]
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(this.meshProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.meshProgram, "u_mvp"), false, mvp)
    gl.uniform3fv(gl.getUniformLocation(this.meshProgram, "u_displayScale"), this.displayScale)
    gl.uniform4f(gl.getUniformLocation(this.meshProgram, "u_color"), color[0], color[1], color[2], 0.42)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.activeRegionMesh.vertex)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.activeRegionMesh.index)
    gl.drawElements(gl.TRIANGLES, this.activeRegionMesh.count, gl.UNSIGNED_INT, 0)
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

  private drawRegionHighlight(mvp: Float32Array) {
    if (!this.highlightProgram || !this.regionHighlightBuffer || !this.currentRegionKey || this.regionHighlightCount <= 0) return
    if (this.activeRegionMesh) return
    const gl = this.gl
    const color = this.regionColors.get(this.currentRegionKey) ?? [1, 0.86, 0.25]
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.useProgram(this.highlightProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.highlightProgram, "u_mvp"), false, mvp)
    gl.uniform1f(gl.getUniformLocation(this.highlightProgram, "u_pointSize"), 4.5)
    gl.uniform4f(gl.getUniformLocation(this.highlightProgram, "u_color"), color[0], color[1], color[2], 0.58)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.regionHighlightBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.POINTS, 0, this.regionHighlightCount)
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
        const p = this.fieldToScene(probe.path[j])
        points[j * 3] = p[0]
        points[j * 3 + 1] = p[1]
        points[j * 3 + 2] = p[2]
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
    const eye = this.cameraEye()
    mat4LookAt(view, eye, [0, 0, 0], [0, 1, 0])
    mat4Multiply(mvp, proj, view)
    return mvp
  }

  private drawProbeMarkers(mvp: Float32Array) {
    if (!this.highlightProgram || !this.trailBuffer || !this.probes.length) return
    const points: number[] = []
    for (const probe of this.probes) {
      const p = probe.path[probe.path.length - 1]
      if (p) points.push(...this.fieldToScene(p))
    }
    if (!points.length) return
    const gl = this.gl
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.useProgram(this.highlightProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.highlightProgram, "u_mvp"), false, mvp)
    gl.uniform1f(gl.getUniformLocation(this.highlightProgram, "u_pointSize"), 18)
    gl.uniform4f(gl.getUniformLocation(this.highlightProgram, "u_color"), 1, 0.92, 0.16, 1)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.POINTS, 0, points.length / 3)
  }

  private drawProbeGizmo(mvp: Float32Array) {
    if (!this.lineProgram || !this.trailBuffer || !this.probes.length) return
    if (this.probePlayback || this.probes.some((probe) => probe.pending || probe.active)) return
    if (!this.settings.probeMoveMode && this.pointer?.mode !== "probe") return
    const gl = this.gl
    const r = this.probeGizmoRadius()
    const axes = [
      { offset: [r, 0, 0], color: [1, 0.2, 0.16, this.settings.probeMoveMode ? 1 : 0.62] },
      { offset: [0, r, 0], color: [0.22, 1, 0.42, this.settings.probeMoveMode ? 1 : 0.62] },
      { offset: [0, 0, r], color: [0.28, 0.58, 1, this.settings.probeMoveMode ? 1 : 0.62] },
    ]
    for (const probe of this.probes) {
      const p = probe.path[probe.path.length - 1]
      if (!p) continue
      const c = this.fieldToScene(p)
      for (const axis of axes) {
        const o = axis.offset
        const line = new Float32Array([c[0] - o[0], c[1] - o[1], c[2] - o[2], c[0] + o[0], c[1] + o[1], c[2] + o[2]])
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
        gl.useProgram(this.lineProgram)
        gl.lineWidth(4)
        gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, "u_mvp"), false, mvp)
        gl.uniform4f(gl.getUniformLocation(this.lineProgram, "u_color"), axis.color[0], axis.color[1], axis.color[2], axis.color[3])
        gl.bindVertexArray(null)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.trailBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, line, gl.DYNAMIC_DRAW)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.drawArrays(gl.LINES, 0, 2)
        this.drawGizmoPoints(mvp, makeAxisHandlePoints(c, o), axis.color)
      }
    }
    gl.lineWidth(1)
  }

  private drawGizmoPoints(mvp: Float32Array, points: number[][], color: number[]) {
    if (!this.highlightProgram || !this.trailBuffer) return
    const gl = this.gl
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.useProgram(this.highlightProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.highlightProgram, "u_mvp"), false, mvp)
    gl.uniform1f(gl.getUniformLocation(this.highlightProgram, "u_pointSize"), this.settings.probeMoveMode ? 10 : 7)
    gl.uniform4f(gl.getUniformLocation(this.highlightProgram, "u_color"), color[0], color[1], color[2], color[3])
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points.flat()), gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.POINTS, 0, points.length)
  }

  private cameraEye(): [number, number, number] {
    return [
      Math.sin(this.azimuth) * Math.cos(this.elevation) * this.zoom,
      Math.sin(this.elevation) * this.zoom,
      Math.cos(this.azimuth) * Math.cos(this.elevation) * this.zoom,
    ]
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
        message: this.settings.paused ? "Paused" : this.probes.some((probe) => probe.active) ? "Probe following field" : "Ready",
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
uniform float u_stepNorm;
uniform float u_stepSpeedMax;
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
  vec3 vWorld = texture(u_field, p.zyx).xyz;
  float speed = length(vWorld);
  float clipSpeed = u_velocityClipValue * u_stepSpeedMax;
  if (u_velocityClip == 1 && speed > clipSpeed) {
    vWorld *= clipSpeed / max(speed, 0.0001);
    speed = clipSpeed;
  }
  float speedN = clamp(speed / max(u_speedNorm, 0.0001), 0.0, 1.5);
  float filtered = 0.0;
  if (u_speedFilter == 1) {
    filtered = (u_filterHigh == 1)
      ? float(speedN < u_filterFraction)
      : float(speedN > u_filterFraction);
  }
  vec3 stepv = (vWorld / max(u_span, vec3(0.0001))) * (u_dt * u_speedScale * u_stepNorm);
  p = fract(p + stepv);
  float ent = texture(u_entropy, p.zyx).r;
  float age = a_age + 1.0 + filtered * a_ttl;
  float ttl = a_ttl * u_ttlScale;
  float ema = mix(a_entropyEma, ent - a_entropyPrev, 0.2);
  if (age > ttl) {
    p = a_seed;
    age = 0.0;
    ent = texture(u_entropy, p.zyx).r;
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
  vec3 v = texture(u_field, a_pos.zyx).xyz;
  v_speed = clamp(length(v) / max(u_speedNorm, 0.0001), 0.0, 1.0);
  v_entropy = texture(u_entropy, a_pos.zyx).r;
  v_deltaEntropy = a_entropyEma;
  float ageN = a_age / max(a_ttl, 1.0);
  v_alpha = smoothstep(0.0, 0.08, ageN) * (1.0 - smoothstep(0.82, 1.0, ageN));
  vec3 p = vec3(a_pos.x - 0.5, a_pos.z - 0.5, a_pos.y - 0.5) * u_displayScale;
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
  outColor = vec4(color * sprite, sprite * v_alpha * u_alphaScale);
}`

const oosVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_world;
uniform mat4 u_mvp;
uniform vec3 u_amin;
uniform vec3 u_span;
uniform vec3 u_displayScale;
void main() {
  vec3 n = (a_world - u_amin) / max(u_span, vec3(0.0001));
  vec3 p = vec3(n.x - 0.5, n.z - 0.5, n.y - 0.5) * u_displayScale;
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

const highlightVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_pos;
uniform mat4 u_mvp;
uniform float u_pointSize;
void main() {
  gl_Position = u_mvp * vec4(a_pos, 1.0);
  gl_PointSize = u_pointSize;
}`

const highlightFragmentShader = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  if (length(d) > 0.5) discard;
  outColor = u_color;
}`

const meshVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_pos;
uniform mat4 u_mvp;
uniform vec3 u_displayScale;
void main() {
  vec3 p = vec3(a_pos.x - 0.5, a_pos.z - 0.5, a_pos.y - 0.5) * u_displayScale;
  gl_Position = u_mvp * vec4(p, 1.0);
}`

const meshFragmentShader = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
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
  return mode === "entropy" ? 1 : 0
}

function colorMapIndex(map: ColorMap) {
  return ["turbo", "rainbow", "bipolar"].indexOf(map)
}

function uniqueConsecutive(items: string[]) {
  const out: string[] = []
  for (const item of items) {
    if (item && out[out.length - 1] !== item) out.push(item)
  }
  return out
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

function decodeF16WorldPoints(buffer: ArrayBuffer, meta: GridMeta) {
  const src = new Uint16Array(buffer)
  const out = new Float32Array(src.length)
  for (let i = 0; i < src.length; i += 3) {
    out[i] = clamp((halfToFloat(src[i]) - meta.axisMin[0]) / meta.span[0], 0.001, 0.999)
    out[i + 1] = clamp((halfToFloat(src[i + 1]) - meta.axisMin[1]) / meta.span[1], 0.001, 0.999)
    out[i + 2] = clamp((halfToFloat(src[i + 2]) - meta.axisMin[2]) / meta.span[2], 0.001, 0.999)
  }
  return out
}

function halfToFloat(value: number) {
  const sign = (value & 0x8000) ? -1 : 1
  const exponent = (value >> 10) & 0x1f
  const fraction = value & 0x03ff
  if (exponent === 0) return sign * Math.pow(2, -14) * (fraction / 1024)
  if (exponent === 31) return fraction ? Number.NaN : sign * Number.POSITIVE_INFINITY
  return sign * Math.pow(2, exponent - 15) * (1 + fraction / 1024)
}

function sampleVectorFieldF16(data: Uint16Array, n: number, coord: number[]): [number, number, number] | null {
  if (!data.length || n <= 1) return null
  const x = clamp(coord[0], 0, 0.999999) * (n - 1)
  const y = clamp(coord[1], 0, 0.999999) * (n - 1)
  const z = clamp(coord[2], 0, 0.999999) * (n - 1)
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const z0 = Math.floor(z)
  const x1 = Math.min(x0 + 1, n - 1)
  const y1 = Math.min(y0 + 1, n - 1)
  const z1 = Math.min(z0 + 1, n - 1)
  const tx = x - x0
  const ty = y - y0
  const tz = z - z0
  const out: [number, number, number] = [0, 0, 0]

  for (let dz = 0; dz <= 1; dz += 1) {
    const iz = dz ? z1 : z0
    const wz = dz ? tz : 1 - tz
    for (let dy = 0; dy <= 1; dy += 1) {
      const iy = dy ? y1 : y0
      const wy = dy ? ty : 1 - ty
      for (let dx = 0; dx <= 1; dx += 1) {
        const ix = dx ? x1 : x0
        const weight = (dx ? tx : 1 - tx) * wy * wz
        const base = ((iz * n + iy) * n + ix) * 4
        out[0] += halfToFloat(data[base]) * weight
        out[1] += halfToFloat(data[base + 1]) * weight
        out[2] += halfToFloat(data[base + 2]) * weight
      }
    }
  }

  if (!Number.isFinite(out[0]) || !Number.isFinite(out[1]) || !Number.isFinite(out[2])) return null
  return out
}

function sampleScalarFieldF16(data: Uint16Array, n: number, coord: number[]) {
  if (!data.length || n <= 1) return null
  const x = clamp(coord[0], 0, 0.999999) * (n - 1)
  const y = clamp(coord[1], 0, 0.999999) * (n - 1)
  const z = clamp(coord[2], 0, 0.999999) * (n - 1)
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const z0 = Math.floor(z)
  const x1 = Math.min(x0 + 1, n - 1)
  const y1 = Math.min(y0 + 1, n - 1)
  const z1 = Math.min(z0 + 1, n - 1)
  const tx = x - x0
  const ty = y - y0
  const tz = z - z0
  let out = 0

  for (let dz = 0; dz <= 1; dz += 1) {
    const iz = dz ? z1 : z0
    const wz = dz ? tz : 1 - tz
    for (let dy = 0; dy <= 1; dy += 1) {
      const iy = dy ? y1 : y0
      const wy = dy ? ty : 1 - ty
      for (let dx = 0; dx <= 1; dx += 1) {
        const ix = dx ? x1 : x0
        const weight = (dx ? tx : 1 - tx) * wy * wz
        out += halfToFloat(data[(iz * n + iy) * n + ix]) * weight
      }
    }
  }

  return Number.isFinite(out) ? out : null
}

function insideUnitCube(pos: number[]) {
  return pos[0] >= 0.001 && pos[0] <= 0.999 && pos[1] >= 0.001 && pos[1] <= 0.999 && pos[2] >= 0.001 && pos[2] <= 0.999
}

function gaussian01() {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
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

function makeAxisHandlePoints(center: number[], offset: number[]) {
  const points: number[][] = []
  for (let i = -6; i <= 6; i += 1) {
    const t = i / 6
    points.push([center[0] + offset[0] * t, center[1] + offset[1] * t, center[2] + offset[2] * t])
  }
  return points
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

function vec3Add(a: number[], b: number[]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function vec3Scale(v: number[], scale: number): [number, number, number] {
  return [v[0] * scale, v[1] * scale, v[2] * scale]
}

function vec3Cross(a: number[], b: number[]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function vec3Normalize(v: number[]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2])
  if (len < 1e-8) return [0, 0, 0]
  return [v[0] / len, v[1] / len, v[2] / len]
}

function distanceToSegment(p: number[], a: number[], b: number[]) {
  const abx = b[0] - a[0]
  const aby = b[1] - a[1]
  const apx = p[0] - a[0]
  const apy = p[1] - a[1]
  const ab2 = abx * abx + aby * aby
  const t = ab2 <= 1e-6 ? 0 : clamp((apx * abx + apy * aby) / ab2, 0, 1)
  return Math.hypot(apx - abx * t, apy - aby * t)
}

function intersectBox(origin: number[], dir: number[], min: number[], max: number[]): [number, number, number] | null {
  const range = intersectBoxRange(origin, dir, min, max)
  if (!range) return null
  const t = range[0] >= 0 ? range[0] : range[1]
  if (t < 0 || !Number.isFinite(t)) return null
  return [origin[0] + dir[0] * t, origin[1] + dir[1] * t, origin[2] + dir[2] * t]
}

function intersectBoxRange(origin: number[], dir: number[], min: number[], max: number[]): [number, number] | null {
  let tMin = -Infinity
  let tMax = Infinity
  for (let axis = 0; axis < 3; axis += 1) {
    if (Math.abs(dir[axis]) < 1e-8) {
      if (origin[axis] < min[axis] || origin[axis] > max[axis]) return null
      continue
    }
    const invD = 1 / dir[axis]
    let t0 = (min[axis] - origin[axis]) * invD
    let t1 = (max[axis] - origin[axis]) * invD
    if (t0 > t1) [t0, t1] = [t1, t0]
    tMin = Math.max(tMin, t0)
    tMax = Math.min(tMax, t1)
    if (tMax < tMin) return null
  }
  if (tMax < 0 || !Number.isFinite(tMin) || !Number.isFinite(tMax)) return null
  return [Math.max(tMin, 0), tMax]
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
