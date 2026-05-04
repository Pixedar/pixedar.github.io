"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen,
  Activity,
  Crosshair,
  Eraser,
  Github,
  Home,
  LocateFixed,
  Route,
  Search,
  Sparkles,
  X,
} from "lucide-react"

type Vec3 = [number, number, number]

type Manifest = {
  schemaVersion: number
  generatedAt: number
  snapshot: string
  fingerprint: string
  paperCount: number
  gridShape: [number, number, number]
  embedDim: number
  flowMode: string
  axisMin: Vec3
  axisMax: Vec3
  repository: string
}

type Paper = {
  id: number
  arxivId: string
  title: string
  abstract: string
  authors: string[]
  categories: string[]
  published: string
  absUrl: string
  pdfUrl: string
  role: string
  projected3d: Vec3
  cluster: number
}

type Cluster = {
  id: number
  label: string
  centroid3d: Vec3
  count: number
  color: Vec3
}

type AxisInfo = {
  index: number
  label: string
  lengthFraction: number
  minIndex: number
  maxIndex: number
}

type BasinMesh = {
  vertices: Vec3[]
  faces: number[]  // flat triangle indices
}

type Attractor = {
  index: number
  label: string
  position: Vec3
  strength: number
  basin_fraction: number
  divergence: number
  basin_points?: Vec3[]
  basin_values?: number[]
  basin_mesh?: BasinMesh
  explanation?: string
}

type SavedPath = {
  control_points: Vec3[]
  explanation?: string
  journey?: {
    score_trend?: string
    attractors_visited?: number[]
    n_steps?: number
    total_distance?: number
    dwelling_fraction?: number
  }
}

type FlowAnalysis = {
  attractors?: Attractor[]
  saved_paths?: SavedPath[]
  axis_labels?: string[]
  score_channels?: string[]
}

type TraceScopeData = {
  latest: string
  manifest: Manifest
  papers: Paper[]
  clusters: Cluster[]
  axes: AxisInfo[]
  velocity: Float32Array
  confidence: Float32Array | null
  flowAnalysis: FlowAnalysis
}

type Settings = {
  flowActive: boolean
  showPoints: boolean
  showPath: boolean
  showAttractors: boolean
  showSavedPaths: boolean
  showInfoOverlay: boolean
  ballFollow: boolean
  particleCount: number
  particleSize: number
  speed: number
  flowOpacity: number
  confidenceFade: number
  constrainToPath: boolean
  flowColorMode: "speed" | "cluster"
}

type Status = {
  loaded: boolean
  message: string
  fps: number
  particles: number
}

const initialSettings: Settings = {
  flowActive: true,
  showPoints: false,
  showPath: false,
  showAttractors: false,
  showSavedPaths: true,
  showInfoOverlay: true,
  ballFollow: true,
  particleCount: 64000,
  particleSize: 28,
  speed: 0.95,
  flowOpacity: 0.8,
  confidenceFade: 0,
  constrainToPath: true,
  flowColorMode: "speed",
}

const basePath = () => (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")
const backendUrl = () => (process.env.NEXT_PUBLIC_TRACESCOPE_API_URL ?? "").replace(/\/$/, "")
const byokKey = "tracescope_byok_openai_key"

export function TraceScopeViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<TraceScopeRenderer | null>(null)
  const dataRef = useRef<TraceScopeData | null>(null)
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [status, setStatus] = useState<Status>({
    loaded: false,
    message: "Loading TraceScope snapshot",
    fps: 0,
    particles: initialSettings.particleCount,
  })
  const [probeInfo, setProbeInfo] = useState("Probe analysis will appear here.")
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [keyPanelOpen, setKeyPanelOpen] = useState(false)
  const [apiKeyDraft, setApiKeyDraft] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false

    loadTraceScopeData(setStatus)
      .then((data) => {
        if (cancelled) return
        dataRef.current = data
        const renderer = new TraceScopeRenderer(canvas, data, settings, setStatus, setProbeInfo)
        rendererRef.current = renderer
        renderer.start()
      })
      .catch((error) => {
        setStatus((current) => ({
          ...current,
          loaded: false,
          message: error instanceof Error ? error.message : "Failed to load TraceScope data",
        }))
      })

    return () => {
      cancelled = true
      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    rendererRef.current?.setSettings(settings)
  }, [settings])

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }, [])

  const explain = useCallback(async () => {
    const renderer = rendererRef.current
    const data = dataRef.current
    if (!renderer || !data) return

    const cached = renderer.findCachedExplanation()
    if (cached) {
      setProbeInfo(cached)
      setAnalysisOpen(true)
      return
    }

    const trajectory = renderer.getMarkedPath()
    const api = backendUrl()
    if (api) {
      try {
        const response = await fetch(`${api}/explain`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            trajectory,
            axes: data.axes.map((a) => a.label),
            clusters: data.clusters.map((c) => c.label),
            nearestPapers: renderer.nearestPapers(5),
          }),
        })
        if (response.status === 429) {
          setKeyPanelOpen(true)
          return
        }
        if (response.ok) {
          const body = (await response.json()) as { text?: string }
          const text = body.text || "No explanation returned."
          setProbeInfo(text)
          setAnalysisOpen(true)
          return
        }
      } catch {
        // Fall through to BYOK.
      }
    }

    const key = sessionStorage.getItem(byokKey)
    if (!key) {
      setKeyPanelOpen(true)
      return
    }
    const text = await explainWithUserKey(key, data, trajectory, renderer.nearestPapers(5))
    setProbeInfo(text)
    setAnalysisOpen(true)
  }, [])

  const searchResults = useMemo(() => {
    const data = dataRef.current
    if (!data || !query.trim()) return []
    const q = query.toLowerCase()
    return data.papers
      .filter((paper) => `${paper.title} ${paper.abstract} ${paper.categories.join(" ")}`.toLowerCase().includes(q))
      .slice(0, 6)
  }, [query, status.loaded])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return
      const key = event.key.toLowerCase()
      if (event.key === " ") {
        event.preventDefault()
        updateSetting("flowActive", !settings.flowActive)
      } else if (key === "f") updateSetting("flowActive", !settings.flowActive)
      else if (key === "b") updateSetting("ballFollow", !settings.ballFollow)
      else if (key === "p") updateSetting("showPoints", !settings.showPoints)
      else if (key === "l") updateSetting("showPath", !settings.showPath)
      else if (key === "r") rendererRef.current?.resetCamera()
      else if (key === "m") rendererRef.current?.markProbe()
      else if (key === "e") explain()
      else if (event.key === "+" || event.key === "=") updateSetting("particleSize", clamp(settings.particleSize + 4, 6, 64))
      else if (event.key === "-" || event.key === "_") updateSetting("particleSize", clamp(settings.particleSize - 4, 6, 64))
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [explain, settings, updateSetting])

  return (
    <div className="h-screen overflow-hidden bg-[#1E1E1E] text-[#E8E8E8]">
      <main className="flex h-screen flex-col">
        <header className="flex min-h-14 flex-wrap items-center gap-3 border-b border-white/10 bg-[#252525] px-4 py-2 md:px-6">
          <a href="/" className="inline-flex h-10 w-10 items-center justify-center rounded border border-white/15 bg-white/5 hover:bg-white/10" title="Home">
            <Home className="h-5 w-5" />
          </a>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight md:text-2xl">TraceScope AI Paper Flow</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
              <span>{status.loaded ? "precomputed web demo" : status.message}</span>
              <span>{dataRef.current?.manifest.flowMode.toUpperCase() ?? "RBF"} flow field</span>
            </div>
          </div>
          <a
            href="https://github.com/Pixedar/TraceScope"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex h-10 items-center gap-2 rounded border border-white/15 bg-white/[0.04] px-3 text-sm text-white/78 hover:bg-white/10"
          >
            <Github className="h-4 w-4" />
            TraceScope repo
          </a>
          <Metric icon={<Activity className="h-4 w-4" />} value={`${status.fps.toFixed(status.fps ? 1 : 0)} FPS`} />
          <Metric icon={<BookOpen className="h-4 w-4" />} value={`${dataRef.current?.manifest.paperCount ?? 0} papers`} />
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="relative min-h-0 overflow-hidden bg-[#1E1E1E]">
            <canvas ref={canvasRef} className="block h-full w-full" />
            {!status.loaded && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#1E1E1E]/90">
                <div className="rounded-md border border-[#FF6B35]/35 bg-[#252525]/95 px-8 py-7 text-center shadow-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#FF6B35]/45">
                    <Route className="h-7 w-7 text-[#FF6B35]" />
                  </div>
                  <div className="text-lg font-semibold text-white">Loading TraceScope</div>
                  <div className="mt-1 text-sm text-white/65">{status.message}</div>
                </div>
              </div>
            )}
            {settings.showInfoOverlay ? (
              <>
                <div className="pointer-events-none absolute left-4 top-4 max-w-[min(34rem,calc(100%-2rem))] rounded border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/70 backdrop-blur">
                  {status.message}
                </div>
                <div className="pointer-events-none absolute bottom-4 left-4 max-h-32 max-w-[min(42rem,calc(100%-2rem))] overflow-hidden rounded border border-[#FF6B35]/25 bg-black/45 px-3 py-2 text-xs leading-relaxed text-white/72 backdrop-blur">
                  {probeInfo}
                </div>
              </>
            ) : null}
          </section>

          <aside className="min-h-0 overflow-y-auto border-l border-white/10 bg-[#2A2A2A]">
            <div className="space-y-5 p-4">

              <ControlSection title="Display">
                <ToggleRow label="Show Data Points" checked={settings.showPoints} onChange={(value) => updateSetting("showPoints", value)} />
                <ToggleRow label="Show Path" checked={settings.showPath} onChange={(value) => updateSetting("showPath", value)} />
                <ToggleRow label="Show Info Overlay" checked={settings.showInfoOverlay} onChange={(value) => updateSetting("showInfoOverlay", value)} />
                <ToggleRow label="Show Attractors" checked={settings.showAttractors} onChange={(value) => updateSetting("showAttractors", value)} />
              </ControlSection>

              <ControlSection title="Clusters">
                <div className="space-y-2">
                  {(dataRef.current?.clusters ?? []).slice(0, 10).map((cluster) => (
                    <div key={cluster.id} className="grid grid-cols-[14px_minmax(0,1fr)_44px] items-center gap-2 text-xs text-white/68">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: rgb(cluster.color) }} />
                      <span className="truncate" title={cluster.label}>{cluster.label}</span>
                      <span className="text-right font-mono text-white/40">{cluster.count}</span>
                    </div>
                  ))}
                </div>
              </ControlSection>

              <ControlSection title="Search">
                <label className="flex h-10 items-center gap-2 rounded border border-white/10 bg-[#1E1E1E] px-3 text-sm">
                  <Search className="h-4 w-4 text-white/45" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search papers" className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35" />
                </label>
                <div className="space-y-2">
                  {searchResults.map((paper) => (
                    <button
                      key={paper.id}
                      type="button"
                      onClick={() => rendererRef.current?.focusPaper(paper.id)}
                      className="w-full rounded border border-white/10 bg-white/[0.035] p-3 text-left text-sm text-white/75 hover:bg-white/10"
                    >
                      <span className="line-clamp-2">{paper.title}</span>
                      <span className="mt-1 block font-mono text-xs text-white/38">{paper.arxivId}</span>
                    </button>
                  ))}
                </div>
              </ControlSection>

              <ControlSection title="Probe">
                <ToggleRow label="Follow flow" checked={settings.ballFollow} onChange={(value) => updateSetting("ballFollow", value)} />
                {!settings.ballFollow ? (
                  <div className="rounded px-1 py-1 text-[11px] leading-relaxed text-[#88ccff]">
                    Hold Ctrl + drag gizmo arrows to move probe · M to mark · E to explain
                  </div>
                ) : (
                  <div className="rounded px-1 py-1 text-[11px] leading-relaxed text-white/45">
                    M to mark position · E to explain path
                  </div>
                )}
                <ProbeSliders renderer={rendererRef.current} labels={dataRef.current?.axes.map((axis) => axis.label)} />
                <div className="grid grid-cols-2 gap-2">
                  <TextButton label="Mark Point" onClick={() => rendererRef.current?.markProbe()} />
                  <TextButton label="Clear" secondary onClick={() => rendererRef.current?.clearPath()} />
                </div>
                <TextButton label="Explain Path" onClick={explain} />
                {(dataRef.current?.flowAnalysis.saved_paths?.length ?? 0) > 0 ? (
                  <button
                    type="button"
                    onClick={() => updateSetting("showSavedPaths", !settings.showSavedPaths)}
                    className="h-10 w-full rounded border border-white/10 bg-[#555] px-3 text-sm text-white hover:bg-[#777]"
                  >
                    {settings.showSavedPaths ? "Hide Saved Paths" : "Show Saved Paths"}
                  </button>
                ) : null}
                <div className="min-h-28 rounded border border-white/10 bg-[#1E1E1E] p-3 text-sm leading-relaxed text-white/72">
                  {probeInfo}
                </div>
              </ControlSection>

              <ControlSection title="Flow Settings">
                <SelectRow
                  label="Particles"
                  value={String(settings.particleCount)}
                  onChange={(value) => updateSetting("particleCount", Number(value))}
                  options={[
                    ["8000", "8k"],
                    ["27000", "27k"],
                    ["64000", "64k"],
                    ["125000", "125k"],
                  ]}
                />
                <SliderRow label="Opacity" min={0.05} max={1} step={0.01} value={settings.flowOpacity} onChange={(value) => updateSetting("flowOpacity", value)} />
                <SliderRow label="Speed" min={0.05} max={2.5} step={0.01} value={settings.speed} onChange={(value) => updateSetting("speed", value)} />
                <SliderRow label="Particle" min={6} max={64} step={1} value={settings.particleSize} onChange={(value) => updateSetting("particleSize", value)} />
                <SliderRow label="Confidence" min={0} max={100} step={1} value={settings.confidenceFade} suffix="%" disabled={!dataRef.current?.confidence} onChange={(value) => updateSetting("confidenceFade", value)} />
                <ToggleRow label="Constrain to paths" checked={settings.constrainToPath} onChange={(value) => updateSetting("constrainToPath", value)} />
                <ToggleRow label="Cluster colors" checked={settings.flowColorMode === "cluster"} onChange={(value) => updateSetting("flowColorMode", value ? "cluster" : "speed")} />
              </ControlSection>

            </div>
          </aside>
        </div>
      </main>

      {analysisOpen && (
        <Modal title="Probe Analysis" onClose={() => setAnalysisOpen(false)}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/78">{probeInfo}</p>
        </Modal>
      )}

      {keyPanelOpen && (
        <Modal title="Live Explanations" onClose={() => setKeyPanelOpen(false)}>
          <p className="mb-4 text-sm leading-relaxed text-white/72">
            Cached explanations are already included. For a new free-form path, paste your OpenAI API key; it stays in this browser session.
          </p>
          <input
            value={apiKeyDraft}
            onChange={(event) => setApiKeyDraft(event.target.value)}
            type="password"
            placeholder="sk-..."
            className="mb-3 h-10 w-full rounded border border-white/10 bg-[#1E1E1E] px-3 text-sm text-white outline-none"
          />
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(byokKey, apiKeyDraft.trim())
              setKeyPanelOpen(false)
              setApiKeyDraft("")
              explain()
            }}
            className="h-10 rounded bg-[#FF6B35] px-4 text-sm font-semibold text-white hover:bg-[#FF8555]"
          >
            Use my key
          </button>
        </Modal>
      )}
    </div>
  )
}

