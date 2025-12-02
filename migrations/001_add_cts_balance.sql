-- 001_add_cts_balance.sql
-- Adds the Cryptographic Trust Score column to the agent_registry table.
PRAGMA journal_mode=WAL;
BEGIN;
CREATE TABLE IF NOT EXISTS agent_registry (
  agent_id TEXT PRIMARY KEY,
  owner_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  cryovant_hash TEXT,
  UNIQUE(agent_id)
);
-- Add the CTS column. Logic in cryovant.py handles idempotent execution.
ALTER TABLE agent_registry ADD COLUMN cts_balance INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_agent_cts ON agent_registry(cts_balance);
COMMIT;
