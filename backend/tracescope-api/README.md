---
title: TraceScope API
emoji: 🔬
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# TraceScope Explain API

Tiny Hugging Face Spaces backend for the TraceScope web demo.

It serves:

- `GET /health`
- `POST /explain`

`OPENAI_API_KEY` is read from Space secrets. If the key is absent, the per-client
free limit is exhausted, or the daily request limit is exhausted, the API returns
`429`, and the web UI asks the user for their own browser-session key.

Useful Space variables/secrets:

- `OPENAI_API_KEY` — required for hosted free explanations.
- `TRACESCOPE_FREE_EXPLAINS_PER_CLIENT` — uncached hosted explanations per browser/IP per day, default `1`.
- `TRACESCOPE_DAILY_REQUEST_LIMIT` — total uncached hosted explanations per day, default `60`.
- `TRACESCOPE_OPENAI_MODEL` — backend model, default `gpt-5`.

Deploy from the website repo root:

```powershell
.\scripts\deploy-tracescope-api-space.ps1
```

Recommended Space visibility: private if your current Hugging Face plan allows
it. If private Spaces are not available, deploy the same way as the existing
MindVisualizer Space and rely on the daily request limit.
