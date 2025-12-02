"""ADAAD orchestrator entrypoint with CTS ledger and LVE bridge."""
from __future__ import annotations

import argparse
import hashlib
import logging
import random
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict

import cryovant
from core.task_worker import run_task_worker
from core.visual_encoder import generate_state_icon

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
)


def _safe_print(message: str, level: str = "info") -> None:
    level = level.lower()
    logger = logging.getLogger("adaad")
    log_fn = getattr(logger, level, logger.info)
    log_fn(message)


CTS_SUCCESS_REWARD = 10
CTS_FAILURE_PENALTY = -5
CTS_QUARANTINE_PENALTY = -25
LVE_ICON_FILENAME = "state_icon.png"
DB_PATH = cryovant.DB_PATH


def _get_cryovant_connection() -> sqlite3.Connection:
    """Initializes and returns a connection to the Cryovant DB."""
    cryovant._init_db(DB_PATH)
    return sqlite3.connect(str(DB_PATH))


def _after_agent_cycle(
    agent_path: Path,
    agent_id: str,
    run_result: Dict[str, Any],
    cryo_conn: sqlite3.Connection,
    cryo_hash: str,
) -> None:
    """Handles post-run CTS transaction and LVE icon generation."""
    reward = 0
    if run_result.get("ok"):
        reward = CTS_SUCCESS_REWARD
        _safe_print(f"[CTS] Reward +{reward} for success.", level="info")
    else:
        reward = CTS_FAILURE_PENALTY
        _safe_print(f"[CTS] Penalty {reward} for failure.", level="warning")

    try:
        owner_id = "orchestrator_system"
        cryovant.ensure_agent(cryo_conn, agent_id, owner_id, cryo_hash)
        new_cts = cryovant.adjust_cts(cryo_conn, agent_id, reward)
        _safe_print(f"[CTS] {agent_id} New CTS: {new_cts}", level="debug")
    except Exception as exc:  # pragma: no cover - defensive guard
        _safe_print(f"[CTS] FATAL LEDGER ERROR for {agent_id}: {exc}", level="error")
        new_cts = 0

    icon_path = str(agent_path / LVE_ICON_FILENAME)
    hash_snippet = cryo_hash[:16]
    try:
        lve_res = generate_state_icon(new_cts, hash_snippet, icon_path, size=24)
        if not lve_res.get("ok"):
            _safe_print(f"[LVE] Icon FAILED: {lve_res.get('error')}", level="error")
    except Exception as exc:  # pragma: no cover - defensive guard
        _safe_print(f"[LVE] Encoder critical error: {exc}", level="error")


def _mock_agent_run(agent_id: str) -> Dict[str, Any]:
    """Simulate an agent run and return a mock result payload."""
    cryo_hash = hashlib.sha256(agent_id.encode()).hexdigest()
    return {
        "ok": random.choice([True, False]),
        "runtime": random.random(),
        "cryovant_hash": cryo_hash,
    }


def main() -> int:
    parser = argparse.ArgumentParser(prog="adaad", description="ADAAD orchestrator")
    parser.add_argument("--cli", choices=["list", "warm", "repair", "runloop"], help="CLI commands")
    parser.add_argument("--file", help="file arg for certain cli commands")
    parser.add_argument("--daemon", action="store_true", help="run orchestrator loop (blocking)")
    args = parser.parse_args()

    if args.cli == "runloop" or args.daemon:
        _safe_print("[main] starting orchestrator loop", level="info")
        cryo_conn = None
        try:
            cryo_conn = _get_cryovant_connection()
            _safe_print("[main] Cryovant connection established.", level="info")
        except Exception as exc:  # pragma: no cover - defensive guard
            _safe_print(f"[main] FATAL: Could not establish Cryovant connection: {exc}", level="error")
            return 1

        try:
            while True:
                agent_id = f"agent_{int(time.time() * 1000) % 100000}"
                agent_path = Path(os.getcwd()) / "agents" / agent_id
                agent_path.mkdir(parents=True, exist_ok=True)

                run_result = _mock_agent_run(agent_id)
                run_task_worker(agent_id, run_result)

                _after_agent_cycle(
                    agent_path,
                    agent_id,
                    run_result,
                    cryo_conn,
                    run_result["cryovant_hash"],
                )

                time.sleep(5)
        except KeyboardInterrupt:
            _safe_print("[main] shutdown requested", level="info")
        finally:
            if cryo_conn:
                cryo_conn.close()
                _safe_print("[main] Cryovant connection closed.", level="info")
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
