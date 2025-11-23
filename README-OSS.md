# 🦋 Aponi Dashboard (OSS bundle)

This bundle is safe to publish publicly. It ships with **mock mode enabled by default**, so the dashboard loads without any backend or private URLs. Live mode is opt-in and must be configured explicitly by the integrator.

## Modes
- **Mock (default):** Loads static JSON from `./mock/*.json` to render the full dashboard with no network calls.
- **Live:** Set `window.APONI_MODE = "live";` and `window.APONI_API_BASE = "https://your-endpoint.example.com";` before the scripts load. No private endpoints are hardcoded.

## What is included
- `static/js/api.js`: A safe adapter that serves mock data by default and only calls a live base when you set `window.APONI_API_BASE`.
- `static/js/aponi_dashboard_core.js`: Uses `AponiAPI.apiGet()` for all data fetching in both modes.
- `static/js/aponi_dashboard_events.js`: Uses mock stream data for demo mode; connects to live SSE only when configured.
- `static/js/aponi_dashboard_tree.js`: Displays the explorer with a clear mode badge.
- `mock/`: Mock JSON files for status, KPIs, agents, changes, suggestions, tree, and stream events.
- `index.html`: Defaults to mock mode and documents how to enable live mode.

## Running locally
1. Serve the folder (for example `npx serve .` or `python -m http.server 4173`).
2. Open the reported URL. The dashboard will render entirely from the mock JSON files.
3. To test against a live backend, set `window.APONI_MODE = "live";` and `window.APONI_API_BASE` to your API root before loading the scripts.

## Privacy and separation
- No ADAAD or private endpoints are referenced in this bundle.
- Mock mode is the default to prevent accidental network calls.
- Keep any private adapters, schemas, or credentials in a separate private repository.
