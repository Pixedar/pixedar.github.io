# MindVisualizer Live Python Space

This folder contains the Hugging Face Spaces packaging for the Python/VTK
MindVisualizer runtime. GitHub Pages should only link to or embed this Space;
the VTK renderer, mesh overlay, probe system, and Python analysis code run
inside the Docker Space through Trame's VTK web transport.

The deployment script copies the local Python project into a temporary staging
folder, removes development-only folders and duplicate mesh data, places the
Docker files at the Space root, then uploads the folder to:

`Pixedar/mindvisualizer-vtk`

Hugging Face blocks VNC/noVNC-style desktop streaming for Spaces, so this
package does not start a VNC server. It starts a normal web app on `$PORT`.

Run from the website repo root:

```powershell
.\scripts\deploy-mindvis-live-space.ps1
```

If `C:\Users\assas\PycharmProjects\mindVisualizer\.env` exists, the script uses
it as the Hugging Face secret file so `OPENAI_API_KEY` is available in the Space
without committing it.
