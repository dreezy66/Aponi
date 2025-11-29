from __future__ import annotations

"""Aponi orchestrator entry-point for CTS accounting and LVE publishing."""

from pathlib import Path
from typing import Any, Dict

import core.cryovant as cryovant
from core.task_worker import run_task_worker
from core.visual_encoder import generate_status_icon

CTS_SUCCESS_REWARD = 10
CTS_FAILURE_PENALTY = -5
CTS_QUARANTINE_PENALTY = -25
LVE_ICON_FILENAME = "state_icon.png"


def _safe_print(message: str, level: str = "info") -> None:
    print(f"[{level.upper()}] {message}")


def _resolve_hash_snippet(agent_record: Dict[str, Any], fallback: str) -> str:
    cryovant_hash = agent_record.get("cryovant_hash")
    if not cryovant_hash:
        metadata = agent_record.get("metadata")
        if isinstance(metadata, dict):
            cryovant_hash = metadata.get("cryovant_hash")
    return (cryovant_hash or fallback)[:8]


def run_agent(agent_path: Path, agent_id: str, mode: str = "default") -> Dict[str, Any]:
    """Run an agent task, update CTS, and emit a Lossless Visual Encoding icon."""

    cryovant.ensure_agent_registered(agent_id)

    run_result = run_task_worker(agent_path=agent_path, agent_id=agent_id, mode=mode)

    cts_change = CTS_SUCCESS_REWARD if run_result.get("ok") else CTS_FAILURE_PENALTY
    if run_result.get("quarantined"):
        cts_change += CTS_QUARANTINE_PENALTY

    cts_res = cryovant.adjust_cts(agent_id, cts_change)
    if not cts_res.get("ok"):
        _safe_print(f"[{mode}] FATAL: Failed to adjust CTS: {cts_res.get('error')}", level="error")

    new_cts = cts_res.get("new_cts") if cts_res.get("ok") else (cryovant.get_agent_cts(agent_id) or 0)

    agent_record = cryovant.get_agent_record_by_id(agent_id) or {}
    hash_snippet = _resolve_hash_snippet(agent_record, agent_id)

    icon_path = agent_path.parent / LVE_ICON_FILENAME
    lve_res = generate_status_icon(
        agent_id=agent_id,
        cts_score=new_cts,
        cryovant_hash_snippet=hash_snippet,
        target_path=icon_path,
    )

    if lve_res.get("ok"):
        _safe_print(
            f"[{mode}] LVE Status Icon published: {icon_path} (CTS: {new_cts})",
            level="debug",
        )
    else:
        _safe_print(f"[{mode}] WARNING: LVE Failed: {lve_res.get('error')}", level="error")

    run_result.update(
        {
            "cts": new_cts,
            "cts_delta": cts_change,
            "lve_icon_path": str(icon_path) if lve_res.get("ok") else None,
        }
    )

    return run_result


if __name__ == "__main__":  # pragma: no cover - manual harness
    demo_agent_path = Path("agents/demo.py")
    _safe_print(str(run_agent(demo_agent_path, "demo-agent", "manual")))
