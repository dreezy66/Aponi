# 🦋 Aponi Dashboard (HTML5 Frontend)

Open-source UI for the ADAAD Orchestrator.

## Overview
This static dashboard connects to your Render-hosted backend (e.g. `https://aponi-dashboard.onrender.com`) and displays live system metrics, agent lists, and streaming logs.

## Deploy to GitHub Pages
1. Create a public repo named **Aponi**.
2. Copy all files (index.html, static/, .nojekyll, README.md) into the repo.
3. Commit and push.
4. In GitHub: Settings → Pages → Source → main branch → root.
5. The dashboard appears at `https://<your-username>.github.io/Aponi/` once the Pages build finishes. Add a script tag before `</body>` to point the UI at your backend (for example: `<script>window.APONI_API_BASE = "https://aponi-dashboard.onrender.com";</script>`). You can also configure this variable through your Pages repository settings if you prefer to inject it via build or environment tooling.

### Local preview
Before publishing, you can verify the static site locally by serving the folder (for example with `npx serve .` or `python -m http.server 4173`) and opening the reported URL in your browser. Ensure `window.APONI_API_BASE` is set in `index.html` (or injected via a local script) so the UI can reach a reachable backend endpoint during your test.
