import os
import sys
from functools import lru_cache
from pathlib import Path
from typing import Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


FieldMode = Literal["mean", "gated", "mu1", "mu2", "mu3", "mu4", "mu5", "mu6"]


class TrajectoryRequest(BaseModel):
    seed: list[float] = Field(default_factory=lambda: [0.5, 0.5, 0.5], min_length=3, max_length=3)
    fieldMode: FieldMode = "mean"
    steps: int = Field(default=700, ge=8, le=1600)
    dt: float = Field(default=1.0, gt=0, le=8.0)
    speedScale: float = Field(default=1.0, gt=0, le=8.0)


class ExplainRequest(BaseModel):
    trajectory: list[list[float]] = Field(min_length=2)
    fieldMode: FieldMode = "mean"
    callLlm: bool = True


def mindvis_repo() -> Path:
    repo = Path(os.environ.get("MINDVIS_REPO", "/app/mindVisualizer")).resolve()
    if not repo.exists():
        raise RuntimeError(f"MINDVIS_REPO does not exist: {repo}")
    if str(repo) not in sys.path:
        sys.path.insert(0, str(repo))
    return repo


@lru_cache(maxsize=1)
def services():
    repo = mindvis_repo()
    data = repo / "data"

    from src.field_loader import TriLinearSampler, load_field
    from src.mesh_overlay import FlowMeshOverlay

    flow = load_field(data / "mdn" / "mdn_particles_rdcim_teacher_edge_hq_grid125_meta.json")
    mean = flow["mean"]
    mus = flow["mus"]
    pi = flow["pi"]
    ent = flow["ENT"]
    amin = flow["amin"]
    amax = flow["amax"]
    span = amax - amin
    diag = float(np.linalg.norm(span))
    target_step = 0.01 * max(diag, 1e-6)

    winner = np.argmax(pi, axis=-1)
    gated = np.zeros_like(mean, dtype=np.float32)
    for idx, mu in enumerate(mus):
        gated += mu * (winner[..., None] == idx).astype(np.float32)

    fields = {"mean": mean, "gated": gated}
    fields.update({f"mu{idx + 1}": mu for idx, mu in enumerate(mus)})
    samplers = {name: TriLinearSampler(field, amin, amax) for name, field in fields.items()}

    def vmax(field):
        mag = np.linalg.norm(field.reshape(-1, 3), axis=1)
        nz = mag[mag > 0]
        return float(np.percentile(nz, 100.0)) if nz.size else 1.0

    vmax_by_name = {name: vmax(field) for name, field in fields.items()}

    # The original Python app uses FlowMeshOverlay + its cached label grid for
    # probe interpretation. This API intentionally reuses that path.
    import vtk

    ren = vtk.vtkRenderer()
    win = vtk.vtkRenderWindow()
    win.OffScreenRenderingOn()
    win.AddRenderer(ren)
    mesh = FlowMeshOverlay(ren=ren, win=win, mesh_dir=data / "meshes", alignment_file=data / "brain_alignment.json")
    cache = data / "label_grid_cache.npz"
    if not mesh.load_label_grid(cache):
        raise RuntimeError("Python label_grid_cache is missing; run setup_brain_data.py in mindVisualizer first.")

    # Optional finer parcellation, exactly as the desktop flow mode auto-detects.
    try:
        from src.extra_parcellation import ExtraParcellation

        atlas = data / "extra_parcellation" / "combined_atlas.nii.gz"
        labels = data / "extra_parcellation" / "combined_atlas_labels.json"
        if atlas.exists():
            extra = ExtraParcellation(atlas, labels if labels.exists() else None)
            if extra.load():
                mesh.set_extra_parcellation(extra)
    except Exception as exc:
        print(f"[extra-parcellation] disabled: {exc}")

    ent_sampler = TriLinearSampler(mean, amin, amax) if ent is not None else None

    return {
        "amin": amin,
        "amax": amax,
        "span": span,
        "samplers": samplers,
        "vmax": vmax_by_name,
        "target_step": target_step,
        "mesh": mesh,
        "entropy": ent,
        "entropy_sampler": ent_sampler,
    }


app = FastAPI(title="MindVisualizer API", version="1.0.0")

origins = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    try:
        svc = services()
        return {"ok": True, "fieldMin": svc["amin"].tolist(), "fieldMax": svc["amax"].tolist()}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/api/mindvis/trajectory")
