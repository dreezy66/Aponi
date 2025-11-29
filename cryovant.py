from __future__ import annotations

"""Cryovant registry utilities for agent metadata and Cryptographic Trust Score (CTS).

This module provides lightweight persistence for agent registration along with
helpers to retrieve and adjust the CTS balance that powers security-sensitive
workflows.
"""

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, Optional

DB_PATH = Path("data/cryovant.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def _init_db(db_path: Path = DB_PATH) -> None:
    """Initialize the Cryovant database and ensure CTS support exists."""
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                creator_id TEXT,
                registration_ts TEXT,
                metadata TEXT,
                is_revoked INTEGER DEFAULT 0,
                revoked_ts TEXT,
                revoked_by TEXT,
                CTS_Balance INTEGER DEFAULT 100,
                UNIQUE(id)
            )
            """
        )

        # Migrate legacy tables to ensure CTS_Balance exists
        columns = {row[1] for row in cursor.execute("PRAGMA table_info(agents)").fetchall()}
        if "CTS_Balance" not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN CTS_Balance INTEGER DEFAULT 100")

        conn.commit()
    finally:
        conn.close()


def _serialize_metadata(metadata: Optional[Any]) -> Optional[str]:
    if metadata is None:
        return None
    if isinstance(metadata, str):
        return metadata
    try:
        return json.dumps(metadata)
    except Exception:
        return str(metadata)


def ensure_agent_registered(agent_id: str, creator_id: str = "system", metadata: Optional[Any] = None) -> None:
    """Insert an agent row if it does not already exist."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR IGNORE INTO agents (id, creator_id, registration_ts, metadata, is_revoked, CTS_Balance)
            VALUES (?, ?, datetime('now'), ?, 0, 100)
            """,
            (agent_id, creator_id, _serialize_metadata(metadata)),
        )
        conn.commit()
    finally:
        conn.close()


def get_agent_record_by_id(agent_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a single agent record as a dictionary, if present."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, creator_id, registration_ts, metadata, is_revoked, revoked_ts, revoked_by, CTS_Balance FROM agents WHERE id = ?",
            (agent_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        metadata_value = row[3]
        try:
            metadata_obj = json.loads(metadata_value) if metadata_value else None
        except Exception:
            metadata_obj = metadata_value

        return {
            "id": row[0],
            "creator_id": row[1],
            "registration_ts": row[2],
            "metadata": metadata_obj,
            "is_revoked": bool(row[4]),
            "revoked_ts": row[5],
            "revoked_by": row[6],
            "CTS_Balance": row[7],
            # Optional field for downstream consumers; fall back to metadata hint.
            "cryovant_hash": (metadata_obj or {}).get("cryovant_hash") if isinstance(metadata_obj, dict) else None,
        }
    finally:
        conn.close()


def get_agent_cts(agent_id: str) -> Optional[int]:
    """Retrieves the current Cryptographic Trust Score for an agent."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT CTS_Balance FROM agents WHERE id = ?", (agent_id,))
        result = cursor.fetchone()
        return result[0] if result else None
    finally:
        conn.close()


def adjust_cts(agent_id: str, amount: int, conn: Optional[sqlite3.Connection] = None) -> Dict[str, Any]:
    """
    Atomically adjusts the Cryptographic Trust Score (CTS) for an agent.
    Returns the new balance.
    """
    _conn = conn or sqlite3.connect(DB_PATH)
    try:
        cursor = _conn.cursor()
        cursor.execute(
            "UPDATE agents SET CTS_Balance = CTS_Balance + ? WHERE id = ?",
            (amount, agent_id),
        )

        if cursor.rowcount == 0:
            if not conn:
                _conn.close()
            return {"ok": False, "error": f"Agent ID {agent_id} not found."}

        cursor.execute("SELECT CTS_Balance FROM agents WHERE id = ?", (agent_id,))
        fetched = cursor.fetchone()
        new_balance = fetched[0] if fetched else None

        if not conn:
            _conn.commit()
        return {"ok": True, "agent_id": agent_id, "new_cts": new_balance}
    except Exception as exc:  # pragma: no cover - defensive logging path
        if not conn:
            _conn.rollback()
        return {"ok": False, "error": f"DB error: {exc}"}
    finally:
        if not conn:
            _conn.close()


# Initialize database on import
_init_db()

__all__ = [
    "DB_PATH",
    "adjust_cts",
    "ensure_agent_registered",
    "get_agent_cts",
    "get_agent_record_by_id",
]
