"""TraceScope web-demo explanation API for Hugging Face Spaces.

The important bit: this service reuses the real TraceScope Python code paths.
It loads an AnalysisResult cache, converts browser probe coordinates with
tracescope.visualization.probe.probe_point(), and asks
SemanticExplainer.explain_probe_multi() to build/call the same path prompt used
by the native renderer.
"""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from tracescope.analysis.explainer import SemanticExplainer
from tracescope.models.analysis import AnalysisResult
from tracescope.providers.llm import OpenAILLM
from tracescope.storage.cache import LLMResponseCache
from tracescope.visualization.probe import probe_point


ALLOWED_ORIGINS = [
    "https://pixedar.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CACHE_DIR = Path(os.environ.get("TRACESCOPE_CACHE_DIR", "/tmp/tracescope-api-cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)
RESULT_CACHE = os.environ.get("TRACESCOPE_RESULT_CACHE", "/app/cache/latest")

app = FastAPI(title="TraceScope Explain API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class ExplainRequest(BaseModel):
    trajectory: list[list[float]]
    scoreContext: list[dict[str, float]] | None = None


_RESULT: AnalysisResult | None = None
_EXPLAINER: SemanticExplainer | None = None


def _load_result() -> AnalysisResult:
    global _RESULT
    if _RESULT is None:
        _RESULT = AnalysisResult.load_result(RESULT_CACHE)
    return _RESULT


def _load_explainer() -> SemanticExplainer:
    global _EXPLAINER
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=429, detail={"error": "budget_exhausted"})
    if _EXPLAINER is None:
        llm = OpenAILLM(
            api_key=key,
            model=os.environ.get("TRACESCOPE_OPENAI_MODEL", "gpt-5"),
        )
        cache = LLMResponseCache(str(CACHE_DIR / "llm_cache.db"), enabled=True)
        _EXPLAINER = SemanticExplainer(llm, cache)
    return _EXPLAINER


def _cache_key(payload: dict[str, Any]) -> Path:
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
    return CACHE_DIR / f"{digest}.json"


def _budget_available() -> bool:
    """Simple daily request cap, useful for free demo deployment."""
    limit = int(os.environ.get("TRACESCOPE_DAILY_REQUEST_LIMIT", "60"))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    counter_path = CACHE_DIR / f"counter-{today}.txt"
    try:
        current = int(counter_path.read_text()) if counter_path.exists() else 0
    except Exception:
        current = 0
    if current >= limit:
        return False
    counter_path.write_text(str(current + 1))
    return True


def _client_budget_available(request: Request) -> bool:
    """Very small abuse guard: one uncached free explanation per client/day by default.

    This is intentionally crude for a public demo. It uses forwarded IP where
    available plus User-Agent, hashes it, and counts only uncached backend LLM
    calls. Cached responses stay free because they do not spend API tokens.
    """
    limit = int(os.environ.get("TRACESCOPE_FREE_EXPLAINS_PER_CLIENT", "1"))
    if limit <= 0:
        return False

    forwarded_for = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    host = forwarded_for or (request.client.host if request.client else "unknown")
    user_agent = request.headers.get("user-agent", "unknown")[:180]
    client_hash = hashlib.sha256(f"{host}|{user_agent}".encode("utf-8")).hexdigest()[:16]

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    counter_path = CACHE_DIR / f"client-{today}-{client_hash}.txt"
    try:
        current = int(counter_path.read_text()) if counter_path.exists() else 0
    except Exception:
        current = 0
    if current >= limit:
        return False
    counter_path.write_text(str(current + 1))
    return True


@app.get("/health")
def health() -> dict[str, Any]:
    npz = Path(RESULT_CACHE + ".npz")
    js = Path(RESULT_CACHE + ".json")
    return {
        "ok": True,
        "hasKey": bool(os.environ.get("OPENAI_API_KEY")),
        "resultCache": RESULT_CACHE,
        "hasResultCache": npz.exists() and js.exists(),
    }


@app.post("/explain")
async def explain(req: ExplainRequest, request: Request) -> dict[str, str]:
    payload = req.model_dump()
    path = _cache_key(payload)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))

    # Validate server key before consuming any client/daily quota counters.
    result = _load_result()
    explainer = _load_explainer()
    axis_labels = result.axis_info.labels

    if not _client_budget_available(request):
        raise HTTPException(status_code=429, detail={"error": "client_free_limit_exhausted"})

    if not _budget_available():
        raise HTTPException(status_code=429, detail={"error": "budget_exhausted"})

    control_points = []
    for point in req.trajectory:
        if len(point) != 3:
            continue
        info = probe_point(result, float(point[0]), float(point[1]), float(point[2]))
        control_points.append(
            {
                "axis_pcts": [int(v) for v in info["axis_percentages"].values()],
                "cluster_distances": [
                    (name, int(round(float(pct))))
                    for name, pct in info["cluster_distances"].items()
                ],
            }
        )

    if not control_points:
        raise HTTPException(status_code=400, detail={"error": "empty_trajectory"})

    try:
        if len(control_points) == 1:
            text = explainer.explain_probe_single(
                axis_labels=axis_labels,
                slider_pcts=control_points[0]["axis_pcts"],
                cluster_distances=control_points[0]["cluster_distances"],
            )
        else:
            text = explainer.explain_probe_multi(
                axis_labels=axis_labels,
                control_points=control_points,
                score_context=req.scoreContext,
            )
    except Exception as exc:
        msg = str(exc).lower()
        if any(token in msg for token in ["quota", "rate limit", "429", "insufficient_quota", "billing"]):
            raise HTTPException(status_code=429, detail={"error": "openai_budget_exhausted"}) from exc
        raise HTTPException(status_code=502, detail={"error": "llm_explanation_failed"}) from exc

    result = {"text": text}
    path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return result