def trajectory(req: TrajectoryRequest):
    svc = services()
    world, mags, stopped = integrate_probe(req, svc)
    transitions = analyze_regions(world, mags, req.callLlm if hasattr(req, "callLlm") else False)
    return {
        "fieldMode": req.fieldMode,
        "trajectory": normalized(world, svc["amin"], svc["span"]).tolist(),
        "worldTrajectory": world.tolist(),
        "fieldMagnitudes": mags.tolist(),
        "stopped": stopped,
        "transitions": transitions,
        "regionText": format_transition_text(transitions),
    }


@app.post("/api/mindvis/explain")
def explain(req: ExplainRequest):
    svc = services()
    traj = np.asarray(req.trajectory, dtype=np.float32)
    if traj.ndim != 2 or traj.shape[1] != 3:
        raise HTTPException(status_code=400, detail="trajectory must be an array of [x,y,z] points")

    world = denormalized(np.clip(traj, 0.0, 1.0), svc["amin"], svc["span"])
    sampler = svc["samplers"].get(req.fieldMode, svc["samplers"]["mean"])
    mags = np.linalg.norm(sampler.sample_vec(world), axis=1).astype(np.float32)
    transitions = analyze_regions(world, mags, req.callLlm)
    text = format_transition_text(transitions)

    if req.callLlm:
        from src.region_analyzer import analyze_with_gpt

        text = analyze_with_gpt(
            transitions,
            use_rag=os.environ.get("MINDVIS_USE_RAG", "0") == "1",
            model=os.environ.get("OPENAI_MODEL", "gpt-5.4-mini"),
            debug=os.environ.get("MINDVIS_DEBUG", "0") == "1",
        )

    return {"text": text, "transitions": transitions, "regionText": format_transition_text(transitions)}


def integrate_probe(req: TrajectoryRequest, svc: dict) -> tuple[np.ndarray, np.ndarray, bool]:
    p = denormalized(np.asarray(req.seed[:3], dtype=np.float32)[None, :], svc["amin"], svc["span"])
    sampler = svc["samplers"].get(req.fieldMode, svc["samplers"]["mean"])
    step = req.dt * req.speedScale * (svc["target_step"] / max(svc["vmax"].get(req.fieldMode, 1.0), 1e-9))
    path = []
    mags = []
    stopped = False

    for _ in range(req.steps):
        path.append(p[0].copy())
        velocity = sampler.sample_vec(p)[0]
        mags.append(float(np.linalg.norm(velocity)))
        new_pos = np.clip(p[0] + velocity * step, svc["amin"], svc["amax"])

        # Original probe boundary behavior: if a step leaves labelled brain
        # space, try half-step; otherwise stop instead of wrapping.
        if not is_valid_probe_position(new_pos, svc["mesh"]):
            half = np.clip(p[0] + velocity * step * 0.5, svc["amin"], svc["amax"])
            if is_valid_probe_position(half, svc["mesh"]):
                new_pos = half
            else:
                stopped = True
                break

        if np.linalg.norm(new_pos - p[0]) < 1e-5:
            stopped = True
            break
        p[0] = new_pos.astype(np.float32)

    return np.asarray(path, dtype=np.float32), np.asarray(mags, dtype=np.float32), stopped


def is_valid_probe_position(point: np.ndarray, mesh) -> bool:
    key = mesh.get_region_at_point(point)
    if key is None:
        key = mesh.find_nearest_region(point, search_radius=2, max_distance_mm=5.0)
    return key is not None


def analyze_regions(world: np.ndarray, mags: np.ndarray, call_llm: bool) -> list[dict]:
    svc = services()
    from src.region_analyzer import analyze_probe_path

    transitions = analyze_probe_path(
        world,
        svc["mesh"],
        sample_every=5,
        field_mags=mags,
        entropy_sampler=svc["entropy_sampler"],
        entropy_field=svc["entropy"],
    )
    return make_json_safe(transitions)


def format_transition_text(transitions: list[dict]) -> str:
    from src.region_analyzer import format_transitions_text

    return format_transitions_text(transitions)


def denormalized(points: np.ndarray, amin: np.ndarray, span: np.ndarray) -> np.ndarray:
    return points.astype(np.float32) * span[None, :] + amin[None, :]


def normalized(points: np.ndarray, amin: np.ndarray, span: np.ndarray) -> np.ndarray:
    return (points.astype(np.float32) - amin[None, :]) / span[None, :]


def make_json_safe(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {str(k): make_json_safe(v) for k, v in value.items() if not str(k).startswith("_")}
    if isinstance(value, list):
        return [make_json_safe(v) for v in value]
    if isinstance(value, tuple):
        return [make_json_safe(v) for v in value]
    return value
