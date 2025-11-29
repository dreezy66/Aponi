from __future__ import annotations

"""Minimal task worker shim used by the orchestrator."""

from pathlib import Path
from typing import Any, Dict


def run_task_worker(agent_path: Path, agent_id: str, mode: str = "default") -> Dict[str, Any]:
    """Placeholder task runner that simulates executing an agent."""
    return {
        "ok": True,
        "agent_id": agent_id,
        "mode": mode,
        "artifact_path": str(agent_path),
    }