async function loadTraceScopeData(setStatus: React.Dispatch<React.SetStateAction<Status>>): Promise<TraceScopeData> {
  const root = `${basePath()}/data/tracescope`
  const latest = (await fetchText(`${root}/latest.txt`)).trim()
  const dir = `${root}/${latest}`
  setStatus((s) => ({ ...s, message: `Loading snapshot ${latest}` }))

  const [manifest, papersJson, clustersJson, axesJson, flowAnalysis, velocityRaw, confidenceRaw] = await Promise.all([
    fetchJson<Manifest>(`${dir}/manifest.json`),
    fetchJson<{ papers: Paper[] }>(`${dir}/papers.json`),
    fetchJson<{ clusters: Cluster[] }>(`${dir}/clusters.json`),
    fetchJson<{ axes: AxisInfo[] }>(`${dir}/axes.json`),
    fetchJson<FlowAnalysis>(`${dir}/flow_analysis.json`).catch(() => ({})),
    fetchArrayBuffer(`${dir}/velocity_grid.f16.bin`),
    fetchArrayBuffer(`${dir}/confidence_grid.f16.bin`).catch(() => null),
  ])

  const velocity = decodeFloat16Array(new Uint16Array(velocityRaw))
  const confidence = confidenceRaw ? decodeFloat16Array(new Uint16Array(confidenceRaw)) : null
  setStatus((s) => ({
    ...s,
    loaded: true,
    particles: initialSettings.particleCount,
    message: `${manifest.paperCount} papers, ${clustersJson.clusters.length} clusters, ${latest}`,
  }))
  return {
    latest,
    manifest,
    papers: papersJson.papers,
    clusters: clustersJson.clusters,
    axes: axesJson.axes,
    velocity,
    confidence,
    flowAnalysis,
  }
}

async function fetchText(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${url}`)
  return response.text()
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${url}`)
  return response.json() as Promise<T>
}

async function fetchArrayBuffer(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${url}`)
  return response.arrayBuffer()
}

function decodeFloat16Array(input: Uint16Array): Float32Array {
  const out = new Float32Array(input.length)
  for (let i = 0; i < input.length; i++) out[i] = halfToFloat(input[i])
  return out
}

function halfToFloat(h: number) {
  const s = (h & 0x8000) >> 15
  const e = (h & 0x7c00) >> 10
  const f = h & 0x03ff
  if (e === 0) return (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024)
  if (e === 31) return f ? Number.NaN : (s ? -Infinity : Infinity)
  return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024)
}

// ─────────────────────────────────────────────
//  GLSL Shaders
// ─────────────────────────────────────────────

const particleVert = `#version 300 es
in vec3 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
uniform float u_base_size;
out vec4 v_color;
void main() {
  vec4 clip = u_matrix * vec4(a_position, 1.0);
  gl_Position = clip;
  float size = u_base_size / max(0.001, clip.w);
  gl_PointSize = clamp(size, 2.0, 64.0);
  v_color = a_color;
}`

const particleFrag = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 o;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r2 = dot(d, d);
  if (r2 > 0.25) discard;
  float alpha = pow(clamp((0.5 - sqrt(r2)) * 2.0, 0.0, 1.0), 1.6);
  vec3 rgb = mix(v_color.rgb * 0.65, v_color.rgb, alpha);
  o = vec4(rgb, alpha * v_color.a);
}`

const pointVert = `#version 300 es
in vec3 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
uniform float u_point_size;
out vec4 v_color;
void main() {
  vec4 clip = u_matrix * vec4(a_position, 1.0);
  gl_Position = clip;
  float dist = max(0.2, length(clip.xyz));
  gl_PointSize = u_point_size + (1.0 / dist);
  v_color = a_color;
}`

const pointFrag = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 o;
void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float lightFactor = 0.8 + 0.2 * (1.0 - smoothstep(0.0, 0.5, dist));
  vec3 vibrant = clamp(v_color.rgb * 1.3 + vec3(0.1), vec3(0.0), vec3(1.0));
  o = vec4(vibrant * lightFactor, v_color.a);
}`

const lineVert = `#version 300 es
in vec3 a_position;
uniform mat4 u_matrix;
void main() {
  gl_Position = u_matrix * vec4(a_position, 1.0);
}`

const lineFrag = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 o;
void main() { o = u_color; }`

