# ADAAD Private Adapter

This directory is intended for a **private** repository. Do not commit it into the public Aponi repo. It exposes the same surface as `AponiAPI` so the open-source UI can run against ADAAD without modification.

## Setup

1. Copy this directory into a private repo.
2. Add your real configuration to `config.local.json` (ignored by git).
3. Host the adapter file with your HTML bundle.

```html
<script>
  window.APONI_MODE = "live";
  window.APONI_API_BASE = "http://127.0.0.1:8001";
</script>
<script src="aponi_private_adapter.js"></script>
<script src="static/js/aponi_dashboard_core.js"></script>
<script src="static/js/aponi_dashboard_tree.js"></script>
```

## Security

* Keep `config.local.json` out of version control.
* The adapter adds an `X-Local` header for identification; extend as needed for auth.
* No ADAAD-specific details should appear in the public Aponi codebase.
