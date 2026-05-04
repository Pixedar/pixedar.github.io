# TraceScope Explain API

Tiny Hugging Face Spaces backend for the TraceScope web demo.

It serves:

- `GET /health`
- `POST /explain`

`OPENAI_API_KEY` is read from Space secrets. If the key is absent or the daily
request limit is exhausted, the API returns `429`, and the web UI asks the user
for their own browser-session key.

Deploy from the website repo root:

```powershell
.\scripts\deploy-tracescope-api-space.ps1
```

Recommended Space visibility: private if your current Hugging Face plan allows
it. If private Spaces are not available, deploy the same way as the existing
MindVisualizer Space and rely on the daily request limit.
