"""Cryptographic Trust Score (CTS) ledger utilities and helpers."""
from __future__ import annotations

import os
import sqlite3
import threading
import datetime as dt
from pathlib import Path

_DB_LOCK = threading.RLock()

APP_HOME = Path(os.environ.get("ADAAD_HOME", "/storage/emulated/0/ADAAD"))
DATA_DIR = APP_HOME / "cryovant_data"
KEYS_DIR = DATA_DIR / "keys"
DB_PATH = DATA_DIR / "cryovant.db"
MIGRATIONS_DIR = APP_HOME / "migrations"


def _utcnow() -> str:
    """Return an ISO-8601 UTC timestamp."""
    return dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc).isoformat()


def _has_column(conn: sqlite3.Connection, table: str, column: str) -> bool:
    """Check whether a column exists on a table."""
    cur = conn.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())


def _create_db_tables(conn: sqlite3.Connection) -> None:
    """Create baseline tables if they do not exist."""
    with _DB_LOCK, conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS agent_registry (
                agent_id TEXT PRIMARY KEY,
                owner_id TEXT,
                created_at TEXT,
                updated_at TEXT,
                cryovant_hash TEXT,
                cts_balance INTEGER NOT NULL DEFAULT 0,
                UNIQUE(agent_id)
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_agent_cts ON agent_registry(cts_balance)")
        conn.commit()


def migrate_cts(conn: sqlite3.Connection) -> None:
    """Runs the CTS schema migration script if the column is missing."""
    if _has_column(conn, "agent_registry", "cts_balance"):
        return

    migration_path = MIGRATIONS_DIR / "001_add_cts_balance.sql"
    if not migration_path.exists():
        raise FileNotFoundError(f"CTS migration script not found at {migration_path}")

    with _DB_LOCK, conn:
        conn.executescript(migration_path.read_text("utf-8"))
        conn.commit()


def ensure_agent(conn: sqlite3.Connection, agent_id: str, owner_id: str, cryovant_hash: str) -> None:
    """Insert or update an agent registration record."""
    with _DB_LOCK, conn:
        conn.execute(
            """
            INSERT INTO agent_registry(agent_id, owner_id, created_at, updated_at, cryovant_hash)
            VALUES(?,?,?,?,?)
            ON CONFLICT(agent_id) DO UPDATE SET
                updated_at = excluded.updated_at,
                cryovant_hash = excluded.cryovant_hash
            """,
            (agent_id, owner_id, _utcnow(), _utcnow(), cryovant_hash),
        )
        conn.commit()


def get_cts(conn: sqlite3.Connection, agent_id: str) -> int:
    """Retrieve the current CTS value for an agent."""
    cur = conn.execute("SELECT cts_balance FROM agent_registry WHERE agent_id=?", (agent_id,))
    row = cur.fetchone()
    return int(row[0]) if row else 0


def adjust_cts(conn: sqlite3.Connection, agent_id: str, delta: int) -> int:
    """Atomically adjust CTS and return the new value."""
    with _DB_LOCK, conn:
        cur = conn.execute(
            """
            UPDATE agent_registry
            SET cts_balance = cts_balance + ?, updated_at = ?
            WHERE agent_id = ?
            RETURNING cts_balance
            """,
            (int(delta), _utcnow(), agent_id),
        )
        row = cur.fetchone()
        if row is None:
            return 0
        conn.commit()
        return int(row[0])


def _init_db(db_path: Path = DB_PATH) -> None:
    """Initializes the SQLite database and runs migrations."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    _create_db_tables(conn)
    try:
        migrate_cts(conn)
    except Exception as exc:  # pragma: no cover - defensive log path
        print(f"[Cryovant] WARNING: CTS migration failed: {exc}")
    conn.close()


def open_db(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """Open a database connection, initializing the DB if needed."""
    _init_db(db_path)
    return sqlite3.connect(str(db_path))


__all__ = [
    "DB_PATH",
    "MIGRATIONS_DIR",
    "ensure_agent",
    "get_cts",
    "adjust_cts",
    "open_db",
    "_init_db",
]
