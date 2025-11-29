from __future__ import annotations
import os
from pathlib import Path
from flask import Flask, request, render_template, send_from_directory, jsonify

APP_ROOT = Path("/storage/emulated/0/ADAAD")
STATIC_DIR = APP_ROOT / "static"
TEMPLATE_DIR = APP_ROOT

app = Flask(
    __name__,
    template_folder=str(TEMPLATE_DIR),
    static_folder=str(STATIC_DIR),
)


@app.route("/")
def index():
    """Serve dashboard template with a dynamic event bus URL."""
    event_bus_port = os.environ.get("APONI_EVENTBUS_PORT", "8765")
    scheme = "wss" if request.is_secure else "ws"
    host = request.host.split(":")[0]
    event_bus_url = f"{scheme}://{host}:{event_bus_port}"

    return render_template(
        "aponi_dashboard.html",
        event_bus_url=event_bus_url,
    )


@app.route("/static/<path:p>")
def static_proxy(p: str):
    """Serve files from the static directory if they exist."""
    target = STATIC_DIR / p
    if target.exists():
        return send_from_directory(str(STATIC_DIR), p)
    return jsonify({"error": "asset not found", "path": p}), 404


@app.route("/api/tree")
def api_tree():
    """Return pre-rendered tree JSON for explorer mode."""
    try:
        return send_from_directory(str(APP_ROOT), "adaad_tree_full.json")
    except Exception as exc:  # pragma: no cover - defensive server guard
        return jsonify({"error": str(exc)}), 500


@app.route("/api/file", methods=["GET"])
def api_load_file():
    """Read a file relative to APP_ROOT with escape protection."""
    rel = request.args.get("path")
    if not rel:
        return jsonify({"error": "missing path"}), 400
    try:
        abs_path = (APP_ROOT / rel).resolve()
        if not str(abs_path).startswith(str(APP_ROOT)):
            raise ValueError("path escape attempt")
        if not abs_path.exists():
            return jsonify({"error": "not found"}), 404
        text = abs_path.read_text(encoding="utf-8")
        return jsonify({"content": text, "path": rel})
    except Exception as exc:  # pragma: no cover - defensive server guard
        return jsonify({"error": str(exc)}), 500


@app.route("/api/file", methods=["POST"])
def api_save_file():
    """Write content to a file relative to APP_ROOT with escape protection."""
    try:
        data = request.get_json(force=True)
        rel = data.get("path") if data else None
        content = (data or {}).get("content", "")
        if not rel:
            return jsonify({"error": "missing path"}), 400

        abs_path = (APP_ROOT / rel).resolve()
        if not str(abs_path).startswith(str(APP_ROOT)):
            raise ValueError("path escape attempt")

        abs_path.write_text(content, encoding="utf-8")
        return jsonify({"ok": True})
    except Exception as exc:  # pragma: no cover - defensive server guard
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run("0.0.0.0", 8001, debug=False)
