---
title: MindVisualizer API
sdk: docker
app_port: 7860
pinned: false
---

# MindVisualizer Python API

Small FastAPI adapter for the hosted web page.

The GitHub Pages frontend renders particles locally. This backend is only for algorithm-sensitive operations:

- recomputing probe trajectories with the original Python `TriLinearSampler`
- mapping a trajectory to ROI vectors with the original `ManifoldToROIKNN`
- building the original `ROIFlowAnalyzer` context
- optionally calling the original `ROIFlowLLM` if `OPENAI_API_KEY` is configured

## Cheapest hosting shape

Use a free Python container host and keep the service public:

1. Bundle the minimal `mindVisualizer` source/data folder into the Space as `/app/mindVisualizer`.
2. Deploy this directory as a Docker/FastAPI service.
3. Set `MINDVIS_REPO=/app/mindVisualizer`.
4. Set `CORS_ORIGINS=https://pixedar.github.io,http://localhost:3000`.
5. In the GitHub Pages build, set `NEXT_PUBLIC_MINDVIS_API_URL=https://your-backend-url`.
6. Optional: set `OPENAI_API_KEY` as a Space secret and `OPENAI_MODEL` as a Space variable.

Current Space:

- https://huggingface.co/spaces/Pixedar/mindvisualizer-api
- https://pixedar-mindvisualizer-api.hf.space

Do not install the full `mindVisualizer` `pyproject.toml` on a tiny free host; it pulls desktop/VTK dependencies. This adapter uses `PYTHONPATH` and installs only the packages needed for the API path.

## Local run

```bash
cd backend/mindvis-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
$env:MINDVIS_REPO="C:\Users\assas\PycharmProjects\mindVisualizer"
uvicorn app:app --reload --port 7860
```

Then build/run the web page with:

```bash
$env:NEXT_PUBLIC_MINDVIS_API_URL="http://localhost:7860"
pnpm dev
```
