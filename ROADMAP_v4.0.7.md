# Aponi Dashboard v4.0.7 Strategic Plan

## Current Capabilities (baseline)
- **Mock-first dashboard with live-mode toggle:** The UI reads fixture JSON by default and can target a live backend via `window.APONI_API_BASE`, keeping the bundle static while switching environments with `window.APONI_MODE`.
- **Full observability layer:** WebSocket EventBus logging, heartbeat badges (SSE/poll fallback), incremental tree streaming, tag-aware rendering (`tag-beast`, `tag-quarantine`, etc.), and keyboard-driven search/refresh are all live in `aponi_dashboard.html`.
- **Minimal telemetry panels:** Status, KPI, agent list, change log, suggestions, and a tree view render from the `AponiAPI` surface that issues `GET` calls against either mock files or a provided backend.
- **Lightweight static shell:** The public bundle is a single HTML page with modular JS for API access, core dashboard rendering, and a tree renderer, enabling offline demos without a build pipeline.

## Roadmap Check-in: Current vs. Target
- **Real-time observability:** Implemented and aligned with the ADAAD Explorer expectations.
- **Agent integrity/ownership:** Missing — no dedicated editor, permissions layer, or sandboxed save flow.
- **Marketplace & mutation mechanics:** Partially visible — BEAST/quarantine tags and log events appear, but the storefront and revenue logic are absent.
- **Extensibility & theming:** Missing — no configuration overlays or extension hooks.

## Gaps to Close
1. Agent integrity and ownership controls: add the editor surface, permissions model, and sandboxed save/clone path.
2. Marketplace and mutation mechanics: build the storefront UI and settlement logic; surface audit trails.
3. Extensibility: expose theming/layout hooks and documented extension points for contributors.

## Three-Phase Roadmap to v4.0.7

### Phase 1 — Secure Agent Creation & Editing Lab
**Objective:** Deliver a hardened agent editor with ownership, cloning, and integrity guarantees.

- **API & permissions layer (backend):**
  - Implement ownership-aware routes (create, update, clone) with edit locks and immutable system agents.
  - Enforce signed payloads and role checks before writes; reject unsigned or quarantined agents.
  - Surface an audit-friendly status for each agent (writable, locked, quarantined) for UI consumption.
- **Agent Editor module (UI):**
  - Add a dedicated editor page/component with timestamped saves, preview, and diff summaries.
  - Reuse the existing `AponiAPI.apiPost` surface for save/clone actions, keeping mock/live parity.
  - Provide tag chips for BEAST/quarantine flags and inline validation errors.
- **Integrity safeguards:**
  - Gate saves through a sandboxed execution check and content hashing.
  - Encrypt stored agent definitions at rest; store per-save signatures.
  - Quarantine and surface errors when sandbox validation fails.

### Phase 2 — Ecosystem & Economy
**Objective:** Launch the marketplace and mutation mechanics while keeping the existing observability channels healthy.

- **Agent Marketplace UI & revenue model:**
  - Build a storefront view listing purchasable agents, ownership state, and clone/purchase actions.
  - Implement transparent revenue splits (20% clone fee; full ownership on purchase) in backend settlement logic.
  - Expose marketplace telemetry through KPIs and change logs.
- **Breeding/Mutation integration:**
  - Add BEAST/Dream triggers to the editor, emitting mutation attempts with scoring results.
  - Display mutation lineage and scores in the agent detail view; support tag updates.
- **Audit logging service:**
  - Stand up a write-only audit stream for creations, edits, purchases, and mutations.
  - Surface audit summaries in the dashboard suggestions/changes panels for operator awareness.

### Phase 2.1–2.2 — Aponi Unit (AUN) Integration Blueprint
**Objective:** Introduce the internal utility currency to meter resource consumption, reward beneficial evolution, and formalize marketplace economics.

- **Core AUN mechanics:**
  - Monetization: Use AUN as the unit for clone fees (20%) and full-ownership purchases in the marketplace checkout flow.
  - Metering (gas): Require AUN spend to claim work cycles, run sandboxed execution, and initiate BEAST/Dream mutations to prevent resource exhaustion.
  - Mining (reward): Issue AUN for goal completions, successful mutations, QA passes, and profitable Market-Action agents.
  - Cryovant integrity: Every transaction references a Cryovant Lineage Hash to bind rewards/spend to verifiable agent versions.
