# Aponi (Open Source)

Aponi is a static, mock-first dashboard that can run entirely offline. It exposes a minimal API surface (`AponiAPI`) that supports both mock mode (default) and live mode (against any backend you supply via `window.APONI_API_BASE`).

## Modes

### Mock (default)
The UI loads JSON from the local `./mock` directory. No network calls occur.

```html
<script>
  window.APONI_MODE = "mock";
</script>
```

### Live
Point the dashboard at your own backend without changing the UI bundle.

```html
<script>
  window.APONI_MODE = "live";
  window.APONI_API_BASE = "http://127.0.0.1:8001"; // example only
</script>
```

In live mode the `AponiAPI` surface sends `GET` and `POST` requests to the provided base URL.

## Local usage

```bash
npm install
npm test
npm run lint
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## File layout

```
index.html
static/
  css/style.css
  js/api.js
  js/aponi_dashboard_core.js
  js/aponi_dashboard_tree.js
mock/
  agents.json
  changes.json
  kpis.json
  status.json
  suggestions.json
  tree.json
```

## Private adapter (kept separate)

The ADAAD adapter belongs in a private repository. It should expose the same surface as `AponiAPI` while reading configuration from a private `config.json`. Do **not** commit the adapter to the public repository.