// Per-vertex colored lines (for cluster-colored data path)
const coloredLineVert = `#version 300 es
in vec3 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
out vec4 v_color;
void main() {
  gl_Position = u_matrix * vec4(a_position, 1.0);
  v_color = a_color;
}`

const coloredLineFrag = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 o;
void main() { o = v_color; }`

// Triangle mesh (for attractor basin isosurface)
const meshVert = `#version 300 es
in vec3 a_position;
uniform mat4 u_matrix;
void main() {
  gl_Position = u_matrix * vec4(a_position, 1.0);
}`

const meshFrag = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 o;
void main() { o = u_color; }`

// ─────────────────────────────────────────────
//  Renderer
// ─────────────────────────────────────────────

class TraceScopeRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private data: TraceScopeData
  private settings: Settings
  private setStatus: React.Dispatch<React.SetStateAction<Status>>
  private setProbeInfo: React.Dispatch<React.SetStateAction<string>>

  // WebGL programs
  private particleProgram: WebGLProgram
  private pointProgram: WebGLProgram
  private lineProgram: WebGLProgram
  private coloredLineProgram: WebGLProgram
  private meshProgram: WebGLProgram

  // WebGL buffers
  private particleBuffer: WebGLBuffer
  private particleColorBuffer: WebGLBuffer
  private pointBuffer: WebGLBuffer
  private pointColorBuffer: WebGLBuffer
  private lineBuffer: WebGLBuffer
  private scratchBuffer: WebGLBuffer
  private scratchColorBuffer: WebGLBuffer
  private coloredLineBuffer: WebGLBuffer
  private coloredLineColorBuffer: WebGLBuffer
  private meshVertexBuffer: WebGLBuffer
  private meshIndexBuffer: WebGLBuffer

  // Particle state
  private particles = new Float32Array(0)
  private particleColors = new Float32Array(0)
  private origins = new Float32Array(0)
  private blobAlpha = new Float32Array(0)
  private ages = new Uint16Array(0)

  // Probe & path state
  private marked: Vec3[] = []
  private probe: Vec3
  private probeTrail: Vec3[] = []
  private readonly MAX_TRAIL = 80

  // Pre-computed path data
  private dataPath: Vec3[] = []
  private splineDataPath: Vec3[] = []
  private splinePathColors: Float32Array = new Float32Array(0)

  // Camera state
  private raf = 0
  private disposed = false
  private lastTime = performance.now()
  private fpsLast = performance.now()
  private frames = 0
  private azimuth = 0
  private elevation = 20
  private distance = 9
  private dragging = false
  private lastPointer: Vec3 = [0, 0, 0]

  // Scene geometry
  private dataCenter: Vec3
  private axisMin: Vec3
  private axisMax: Vec3
  private span: Vec3
  private sceneScale: number

  // Blob/path constraint
  private blobOpacity: Float32Array | null = null
  private blobCore: Uint8Array | null = null
  private blobRes = 42

  // Gizmo state
  private gizmoVisible = false
  private gizmoDragging: number | null = null
  private gizmoDragStartPos: Vec3 | null = null
  private gizmoDragStartClick: [number, number] | null = null
  private gizmoDragAxisScreenN: [number, number] | null = null
  private gizmoDragPxPerUnit = 1.0
  private ctrlHeld = false
  private gizmoArrowLen = 0

  // Click tracking (for attractor selection)
  private pointerDownPos: [number, number] | null = null
  private pointerMoved = false
  private highlightedAttractor: number | null = null

  // Cached view-projection for screen-space ops
  private currentViewProj: Float32Array = new Float32Array(16)

  constructor(
    canvas: HTMLCanvasElement,
    data: TraceScopeData,
    settings: Settings,
    setStatus: React.Dispatch<React.SetStateAction<Status>>,
    setProbeInfo: React.Dispatch<React.SetStateAction<string>>,
  ) {
    this.canvas = canvas
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance" })
    if (!gl) throw new Error("WebGL2 is required for TraceScope")
    this.gl = gl
    this.data = data
    this.settings = settings
    this.setStatus = setStatus
    this.setProbeInfo = setProbeInfo
    this.axisMin = data.manifest.axisMin
    this.axisMax = data.manifest.axisMax
    this.span = sub(this.axisMax, this.axisMin)
    this.dataCenter = mul(add(this.axisMin, this.axisMax), 0.5)
    const spanMag = Math.max(length(this.span), 0.001)
    this.sceneScale = 6 / spanMag
    this.probe = [...this.dataCenter] as Vec3
    this.dataPath = this.data.papers.map((paper) => paper.projected3d)
    this.splineDataPath = catmullRomPath(this.dataPath, 20)
    this.buildPathBlob(this.splineDataPath.length ? this.splineDataPath : this.dataPath)
    this.gizmoArrowLen = Math.max(this.span[0], this.span[1], this.span[2]) * 0.084

    this.particleProgram = makeProgram(gl, particleVert, particleFrag)
    this.pointProgram = makeProgram(gl, pointVert, pointFrag)
    this.lineProgram = makeProgram(gl, lineVert, lineFrag)
    this.coloredLineProgram = makeProgram(gl, coloredLineVert, coloredLineFrag)
    this.meshProgram = makeProgram(gl, meshVert, meshFrag)

    this.particleBuffer = mustBuffer(gl)
    this.particleColorBuffer = mustBuffer(gl)
    this.pointBuffer = mustBuffer(gl)
    this.pointColorBuffer = mustBuffer(gl)
    this.lineBuffer = mustBuffer(gl)
    this.scratchBuffer = mustBuffer(gl)
    this.scratchColorBuffer = mustBuffer(gl)
    this.coloredLineBuffer = mustBuffer(gl)
    this.coloredLineColorBuffer = mustBuffer(gl)
    this.meshVertexBuffer = mustBuffer(gl)
    this.meshIndexBuffer = mustBuffer(gl)

    this.initParticles(settings.particleCount)
    this.uploadPoints()
    this.splinePathColors = this.computeSplinePathColors()
    this.installEvents()
  }

  start() {
    this.loop()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    const gl = this.gl
    for (const prog of [this.particleProgram, this.pointProgram, this.lineProgram, this.coloredLineProgram, this.meshProgram]) {
      gl.deleteProgram(prog)
    }
    for (const buf of [this.particleBuffer, this.particleColorBuffer, this.pointBuffer, this.pointColorBuffer,
      this.lineBuffer, this.scratchBuffer, this.scratchColorBuffer,
      this.coloredLineBuffer, this.coloredLineColorBuffer,
      this.meshVertexBuffer, this.meshIndexBuffer]) {
      gl.deleteBuffer(buf)
    }
  }

  setSettings(settings: Settings) {
    const countChanged = settings.particleCount !== this.settings.particleCount
    const pathConstraintChanged = settings.constrainToPath !== this.settings.constrainToPath
    this.settings = settings
    if (countChanged || pathConstraintChanged) this.initParticles(settings.particleCount)
  }

  resetCamera() {
    this.azimuth = 0
    this.elevation = 20
    this.distance = 9
  }

  setProbeAxis(axis: number, value: number) {
    this.probe[axis] = this.axisMin[axis] + (this.span[axis] * value) / 100
    this.updateProbeInfo()
  }

  focusPaper(id: number) {
    const paper = this.data.papers[id]
    if (!paper) return
    this.probe = [...paper.projected3d] as Vec3
    this.updateProbeInfo()
  }

  markProbe() {
    this.marked.push([...this.probe] as Vec3)
    this.updateProbeInfo()
  }

  clearPath() {
    this.marked = []
    this.probeTrail = []
    this.highlightedAttractor = null
    this.updateProbeInfo()
  }

  getMarkedPath() {
    return this.marked.length >= 2 ? this.marked : [[...this.probe] as Vec3]
  }

  nearestPapers(k: number) {
    return this.data.papers
      .map((paper) => ({ paper, d: length(sub(paper.projected3d, this.probe)) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
      .map(({ paper }) => ({ title: paper.title, arxivId: paper.arxivId, abstract: paper.abstract, cluster: paper.cluster }))
  }

  findCachedExplanation() {
    const flow = this.data.flowAnalysis

    // If attractor is highlighted, return its explanation
    if (this.highlightedAttractor !== null) {
      const att = flow.attractors?.[this.highlightedAttractor]
      if (att?.explanation) return att.explanation
    }

    if (this.marked.length >= 2 && flow.saved_paths?.length) {
      let best: { score: number; text: string } | null = null
      for (const saved of flow.saved_paths) {
        if (!saved.explanation || !saved.control_points?.length) continue
        const score = meanPathDistance(this.marked, saved.control_points)
        if (!best || score < best.score) best = { score, text: saved.explanation }
      }
      if (best) return best.text
    }

    if (flow.attractors?.length) {
      let best: { d: number; text: string } | null = null
      for (const att of flow.attractors) {
        if (!att.explanation) continue
        const d = length(sub(att.position, this.probe))
        if (!best || d < best.d) best = { d, text: att.explanation }
      }
      if (best) return best.text
    }
    return null
  }

  // ─────────────────────────────────────────────
  //  Event handling
  // ─────────────────────────────────────────────

  private installEvents() {
    // Ctrl key shows/hides gizmo
    window.addEventListener("keydown", (e) => {
      if (e.key === "Control") {
        this.ctrlHeld = true
        this.gizmoVisible = true
      }
    })
    window.addEventListener("keyup", (e) => {
      if (e.key === "Control" && this.gizmoDragging === null) {
        this.ctrlHeld = false
        this.gizmoVisible = false
      }
    })

    this.canvas.addEventListener("pointerdown", (event) => {
      this.pointerDownPos = [event.clientX, event.clientY]
      this.pointerMoved = false

      // Check gizmo hit first when Ctrl held
      if (this.ctrlHeld && this.gizmoVisible) {
        const rect = this.canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const sx = (event.clientX - rect.left) * dpr
        const sy = (event.clientY - rect.top) * dpr
        if (this.handleGizmoPress(sx, sy)) {
          this.canvas.setPointerCapture(event.pointerId)
          return
        }
      }

      this.dragging = true
      this.lastPointer = [event.clientX, event.clientY, 0]
      this.canvas.setPointerCapture(event.pointerId)
    })

    this.canvas.addEventListener("pointermove", (event) => {
      if (this.pointerDownPos) {
        const dx = event.clientX - this.pointerDownPos[0]
        const dy = event.clientY - this.pointerDownPos[1]
        if (Math.hypot(dx, dy) > 4) this.pointerMoved = true
      }

      if (this.gizmoDragging !== null) {
        const rect = this.canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const sx = (event.clientX - rect.left) * dpr
        const sy = (event.clientY - rect.top) * dpr
        this.handleGizmoMove(sx, sy)
        return
      }

      if (!this.dragging) return
      const dx = event.clientX - this.lastPointer[0]
      const dy = event.clientY - this.lastPointer[1]
      this.azimuth += dx * 0.35
      this.elevation = clamp(this.elevation + dy * 0.25, -80, 80)
      this.lastPointer = [event.clientX, event.clientY, 0]
    })

    this.canvas.addEventListener("pointerup", (event) => {
      if (this.gizmoDragging !== null) {
        this.gizmoDragging = null
        this.gizmoDragStartPos = null
        this.gizmoDragStartClick = null
        this.gizmoDragAxisScreenN = null
      } else {
        this.dragging = false
        if (!this.pointerMoved && this.pointerDownPos) {
          const rect = this.canvas.getBoundingClientRect()
          const dpr = Math.min(window.devicePixelRatio || 1, 2)
          const sx = (event.clientX - rect.left) * dpr
          const sy = (event.clientY - rect.top) * dpr
          this.handleCanvasClick(sx, sy)
        }
      }
      this.pointerDownPos = null
      this.pointerMoved = false
      try { this.canvas.releasePointerCapture(event.pointerId) } catch { /* ok */ }
    })

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault()
      this.distance = clamp(this.distance + event.deltaY * 0.01, 2.5, 28)
    }, { passive: false })

    this.canvas.addEventListener("dblclick", (event) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      this.pickNearestScreenPoint(x, y)
    })
  }

  // ─────────────────────────────────────────────
  //  Gizmo interaction
  // ─────────────────────────────────────────────

  private handleGizmoPress(sx: number, sy: number): boolean {
    const center = this.projectToScreen(this.probe)
    let bestAxis = -1
    let bestDist = Infinity

    for (let i = 0; i < 3; i++) {
      const tip: Vec3 = [...this.probe] as Vec3
      tip[i] += this.gizmoArrowLen
      const tipSc = this.projectToScreen(tip)
      const d = this.distPointToSegment2D([sx, sy], center, tipSc)
      if (d < bestDist) {
        bestDist = d
        bestAxis = i
      }
    }

    if (bestAxis < 0 || bestDist > 150) return false

    // Compute screen-space scale: how many px per 1 world unit along this axis
    const testTip: Vec3 = [...this.probe] as Vec3
    testTip[bestAxis] += 1.0
    const testTipSc = this.projectToScreen(testTip)
    const axisDir: [number, number] = [testTipSc[0] - center[0], testTipSc[1] - center[1]]
    const pxPerUnit = Math.hypot(axisDir[0], axisDir[1])

    this.gizmoDragging = bestAxis
    this.gizmoDragStartPos = [...this.probe] as Vec3
    this.gizmoDragStartClick = [sx, sy]
    this.gizmoDragAxisScreenN = pxPerUnit > 1e-3
      ? [axisDir[0] / pxPerUnit, axisDir[1] / pxPerUnit]
      : [1, 0]
    this.gizmoDragPxPerUnit = pxPerUnit || 1

    return true
  }

  private handleGizmoMove(sx: number, sy: number) {
    if (this.gizmoDragging === null || !this.gizmoDragStartPos || !this.gizmoDragStartClick) return

    const mouseD: [number, number] = [sx - this.gizmoDragStartClick[0], sy - this.gizmoDragStartClick[1]]
    const alongPx = mouseD[0] * this.gizmoDragAxisScreenN![0] + mouseD[1] * this.gizmoDragAxisScreenN![1]
    const worldDelta = alongPx / this.gizmoDragPxPerUnit

    const newPos: Vec3 = [...this.gizmoDragStartPos] as Vec3
    newPos[this.gizmoDragging] += worldDelta

    for (let i = 0; i < 3; i++) {
      newPos[i] = clamp(newPos[i], this.axisMin[i], this.axisMax[i])
    }

    this.probe = newPos
    this.updateProbeInfo()
  }

  private handleCanvasClick(sx: number, sy: number) {
    if (!this.settings.showAttractors) return
    const atts = this.data.flowAnalysis.attractors ?? []
    if (!atts.length) return

    let bestIdx = -1
    let bestDist = Infinity
    const THRESHOLD = 100

    for (let i = 0; i < atts.length; i++) {
      const sc = this.projectToScreen(atts[i].position)
      const d = Math.hypot(sc[0] - sx, sc[1] - sy)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }

    if (bestIdx >= 0 && bestDist < THRESHOLD) {
      const newHighlight = bestIdx === this.highlightedAttractor ? null : bestIdx
      this.highlightedAttractor = newHighlight
      if (newHighlight !== null && atts[newHighlight]?.explanation) {
        this.setProbeInfo(atts[newHighlight].explanation!)
      }
    } else {
      this.highlightedAttractor = null
    }
  }

  // ─────────────────────────────────────────────
  //  Screen-space utilities
  // ─────────────────────────────────────────────

  private projectToScreen(worldPos: Vec3): [number, number] {
    const m = this.currentViewProj
    const wp = scalePoint(worldPos, this.sceneScale)
    // Column-major matrix-vector multiply
    const x = m[0] * wp[0] + m[4] * wp[1] + m[8] * wp[2] + m[12]
    const y = m[1] * wp[0] + m[5] * wp[1] + m[9] * wp[2] + m[13]
    const w = m[3] * wp[0] + m[7] * wp[1] + m[11] * wp[2] + m[15]
    if (Math.abs(w) < 1e-10) return [-9999, -9999]
    return [
      (x / w + 1) * 0.5 * this.canvas.width,
      (1 - y / w) * 0.5 * this.canvas.height,
    ]
  }

  private distPointToSegment2D(p: [number, number], a: [number, number], b: [number, number]): number {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-10) return Math.hypot(p[0] - a[0], p[1] - a[1])
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2, 0, 1)
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
  }

  // ─────────────────────────────────────────────
  //  Particle simulation
  // ─────────────────────────────────────────────

  private initParticles(count: number) {
    const n = Math.max(1, count)
    this.particles = new Float32Array(n * 3)
    this.origins = new Float32Array(n * 3)
    this.particleColors = new Float32Array(n * 4)
    this.blobAlpha = new Float32Array(n)
    this.ages = new Uint16Array(n)
    let seed = 123456789
    const rand = () => {
      seed = (1664525 * seed + 1013904223) >>> 0
      return seed / 0xffffffff
    }
    for (let i = 0; i < n; i++) {
      let p: Vec3 = [0, 0, 0]
      let alpha = 1
      if (this.blobOpacity && this.settings.constrainToPath) {
        for (let tries = 0; tries < 200; tries++) {
          p = [
            this.axisMin[0] + (0.05 + rand() * 0.9) * this.span[0],
            this.axisMin[1] + (0.05 + rand() * 0.9) * this.span[1],
            this.axisMin[2] + (0.05 + rand() * 0.9) * this.span[2],
          ]
          alpha = this.sampleBlobOpacity(p)
          if (alpha > 0) break
        }
        if (alpha <= 0) {
          const paper = this.data.papers[i % Math.max(1, this.data.papers.length)]
          p = paper ? [...paper.projected3d] as Vec3 : [...this.dataCenter] as Vec3
          alpha = 1
        }
      } else {
        const side = Math.ceil(Math.cbrt(n))
        const ix = i % side
        const iy = Math.floor(i / side) % side
        const iz = Math.floor(i / (side * side))
        p = [
          this.axisMin[0] + (0.05 + ((ix + 0.5) / side) * 0.9) * this.span[0],
          this.axisMin[1] + (0.05 + ((iy + 0.5) / side) * 0.9) * this.span[1],
          this.axisMin[2] + (0.05 + ((iz + 0.5) / side) * 0.9) * this.span[2],
        ]
      }
      for (let a = 0; a < 3; a++) {
        this.particles[i * 3 + a] = p[a]
        this.origins[i * 3 + a] = p[a]
      }
      this.blobAlpha[i] = alpha
      this.ages[i] = Math.floor(rand() * 57)
      this.particleColors.set([1, 0.35, 0.1, 0.65], i * 4)
    }
    for (let s = 0; s < 34; s++) this.preIntegrateParticles()
    for (let i = 0; i < n; i++) {
      const p: Vec3 = [this.particles[i * 3], this.particles[i * 3 + 1], this.particles[i * 3 + 2]]
      if (this.blobOpacity && this.settings.constrainToPath && this.sampleBlobOpacity(p) <= 0) {
        this.particles[i * 3] = this.origins[i * 3]
        this.particles[i * 3 + 1] = this.origins[i * 3 + 1]
        this.particles[i * 3 + 2] = this.origins[i * 3 + 2]
      }
    }
    this.setStatus((s) => ({ ...s, particles: n }))
  }

  private uploadPoints() {
    const positions = new Float32Array(this.data.papers.length * 3)
    const colors = new Float32Array(this.data.papers.length * 4)
    for (let i = 0; i < this.data.papers.length; i++) {
      const paper = this.data.papers[i]
      positions.set(scalePoint(paper.projected3d, this.sceneScale), i * 3)
      const color = this.data.clusters[paper.cluster]?.color ?? [1, 1, 1]
      colors.set([color[0], color[1], color[2], 0.88], i * 4)
    }
    const gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
  }

  private computeSplinePathColors(): Float32Array {
    const spline = this.splineDataPath
    if (!spline.length || !this.data.papers.length) return new Float32Array(0)
    const raw = new Float32Array(spline.length * 4)
    for (let i = 0; i < spline.length; i++) {
      const sp = spline[i]
      let best = 0
      let bestD = Infinity
      for (let j = 0; j < this.data.papers.length; j++) {
        const d = length(sub(this.data.papers[j].projected3d, sp))
        if (d < bestD) { bestD = d; best = j }
      }
      const clusterIdx = this.data.papers[best].cluster
      const color = this.data.clusters[clusterIdx]?.color ?? [1, 0, 0]
      raw.set([color[0], color[1], color[2], 0.88], i * 4)
    }
    // Moving average smoothing (window=5)
    const smoothed = new Float32Array(raw.length)
    const win = 5
    const half = Math.floor(win / 2)
    for (let i = 0; i < spline.length; i++) {
      const rgb = [0, 0, 0]
      for (let k = -half; k <= half; k++) {
        const j = clamp(i + k, 0, spline.length - 1)
        rgb[0] += raw[j * 4]
        rgb[1] += raw[j * 4 + 1]
        rgb[2] += raw[j * 4 + 2]
      }
      smoothed.set([rgb[0] / win, rgb[1] / win, rgb[2] / win, 0.88], i * 4)
    }
    return smoothed
  }

  private buildPathBlob(pathPoints: Vec3[]) {
    if (pathPoints.length < 2) return
    const res = this.blobRes
    const total = res * res * res
    const core = new Uint8Array(total)
    const opacity = new Float32Array(total)
    const norm = pathPoints.map((p) => [
      clamp((p[0] - this.axisMin[0]) / (this.span[0] || 1), 0, 1),
      clamp((p[1] - this.axisMin[1]) / (this.span[1] || 1), 0, 1),
      clamp((p[2] - this.axisMin[2]) / (this.span[2] || 1), 0, 1),
    ] as Vec3)

    const sample = norm.slice(0, Math.min(norm.length, 500))
    let nnSum = 0
    for (let i = 0; i < sample.length; i++) {
      let best = Infinity
      for (let j = 0; j < sample.length; j++) {
        if (i === j) continue
        best = Math.min(best, length(sub(sample[i], sample[j])))
      }
      nnSum += Number.isFinite(best) ? best : 0.03
    }
    const adaptive = sample.length ? (nnSum / sample.length) * 1.5 : 0.03
    const radiusFrac = Math.max(adaptive, 0.03)
    const radiusCells = Math.max(1, Math.ceil(radiusFrac * (res - 1)))
    const idx = (x: number, y: number, z: number) => (x * res + y) * res + z

    for (const p of norm) {
      const cx = Math.round(p[0] * (res - 1))
      const cy = Math.round(p[1] * (res - 1))
      const cz = Math.round(p[2] * (res - 1))
      for (let x = Math.max(0, cx - radiusCells); x <= Math.min(res - 1, cx + radiusCells); x++) {
        for (let y = Math.max(0, cy - radiusCells); y <= Math.min(res - 1, cy + radiusCells); y++) {
          for (let z = Math.max(0, cz - radiusCells); z <= Math.min(res - 1, cz + radiusCells); z++) {
            core[idx(x, y, z)] = 1
          }
        }
      }
    }

    const margin = 3
    for (let x = 0; x < res; x++) {
      for (let y = 0; y < res; y++) {
        for (let z = 0; z < res; z++) {
          const id = idx(x, y, z)
          if (core[id]) { opacity[id] = 1; continue }
          let best = Infinity
          for (let dx = -margin; dx <= margin; dx++) {
            for (let dy = -margin; dy <= margin; dy++) {
              for (let dz = -margin; dz <= margin; dz++) {
                const xx = x + dx, yy = y + dy, zz = z + dz
                if (xx < 0 || yy < 0 || zz < 0 || xx >= res || yy >= res || zz >= res) continue
                if (core[idx(xx, yy, zz)]) best = Math.min(best, Math.hypot(dx, dy, dz))
              }
            }
          }
          if (best <= margin) opacity[id] = 1 - best / (margin + 1)
        }
      }
    }

    this.blobCore = core
    this.blobOpacity = opacity
  }

  private sampleBlobOpacity(p: Vec3) {
    if (!this.blobOpacity) return 1
    const res = this.blobRes
    const ix = clamp(Math.round(((p[0] - this.axisMin[0]) / (this.span[0] || 1)) * (res - 1)), 0, res - 1)
    const iy = clamp(Math.round(((p[1] - this.axisMin[1]) / (this.span[1] || 1)) * (res - 1)), 0, res - 1)
    const iz = clamp(Math.round(((p[2] - this.axisMin[2]) / (this.span[2] || 1)) * (res - 1)), 0, res - 1)
    return this.blobOpacity[(ix * res + iy) * res + iz] || 0
  }

  private preIntegrateParticles() {
    const n = this.particles.length / 3
    for (let i = 0; i < n; i++) {
      const base = i * 3
      const p: Vec3 = [this.particles[base], this.particles[base + 1], this.particles[base + 2]]
      const v = this.sampleVelocity(p)
      p[0] += v[0] * 0.02
      p[1] += v[1] * 0.02
      p[2] += v[2] * 0.02
      for (let a = 0; a < 3; a++) {
        const d = p[a] - this.axisMin[a]
        p[a] = this.axisMin[a] + ((d % this.span[a]) + this.span[a]) % this.span[a]
      }
      this.particles.set(p, base)
    }
  }

  // ─────────────────────────────────────────────
  //  Main loop
  // ─────────────────────────────────────────────

  private loop = () => {
    if (this.disposed) return
    const now = performance.now()
    const dt = Math.min(0.05, (now - this.lastTime) / 1000)
    this.lastTime = now
    if (this.settings.flowActive) this.updateParticles()
    if (this.settings.ballFollow) this.updateProbe(dt)
    this.draw()
    this.frames += 1
    if (now - this.fpsLast > 500) {
      const fps = (this.frames * 1000) / (now - this.fpsLast)
      this.frames = 0
      this.fpsLast = now
      this.setStatus((s) => ({ ...s, fps }))
    }
    this.raf = requestAnimationFrame(this.loop)
  }

  private updateParticles() {
    const n = this.particles.length / 3
    const speeds = new Float32Array(n)
    let maxSpeed = 0
    const next = new Float32Array(this.particles.length)
    for (let i = 0; i < n; i++) {
      const base = i * 3
      const p: Vec3 = [this.particles[base], this.particles[base + 1], this.particles[base + 2]]
      const v = this.sampleVelocity(p)
      const speed = length(v)
      speeds[i] = speed
      if (speed > maxSpeed) maxSpeed = speed
      p[0] += v[0] * 0.02 * this.settings.speed
      p[1] += v[1] * 0.02 * this.settings.speed
      p[2] += v[2] * 0.02 * this.settings.speed
      for (let a = 0; a < 3; a++) {
        const d = p[a] - this.axisMin[a]
        p[a] = this.axisMin[a] + ((d % this.span[a]) + this.span[a]) % this.span[a]
      }
      this.ages[i] += 1
      const escaped = this.blobOpacity && this.settings.constrainToPath ? this.sampleBlobOpacity(p) <= 0 : false
      if (this.ages[i] >= 57 || speed < 1e-8 || escaped) {
        this.ages[i] = 0
        p[0] = this.origins[base]
        p[1] = this.origins[base + 1]
        p[2] = this.origins[base + 2]
      }
      next.set(p, base)
    }
    this.particles.set(next)
    maxSpeed = maxSpeed || 1
    for (let i = 0; i < n; i++) {
      const ageFrac = this.ages[i] / 57
      let alpha = 1
      if (ageFrac < 0.1) alpha = ageFrac / 0.1
      else if (ageFrac > 0.8) alpha = (1 - ageFrac) / 0.2
      alpha = clamp(alpha, 0, 1) * this.blobAlpha[i] * this.settings.flowOpacity
      if (this.data.confidence && this.settings.confidenceFade > 0) {
        const p: Vec3 = [this.particles[i * 3], this.particles[i * 3 + 1], this.particles[i * 3 + 2]]
        const conf = this.sampleScalarGrid(this.data.confidence, p)
        const fade = this.settings.confidenceFade / 100
        alpha *= (1 - fade) + fade * conf
      }
      const c = this.settings.flowColorMode === "cluster"
        ? nearestClusterColor(this.data, [this.particles[i * 3], this.particles[i * 3 + 1], this.particles[i * 3 + 2]])
        : turbo(clamp(speeds[i] / maxSpeed, 0, 1))
      this.particleColors.set([c[0], c[1], c[2], alpha], i * 4)
    }
  }

  private updateProbe(_dt: number) {
    const v = this.sampleVelocity(this.probe)
    const speed = length(v)

    // Slow down when outside blob (matches Python's 10% deceleration)
    let dtScale = 0.02 * this.settings.speed
    if (this.blobOpacity && this.sampleBlobOpacity(this.probe) <= 0) {
      dtScale *= 0.1
    }

    this.probe = [
      clamp(this.probe[0] + v[0] * dtScale, this.axisMin[0], this.axisMax[0]),
      clamp(this.probe[1] + v[1] * dtScale, this.axisMin[1], this.axisMax[1]),
      clamp(this.probe[2] + v[2] * dtScale, this.axisMin[2], this.axisMax[2]),
    ]

    // Update trail
    if (speed > 1e-8) {
      this.probeTrail.push([...this.probe] as Vec3)
      if (this.probeTrail.length > this.MAX_TRAIL) this.probeTrail.shift()
    }
  }

  private updateProbeInfo() {
    const nearest = this.nearestPapers(3)
    const pct = this.probe.map((v, i) => Math.round(((v - this.axisMin[i]) / (this.span[i] || 1)) * 100))
    const axes = this.data.axes.map((axis, i) => `${axis.label}: ${pct[i]}%`).join("\n")
    const papers = nearest.map((p) => `- ${p.title}`).join("\n")
    this.setProbeInfo(`${axes}\n\nNearest papers:\n${papers}`)
  }

  private sampleVelocity(p: Vec3): Vec3 {
    const [gx, gy, gz] = this.data.manifest.gridShape
    const nx = clamp((p[0] - this.axisMin[0]) / (this.span[0] || 1), 0, 0.999999) * (gx - 1)
    const ny = clamp((p[1] - this.axisMin[1]) / (this.span[1] || 1), 0, 0.999999) * (gy - 1)
    const nz = clamp((p[2] - this.axisMin[2]) / (this.span[2] || 1), 0, 0.999999) * (gz - 1)
    const x0 = Math.floor(nx), y0 = Math.floor(ny), z0 = Math.floor(nz)
    const x1 = Math.min(x0 + 1, gx - 1), y1 = Math.min(y0 + 1, gy - 1), z1 = Math.min(z0 + 1, gz - 1)
    const tx = nx - x0, ty = ny - y0, tz = nz - z0
    const out: Vec3 = [0, 0, 0]
    for (const [x, wx] of [[x0, 1 - tx], [x1, tx]] as const) {
      for (const [y, wy] of [[y0, 1 - ty], [y1, ty]] as const) {
        for (const [z, wz] of [[z0, 1 - tz], [z1, tz]] as const) {
          const w = wx * wy * wz
          const idx = (((x * gy + y) * gz + z) * 4)
          out[0] += this.data.velocity[idx] * w
          out[1] += this.data.velocity[idx + 1] * w
          out[2] += this.data.velocity[idx + 2] * w
        }
      }
    }
    return out
  }

  private sampleScalarGrid(grid: Float32Array, p: Vec3): number {
    const [gx, gy, gz] = this.data.manifest.gridShape
    const nx = clamp((p[0] - this.axisMin[0]) / (this.span[0] || 1), 0, 0.999999) * (gx - 1)
    const ny = clamp((p[1] - this.axisMin[1]) / (this.span[1] || 1), 0, 0.999999) * (gy - 1)
    const nz = clamp((p[2] - this.axisMin[2]) / (this.span[2] || 1), 0, 0.999999) * (gz - 1)
    const x0 = Math.floor(nx), y0 = Math.floor(ny), z0 = Math.floor(nz)
    const x1 = Math.min(x0 + 1, gx - 1), y1 = Math.min(y0 + 1, gy - 1), z1 = Math.min(z0 + 1, gz - 1)
    const tx = nx - x0, ty = ny - y0, tz = nz - z0
    let out = 0
    for (const [x, wx] of [[x0, 1 - tx], [x1, tx]] as const) {
      for (const [y, wy] of [[y0, 1 - ty], [y1, ty]] as const) {
        for (const [z, wz] of [[z0, 1 - tz], [z1, tz]] as const) {
          out += grid[(x * gy + y) * gz + z] * wx * wy * wz
        }
      }
    }
    return clamp(out, 0, 1)
  }

  // ─────────────────────────────────────────────
  //  Drawing
  // ─────────────────────────────────────────────

  private draw() {
    const gl = this.gl
    resizeCanvas(this.canvas)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0.12, 0.12, 0.12, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)

    const aspect = this.canvas.width / Math.max(1, this.canvas.height)
    const viewProj = this.viewProjection(aspect)
    this.currentViewProj = viewProj

    this.drawAxes(viewProj)
    if (this.settings.flowActive) this.drawParticles(viewProj)
    if (this.settings.showPoints) this.drawPoints(viewProj)
    if (this.settings.showPath) this.drawDataPath(viewProj)
    if (this.settings.showSavedPaths) this.drawSavedPaths(viewProj)
    if (this.settings.showAttractors) this.drawAttractors(viewProj)
    this.drawProbeTrail(viewProj)
    this.drawMarkedPath(viewProj)
    this.drawProbe(viewProj)
    this.drawGizmo(viewProj)
  }

  private drawParticles(viewProj: Float32Array) {
    const gl = this.gl
    const n = this.particles.length / 3
    const scaled = new Float32Array(this.particles.length)
    for (let i = 0; i < n; i++) scaled.set(scalePoint([this.particles[i * 3], this.particles[i * 3 + 1], this.particles[i * 3 + 2]], this.sceneScale), i * 3)
    gl.useProgram(this.particleProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.particleProgram, "u_matrix"), false, viewProj)
    gl.uniform1f(gl.getUniformLocation(this.particleProgram, "u_base_size"), this.settings.particleSize)
    bindAttrib(gl, this.particleProgram, this.particleBuffer, "a_position", scaled, 3, gl.DYNAMIC_DRAW)
    bindAttrib(gl, this.particleProgram, this.particleColorBuffer, "a_color", this.particleColors, 4, gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.POINTS, 0, n)
  }

  private drawPoints(viewProj: Float32Array) {
    const gl = this.gl
    gl.useProgram(this.pointProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.pointProgram, "u_matrix"), false, viewProj)
    gl.uniform1f(gl.getUniformLocation(this.pointProgram, "u_point_size"), 9)
    bindExistingAttrib(gl, this.pointProgram, this.pointBuffer, "a_position", 3)
    bindExistingAttrib(gl, this.pointProgram, this.pointColorBuffer, "a_color", 4)
    gl.drawArrays(gl.POINTS, 0, this.data.papers.length)
  }

  // Probe trail (yellow line showing recent movement)
  private drawProbeTrail(viewProj: Float32Array) {
    if (!this.settings.ballFollow || this.probeTrail.length < 2) return
    const gl = this.gl
    gl.useProgram(this.lineProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, "u_matrix"), false, viewProj)
    gl.uniform4f(gl.getUniformLocation(this.lineProgram, "u_color"), 1, 1, 0, 0.35)
    const arr = new Float32Array(this.probeTrail.flatMap((p) => scalePoint(p, this.sceneScale)))
    bindAttrib(gl, this.lineProgram, this.lineBuffer, "a_position", arr, 3, gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.LINE_STRIP, 0, this.probeTrail.length)
  }

  // Marked path (static orange spline connecting marked control points)
  private drawMarkedPath(viewProj: Float32Array) {
    if (this.marked.length < 2) return
    const gl = this.gl
    gl.useProgram(this.lineProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, "u_matrix"), false, viewProj)
    gl.uniform4f(gl.getUniformLocation(this.lineProgram, "u_color"), 1, 0.5, 0.1, 0.9)
    const spline = catmullRomPath(this.marked, 16)
    const arr = new Float32Array(spline.flatMap((p) => scalePoint(p, this.sceneScale)))
    bindAttrib(gl, this.lineProgram, this.lineBuffer, "a_position", arr, 3, gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.LINE_STRIP, 0, spline.length)

    // Marked control-point dots (white)
    gl.useProgram(this.pointProgram)
    gl.uniform1f(gl.getUniformLocation(this.pointProgram, "u_point_size"), 12)
    const mPos = new Float32Array(this.marked.flatMap((p) => scalePoint(p, this.sceneScale)))
    const mCol = new Float32Array(this.marked.length * 4)
    for (let i = 0; i < this.marked.length; i++) mCol.set([1, 1, 1, 0.95], i * 4)
    bindAttrib(gl, this.pointProgram, this.scratchBuffer, "a_position", mPos, 3, gl.DYNAMIC_DRAW)
    bindAttrib(gl, this.pointProgram, this.scratchColorBuffer, "a_color", mCol, 4, gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.POINTS, 0, this.marked.length)
  }

  // Probe dot (yellow, always on top)
  private drawProbe(viewProj: Float32Array) {
    const gl = this.gl
    gl.useProgram(this.pointProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.disable(gl.DEPTH_TEST)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.pointProgram, "u_matrix"), false, viewProj)
    gl.uniform1f(gl.getUniformLocation(this.pointProgram, "u_point_size"), 15)
    const pos = new Float32Array(scalePoint(this.probe, this.sceneScale))
    const col = new Float32Array([1, 1, 0, 1])
    bindAttrib(gl, this.pointProgram, this.scratchBuffer, "a_position", pos, 3, gl.DYNAMIC_DRAW)
    bindAttrib(gl, this.pointProgram, this.scratchColorBuffer, "a_color", col, 4, gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.POINTS, 0, 1)
    gl.enable(gl.DEPTH_TEST)
  }

  // Data path through papers (spline, per-vertex cluster colors)
  private drawDataPath(viewProj: Float32Array) {
    const spline = this.splineDataPath
    const colors = this.splinePathColors
    if (spline.length < 2 || !colors.length) return
    const gl = this.gl
    const arr = new Float32Array(spline.flatMap((p) => scalePoint(p, this.sceneScale)))
    gl.useProgram(this.coloredLineProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.coloredLineProgram, "u_matrix"), false, viewProj)
    bindAttrib(gl, this.coloredLineProgram, this.coloredLineBuffer, "a_position", arr, 3, gl.DYNAMIC_DRAW)
    bindAttrib(gl, this.coloredLineProgram, this.coloredLineColorBuffer, "a_color", colors, 4, gl.STATIC_DRAW)
    gl.drawArrays(gl.LINE_STRIP, 0, spline.length)
  }

  // Attractor basins: mesh if available, else point cloud fallback
  private drawAttractors(viewProj: Float32Array) {
    const atts = this.data.flowAnalysis.attractors ?? []
    if (!atts.length) return
    const gl = this.gl

    // Hue-cycle colors: one per attractor
    const attColors: [number, number, number][] = atts.map((_, i) => hsv((0.82 + i * 0.19) % 1, 0.78, 1))

    for (let i = 0; i < atts.length; i++) {
      const att = atts[i]
      const isHighlighted = this.highlightedAttractor === i
      const [r, g, b] = attColors[i]
      const meshAlpha = isHighlighted ? 0.80 : 0.55
      const pointAlpha = isHighlighted ? 0.75 : 0.45

      // Prefer mesh rendering when available
      if (att.basin_mesh && att.basin_mesh.vertices.length > 0 && att.basin_mesh.faces.length >= 3) {
        this.drawBasinMesh(viewProj, att.basin_mesh, r, g, b, meshAlpha)
      } else if (att.basin_points && att.basin_points.length > 0) {
        // Fallback: large semi-transparent points
        const basin = att.basin_points
        const values = att.basin_values ?? []
        const positions = new Float32Array(basin.length * 3)
        const colors = new Float32Array(basin.length * 4)
        for (let j = 0; j < basin.length; j++) {
          positions.set(scalePoint(basin[j], this.sceneScale), j * 3)
          const v = clamp(values[j] ?? 0.65, 0.25, 1)
          colors.set([r, g, b, pointAlpha * v], j * 4)
        }
        gl.useProgram(this.particleProgram)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)   // additive — overlapping pts glow
        gl.uniformMatrix4fv(gl.getUniformLocation(this.particleProgram, "u_matrix"), false, viewProj)
        gl.uniform1f(gl.getUniformLocation(this.particleProgram, "u_base_size"), isHighlighted ? 120 : 90)
        bindAttrib(gl, this.particleProgram, this.scratchBuffer, "a_position", positions, 3, gl.DYNAMIC_DRAW)
        bindAttrib(gl, this.particleProgram, this.scratchColorBuffer, "a_color", colors, 4, gl.DYNAMIC_DRAW)
        gl.drawArrays(gl.POINTS, 0, basin.length)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      }

      // Draw attractor core — bright centre dot (depth-test off so it's always visible)
      gl.useProgram(this.pointProgram)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.disable(gl.DEPTH_TEST)
      gl.uniformMatrix4fv(gl.getUniformLocation(this.pointProgram, "u_matrix"), false, viewProj)
      gl.uniform1f(gl.getUniformLocation(this.pointProgram, "u_point_size"), isHighlighted ? 28 : 20)
      const corePos = new Float32Array(scalePoint(att.position, this.sceneScale))
      const coreCol = new Float32Array([r, g, b, 0.98])
      bindAttrib(gl, this.pointProgram, this.scratchBuffer, "a_position", corePos, 3, gl.DYNAMIC_DRAW)
      bindAttrib(gl, this.pointProgram, this.scratchColorBuffer, "a_color", coreCol, 4, gl.DYNAMIC_DRAW)
      gl.drawArrays(gl.POINTS, 0, 1)
      gl.enable(gl.DEPTH_TEST)
    }
  }

  private drawBasinMesh(
    viewProj: Float32Array,
    mesh: BasinMesh,
    r: number, g: number, b: number,
    alpha: number,
  ) {
    const gl = this.gl
    if (!mesh.vertices.length || mesh.faces.length < 3) return

    // Upload vertices (scaled to scene space)
    const vertData = new Float32Array(mesh.vertices.length * 3)
    for (let i = 0; i < mesh.vertices.length; i++) {
      vertData.set(scalePoint(mesh.vertices[i], this.sceneScale), i * 3)
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.meshVertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW)

    // Upload face indices
    const faceData = new Uint32Array(mesh.faces)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.meshIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faceData, gl.DYNAMIC_DRAW)

    gl.useProgram(this.meshProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.disable(gl.CULL_FACE)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.meshProgram, "u_matrix"), false, viewProj)
    gl.uniform4f(gl.getUniformLocation(this.meshProgram, "u_color"), r, g, b, alpha)

    const posLoc = gl.getAttribLocation(this.meshProgram, "a_position")
    if (posLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.meshVertexBuffer)
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.meshIndexBuffer)
    gl.drawElements(gl.TRIANGLES, mesh.faces.length, gl.UNSIGNED_INT, 0)
  }

  private drawAxes(viewProj: Float32Array) {
    const center = this.dataCenter
    const axes: [Vec3, Vec3, Vec3][] = [
      [[this.axisMin[0], center[1], center[2]], [this.axisMax[0], center[1], center[2]], [1, 0.25, 0.25]],
      [[center[0], this.axisMin[1], center[2]], [center[0], this.axisMax[1], center[2]], [0.35, 1, 0.35]],
      [[center[0], center[1], this.axisMin[2]], [center[0], center[1], this.axisMax[2]], [0.35, 0.55, 1]],
    ]
    const gl = this.gl
    gl.useProgram(this.lineProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, "u_matrix"), false, viewProj)
    for (const [a, b, color] of axes) {
      gl.uniform4f(gl.getUniformLocation(this.lineProgram, "u_color"), color[0], color[1], color[2], 0.45)
      bindAttrib(gl, this.lineProgram, this.lineBuffer, "a_position", new Float32Array([...scalePoint(a, this.sceneScale), ...scalePoint(b, this.sceneScale)]), 3, gl.DYNAMIC_DRAW)
      gl.drawArrays(gl.LINES, 0, 2)
    }
  }

  private drawSavedPaths(viewProj: Float32Array) {
    const paths = this.data.flowAnalysis.saved_paths ?? []
    if (!paths.length) return
    const gl = this.gl
    gl.useProgram(this.lineProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, "u_matrix"), false, viewProj)
    for (let i = 0; i < paths.length; i++) {
      const cps = paths[i].control_points ?? []
      if (cps.length < 2) continue
      const src = catmullRomPath(cps, 16)
      const arr = new Float32Array(src.flatMap((p) => scalePoint(p, this.sceneScale)))
      const hue = (i * 0.17) % 1
      const color = hsv(hue, 0.85, 1)
      gl.uniform4f(gl.getUniformLocation(this.lineProgram, "u_color"), color[0], color[1] * 0.65, color[2] * 0.35, 0.58)
      bindAttrib(gl, this.lineProgram, this.lineBuffer, "a_position", arr, 3, gl.DYNAMIC_DRAW)
      gl.drawArrays(gl.LINE_STRIP, 0, src.length)
    }
  }

  // 3D probe gizmo (X/Y/Z axis arrows)
  private drawGizmo(viewProj: Float32Array) {
    if (!this.gizmoVisible) return
    const gl = this.gl

    // Arrow colors: X=red, Y=green, Z=blue
    const gizmoColors: [number, number, number][] = [
      [1, 0.2, 0.2],
      [0.2, 1, 0.2],
      [0.3, 0.5, 1],
    ]
    const headFrac = 0.18
    const spreadFrac = 0.10
    // Perpendicular directions for arrowheads
    const perps: [Vec3, Vec3][] = [
      [[0, 1, 0], [0, 0, 1]],
      [[1, 0, 0], [0, 0, 1]],
      [[1, 0, 0], [0, 1, 0]],
    ]

    gl.useProgram(this.lineProgram)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.disable(gl.DEPTH_TEST)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, "u_matrix"), false, viewProj)

    const AL = this.gizmoArrowLen

    for (let i = 0; i < 3; i++) {
      const isActive = this.gizmoDragging === i
      const alpha = this.gizmoDragging !== null && !isActive ? 0.25 : 0.92
      const [r, g, b] = gizmoColors[i]
      gl.uniform4f(gl.getUniformLocation(this.lineProgram, "u_color"), r, g, b, alpha)

      const tip: Vec3 = [...this.probe] as Vec3
      tip[i] += AL

      // Shaft
      const shaftArr = new Float32Array([
        ...scalePoint(this.probe, this.sceneScale),
        ...scalePoint(tip, this.sceneScale),
      ])
      bindAttrib(gl, this.lineProgram, this.lineBuffer, "a_position", shaftArr, 3, gl.DYNAMIC_DRAW)
      gl.drawArrays(gl.LINES, 0, 2)

      // Arrowhead (4 barbs)
      const back: Vec3 = [...tip] as Vec3
      back[i] = tip[i] - AL * headFrac
      const sp = AL * spreadFrac
      const [p1, p2] = perps[i]
      const barbs: Vec3[] = [
        [back[0] + p1[0] * sp, back[1] + p1[1] * sp, back[2] + p1[2] * sp],
        [back[0] - p1[0] * sp, back[1] - p1[1] * sp, back[2] - p1[2] * sp],
        [back[0] + p2[0] * sp, back[1] + p2[1] * sp, back[2] + p2[2] * sp],
        [back[0] - p2[0] * sp, back[1] - p2[1] * sp, back[2] - p2[2] * sp],
      ]
      const tipSc = scalePoint(tip, this.sceneScale)
      const headArr = new Float32Array(barbs.flatMap((barb) => [...tipSc, ...scalePoint(barb, this.sceneScale)]))
      bindAttrib(gl, this.lineProgram, this.lineBuffer, "a_position", headArr, 3, gl.DYNAMIC_DRAW)
      gl.drawArrays(gl.LINES, 0, barbs.length * 2)
    }

    gl.enable(gl.DEPTH_TEST)
  }

  private viewProjection(aspect: number) {
    const az = (this.azimuth * Math.PI) / 180
    const el = (this.elevation * Math.PI) / 180
    const center = scalePoint(this.dataCenter, this.sceneScale)
    const eye: Vec3 = [
      center[0] + this.distance * Math.sin(az) * Math.cos(el),
      center[1] + this.distance * Math.sin(el),
      center[2] + this.distance * Math.cos(az) * Math.cos(el),
    ]
    const proj = perspective((60 * Math.PI) / 180, aspect, 0.01, 200)
    const view = lookAt(eye, center, [0, 1, 0])
    return multiply(proj, view)
  }

  private pickNearestScreenPoint(x: number, y: number) {
    let best = 0
    let bestD = Infinity
    for (const paper of this.data.papers) {
      const d = Math.abs((paper.projected3d[0] - this.axisMin[0]) / (this.span[0] || 1) - x)
        + Math.abs((paper.projected3d[1] - this.axisMin[1]) / (this.span[1] || 1) - (1 - y))
      if (d < bestD) {
        bestD = d
        best = paper.id
      }
    }
    this.focusPaper(best)
  }
}