- **Orchestrator ledger implementation:**
  - Add an `AUN_LEDGER` table to `orchestrator.py` persistence (sqlite3 or dedicated store) with columns: `tx_id` (PK UUID4), `timestamp` (UTC ISO 8601), `agent_id`, `cryovant_hash`, `amount` (positive reward/negative cost), and `reason` (`CLONE_FEE`, `MUTATION_COST`, `GOAL_REWARD`, `PURCHASE_REVENUE`, etc.).
  - Expose helper functions for atomic credit/debit with validation that the agent has sufficient balance for metered actions.
  - Enforce lineage-locked fitness scoring by tying evolution prioritization to net AUN gain per lineage and applying quarantine taxes as AUN penalties.
- **Dashboard transparency (UI):**
  - Display global AUN supply and velocity (AUN transacted per cycle) in the KPI panel.
  - Show per-agent wallet info in the explorer tree: current AUN balance, lineage rewards, and last 7-cycle spend/earn deltas.
  - Surface Revenue-Impact Estimates as the projected net AUN gain for new Market-Action agents to guide orchestration priorities.

### Phase 3 — Full Vision Fulfillment
**Objective:** Make the experience extensible, customizable, and production-ready.

- **Deep customization API:**
  - Publish theming and layout hooks; allow plug-in panels and marketplace extensions.
  - Offer configuration overlays that preserve offline capability while enabling live overrides.
- **Open-source integration:**
  - Document contribution paths, coding standards, and adapter guidance for private backends.
  - Provide sample adapters and mocks demonstrating live-mode expectations.
- **Final release hardening:**
  - Perform security review on permissions, sandboxing, and encryption flows.
  - Load-test real-time channels and incremental tree rendering; ensure graceful degradation to mock mode.
  - Ship a migration/runbook for upgrading existing deployments to v4.0.7.

## Immediate Next Step
- Formalize the AUN ledger schema and helper APIs inside `orchestrator.py`, then finalize the sandboxed save/clone payload validation rules (`AponiAPI.apiPost('/api/agent/save')`) so the editor can enforce ownership, integrity, and economic checks from day one.

### Phase 1 API Contract — `POST /api/agent/save`
This endpoint handles creation, update, and cloning requests. All payloads must be validated, signed, sandbox-checked, and audit-logged before persistence.

**Request payload (application/json)**

| Field        | Type   | Required | Description                                                                 | Validation/Security Requirement                                     |
|--------------|--------|----------|-----------------------------------------------------------------------------|---------------------------------------------------------------------|
| agent_id     | string | Yes      | Unique identifier or file path (e.g., `agents/my_dev_agent/main.py`).       | Must resolve to a valid, owned, and writable path.                  |
| owner_id     | string | Yes      | The user initiating the save; must align with the auth token.               | Enforced by the API and permissions layer.                          |
| agent_type   | string | Yes      | Agent template/type (e.g., `python_agent`, `shell_executor`).               | Used for sandbox configuration.                                     |
| content      | string | Yes      | Full source code or configuration for the agent.                            | Subject to sandboxing and hashing.                                  |
| action       | string | Yes      | Operation requested: `CREATE`, `UPDATE`, or `CLONE`.                         | Drives ownership/lock checks. `CLONE` requires `source_id`.         |
| source_id    | string | No       | Required when `action` is `CLONE`; ID of the agent being copied.            | Must resolve to an existing, cloneable agent.                       |
| description  | string | No       | Short summary of the changes for the audit log.                             | Max 256 characters.                                                 |

**Integrity safeguard flow (backend)**

1. **Authentication/authorization:** Verify `owner_id` matches the request token; confirm `agent_id` path is writable and not locked/quarantined (reject `UPDATE` when locked).
2. **Content hashing:** Compute `SHA256` on `content` for versioning and tamper detection.
3. **Sandboxed execution check:** Run code in a secure sandbox; return `validation_ok` and optional `sandbox_error` prior to write.
4. **Audit log write:** Append the transaction to a write-only audit stream before persistence.
5. **Encrypted write:** Encrypt agent definitions and store the `content_hash` as metadata when validation passes; quarantine on failure.

**Response payload (application/json)**

| Field              | Type    | Description                                                             |
|--------------------|---------|-------------------------------------------------------------------------|
| ok                 | boolean | `true` if saved successfully; otherwise `false`.                        |
| agent_id           | string  | ID of the created or updated agent.                                     |
| validation_status  | string  | Sandbox result: `VALID`, `QUARANTINED`, or `FAILED`.                    |
| content_hash       | string  | `SHA256` hash of the persisted content.                                 |
| error              | string  | Present on failure with details (e.g., permission or sandbox errors).   |

## Success Metrics
- Secure editor: 100% of save/clone requests authenticated, sandboxed, and signed.
- Marketplace integrity: revenue events reconciled automatically; audit log coverage for every transaction.
- Observability: sub-200 ms UI responsiveness during incremental tree updates; heartbeat badge accuracy >99%.
- Extensibility: third-party adapter and theme contributions validated via documented contracts and CI checks.
