"""Minimal task worker stub for orchestrator integration."""
from typing import Any, Dict


def run_task_worker(agent_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Placeholder worker that echoes the payload.

    This stub can be replaced with real task execution logic. It returns a
    minimal result structure expected by the orchestrator.
    """
    return {"ok": True, "agent_id": agent_id, "payload": payload}
