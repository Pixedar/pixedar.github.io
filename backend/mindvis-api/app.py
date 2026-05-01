import json
import os
import sys
from functools import lru_cache
from pathlib import Path
from typing import Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


FieldMode = Literal["mean", "gated", "mu1", "mu2"]


class TrajectoryRequest(BaseModel):
    seed: list[float] = Field(default_factory=lambda: [0.5, 0.5, 0.5], min_length=3, max_length=3)
    fieldMode: FieldMode = "gated"
    steps: int = Field(default=220, ge=8, le=1200)
    dt: float = Field(default=0.018, gt=0, le=0.1)
    speedScale: float = Field(default=0.48, gt=0, le=4)


class ExplainRequest(BaseModel):
    trajectory: list[list[float]] = Field(min_length=2)
    fieldMode: FieldMode = "gated"
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

    from src.field_loader import TriLinearSampler, load_field
    from src.roi_flow import ManifoldToROIKNN, ROIFlowAnalyzer

    data = repo / "data"
    flow = load_field(data / "roi_flow" / "mdn_universal_raw_grid64_meta.json")
    mean = flow["mean"]
    mu1 = flow["mus"][0]
    mu2 = flow["mus"][1]
    pi = flow["pi"]
    gated = np.where(np.argmax(pi, axis=-1)[..., None] == 0, mu1, mu2).astype(np.float32)

    samplers = {
        "mean": TriLinearSampler(mean, flow["amin"], flow["amax"]),
        "gated": TriLinearSampler(gated, flow["amin"], flow["amax"]),
        "mu1": TriLinearSampler(mu1, flow["amin"], flow["amax"]),
        "mu2": TriLinearSampler(mu2, flow["amin"], flow["amax"]),
    }

    embed = np.load(data / "roi_flow" / "probe_embed.npy").astype(np.float32)
    roi = np.load(data / "roi_flow" / "probe_roi.npy").astype(np.float32)
    centers = np.load(data / "roi_flow" / "probe_roi_centers.npy").astype(np.float32)
    structures = json.loads((data / "structures.json").read_text(encoding="utf-8"))

    names = []
    for idx in range(roi.shape[1]):
        item = structures[idx] if idx < len(structures) else {}
        names.append(item.get("name") or item.get("acronym") or f"ROI {idx + 1}")

    mapper = ManifoldToROIKNN(embed, roi, k=256)
    analyzer = ROIFlowAnalyzer(names, centers[: len(names)])

    return {
        "amin": flow["amin"],
        "amax": flow["amax"],
        "span": flow["amax"] - flow["amin"],
        "samplers": samplers,
        "mapper": mapper,
        "analyzer": analyzer,
    }


app = FastAPI(title="MindVisualizer API", version="0.1.0")

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
    path = integrate_path(req.seed, req.fieldMode, req.steps, req.dt, req.speedScale)
    return {
        "fieldMode": req.fieldMode,
        "trajectory": normalized(path, svc["amin"], svc["span"]).tolist(),
    }


@app.post("/api/mindvis/explain")
def explain(req: ExplainRequest):
    svc = services()
    traj = np.asarray(req.trajectory, dtype=np.float32)
    if traj.ndim != 2 or traj.shape[1] != 3:
        raise HTTPException(status_code=400, detail="trajectory must be an array of [x,y,z] points")

    world = denormalized(np.clip(traj, 0.0, 1.0), svc["amin"], svc["span"])
    mapper = svc["mapper"]
    analyzer = svc["analyzer"]
    start_roi = mapper.query(world[0])
    end_roi = mapper.query(world[-1])
    delta = analyzer.compute_delta(start_roi, end_roi)
    context = analyzer.build_llm_context(delta)

    text = ""
    if req.callLlm and os.environ.get("OPENAI_API_KEY"):
        text = call_openai_interpreter(context)

    if not text:
        analysis = analyzer.analyze_flow_pattern(delta)
        text = (
            f"Pattern: {analysis['pattern_type']}. "
            f"Bulk direction: {analysis['bulk_direction']}. "
            f"Positive ROIs: {analysis['n_significant_positive']}; "
            f"negative ROIs: {analysis['n_significant_negative']}."
        )

    return {"text": text, "context": context}


def integrate_path(seed: list[float], field_mode: FieldMode, steps: int, dt: float, speed_scale: float) -> np.ndarray:
    svc = services()
    p = denormalized(np.asarray(seed[:3], dtype=np.float32)[None, :], svc["amin"], svc["span"])
    sampler = svc["samplers"][field_mode]
    path = np.empty((steps, 3), dtype=np.float32)

    for idx in range(steps):
        path[idx] = p[0]
        v = sampler.sample_vec(p)
        p = p + v * (dt * speed_scale)
        p = ((p - svc["amin"]) % svc["span"]) + svc["amin"]

    return path


def denormalized(points: np.ndarray, amin: np.ndarray, span: np.ndarray) -> np.ndarray:
    return points.astype(np.float32) * span[None, :] + amin[None, :]


def normalized(points: np.ndarray, amin: np.ndarray, span: np.ndarray) -> np.ndarray:
    return (points.astype(np.float32) - amin[None, :]) / span[None, :]


def call_openai_interpreter(context: str) -> str:
    from openai import OpenAI

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    instructions = (
        "You are a neuroscientist interpreting brain state dynamics from a "
        "manifold flow simulation. The user traced a path through a learned "
        "neural manifold. You are given how each ROI's contribution changed "
        "along this path.\n\n"
        "The delta values do not mean simple activation. They measure how each "
        "ROI's contribution to the overall brain state shifted. Positive means "
        "the region became a stronger contributor; negative means it became a "
        "weaker contributor.\n\n"
        "Do not list every ROI. Synthesize the spatial pattern, directionality, "
        "and network shift into one coherent interpretation. Keep the response "
        "to 2 concise paragraphs."
    )

    try:
        client = OpenAI(timeout=60.0)
        if hasattr(client, "responses"):
            response = client.responses.create(
                model=model,
                instructions=instructions,
                input=context,
                max_output_tokens=900,
            )
            return (response.output_text or "").strip()

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": instructions},
                {"role": "user", "content": context},
            ],
            max_tokens=900,
            temperature=0.3,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as exc:
        return f"[GPT ERROR] {exc}"