// ─────────────────────────────────────────────
//  React components
// ─────────────────────────────────────────────

function Metric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="inline-flex h-10 items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 text-xs text-white/70">
      {icon}
      <span className="font-mono">{value}</span>
    </div>
  )
}

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function TextButton({ label, secondary, onClick }: { label: string; secondary?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 w-full rounded px-3 text-sm transition-colors ${
        secondary ? "bg-[#555] text-white hover:bg-[#777]" : "bg-[#FF6B35] text-white hover:bg-[#FF8555]"
      }`}
    >
      {label}
    </button>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex h-9 items-center justify-between gap-3 rounded border border-white/10 bg-white/[0.035] px-3 text-sm text-white/70">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#FF6B35]" />
    </label>
  )
}

function SliderRow({ label, min, max, step, value, suffix = "", disabled = false, onChange }: { label: string; min: number; max: number; step: number; value: number; suffix?: string; disabled?: boolean; onChange: (value: number) => void }) {
  return (
    <label className={`grid grid-cols-[112px_minmax(0,1fr)_52px] items-center gap-3 text-sm ${disabled ? "text-white/35" : "text-white/65"}`}>
      <span className="truncate" title={label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} className="h-2 accent-[#FF6B35] disabled:opacity-35" />
      <span className="text-right font-mono text-xs text-white/50">{value.toFixed(value < 1 ? 2 : 0)}{suffix}</span>
    </label>
  )
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <label className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-3 text-sm text-white/65">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded border border-white/10 bg-[#1E1E1E] px-2 text-white outline-none">
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  )
}

function ProbeSliders({ renderer, labels }: { renderer: TraceScopeRenderer | null; labels?: string[] }) {
  const [values, setValues] = useState([50, 50, 50])
  const set = (axis: number, value: number) => {
    setValues((current) => current.map((v, i) => (i === axis ? value : v)))
    renderer?.setProbeAxis(axis, value)
  }
  const axisLabels = labels?.length === 3 ? labels : ["X", "Y", "Z"]
  return (
    <div className="space-y-2">
      {axisLabels.map((label, axis) => (
        <SliderRow key={label} label={label} min={0} max={100} step={1} value={values[axis]} onChange={(value) => set(axis, value)} />
      ))}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <section className="max-h-[78vh] w-full max-w-2xl overflow-auto rounded-md border border-[#FF6B35]/35 bg-[#252525] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/15 bg-white/5 text-white hover:bg-white/10" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────
//  OpenAI BYOK
// ─────────────────────────────────────────────

async function explainWithUserKey(key: string, data: TraceScopeData, trajectory: Vec3[], nearestPapers: unknown[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You explain TraceScope probe paths through a 3D semantic map of recent AI papers. Be concise and concrete." },
        {
          role: "user",
          content: JSON.stringify({
            axes: data.axes.map((a) => a.label),
            clusters: data.clusters.map((c) => c.label),
            trajectory,
            nearestPapers,
          }),
        },
      ],
      max_tokens: 500,
    }),
  })
  if (!response.ok) return `OpenAI request failed: ${response.status}`
  const body = await response.json()
  return body?.choices?.[0]?.message?.content ?? "No explanation returned."
}

// ─────────────────────────────────────────────
//  WebGL helpers
// ─────────────────────────────────────────────

function makeProgram(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vert)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag)
  const program = gl.createProgram()
  if (!program) throw new Error("Unable to create WebGL program")
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Program link failed")
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  return program
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error("Unable to create WebGL shader")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed")
  return shader
}

function mustBuffer(gl: WebGL2RenderingContext) {
  const buffer = gl.createBuffer()
  if (!buffer) throw new Error("Unable to create WebGL buffer")
  return buffer
}

function bindAttrib(gl: WebGL2RenderingContext, program: WebGLProgram, buffer: WebGLBuffer, name: string, data: Float32Array, size: number, usage: number) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, usage)
  bindExistingAttrib(gl, program, buffer, name, size)
}

function bindExistingAttrib(gl: WebGL2RenderingContext, program: WebGLProgram, buffer: WebGLBuffer, name: string, size: number) {
  const loc = gl.getAttribLocation(program, name)
  if (loc < 0) return
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
}

function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
  const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
}

// ─────────────────────────────────────────────
//  Math helpers
// ─────────────────────────────────────────────

function meanPathDistance(a: Vec3[], b: Vec3[]) {
  const n = Math.min(a.length, b.length)
  if (!n) return Infinity
  let sum = 0
  for (let i = 0; i < n; i++) sum += length(sub(a[i], b[Math.floor((i / Math.max(1, n - 1)) * (b.length - 1))]))
  return sum / n
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function mul(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s]
}

function length(a: Vec3) {
  return Math.hypot(a[0], a[1], a[2])
}

function normalize(a: Vec3): Vec3 {
  const l = length(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function scalePoint(p: Vec3, s: number): Vec3 {
  return [p[0] * s, p[1] * s, p[2] * s]
}

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2)
  const nf = 1 / (near - far)
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ])
}

function lookAt(eye: Vec3, center: Vec3, up: Vec3) {
  const z = normalize(sub(eye, center))
  const x = normalize(cross(up, z))
  const y = cross(z, x)
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ])
}

function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      out[i * 4 + j] = b[i * 4 + 0] * a[0 * 4 + j] + b[i * 4 + 1] * a[1 * 4 + j] + b[i * 4 + 2] * a[2 * 4 + j] + b[i * 4 + 3] * a[3 * 4 + j]
    }
  }
  return out
}

function turbo(t: number): Vec3 {
  const r = (34.61 + t * (1172.33 + t * (-10793.56 + t * (33300.12 + t * (-38345.17 + 14829.8 * t))))) / 255
  const g = (23.31 + t * (557.33 + t * (1225.33 + t * (-3574.96 + t * 2199.29)))) / 255
  const b = (27.2 + t * (3211.1 + t * (-15327.97 + t * (34592.87 + t * (-30538.66 + 9347.97 * t))))) / 255
  return [clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1)]
}

function rgb(color: Vec3) {
  return `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`
}

// IDW-blended cluster color for smooth continuous coloring
function nearestClusterColor(data: TraceScopeData, p: Vec3): Vec3 {
  if (!data.clusters.length) return [1, 0.35, 0.1]
  if (data.clusters.length === 1) return data.clusters[0].color

  // Collect distances to all cluster centroids
  const K = Math.min(data.clusters.length, 4)
  const entries = data.clusters
    .map((c) => ({ color: c.color, d: length(sub(c.centroid3d, p)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, K)

  // Exactly on a centroid → return its color directly
  if (entries[0].d < 1e-8) return entries[0].color

  // Inverse square distance weighting
  const rgb: Vec3 = [0, 0, 0]
  let totalW = 0
  for (const e of entries) {
    const w = 1 / (e.d * e.d)
    rgb[0] += e.color[0] * w
    rgb[1] += e.color[1] * w
    rgb[2] += e.color[2] * w
    totalW += w
  }
  return [rgb[0] / totalW, rgb[1] / totalW, rgb[2] / totalW]
}

function hsv(h: number, s: number, v: number): Vec3 {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0: return [v, t, p]
    case 1: return [q, v, p]
    case 2: return [p, v, t]
    case 3: return [p, q, v]
    case 4: return [t, p, v]
    default: return [v, p, q]
  }
}

function catmullRomPath(points: Vec3[], samplesPerSegment: number) {
  if (points.length < 2) return points
  const out: Vec3[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment
      const t2 = t * t
      const t3 = t2 * t
      const a = -0.5 * t3 + t2 - 0.5 * t
      const b = 1.5 * t3 - 2.5 * t2 + 1
      const c = -1.5 * t3 + 2 * t2 + 0.5 * t
      const d = 0.5 * t3 - 0.5 * t2
      out.push([
        a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
        a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
        a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2],
      ])
    }
  }
  out.push(points[points.length - 1])
  return out
}
