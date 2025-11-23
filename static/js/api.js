const DEFAULT_APONI_MODE = "mock";
const DEFAULT_APONI_API_BASE = null;

function resolveGlobal(key) {
  if (typeof window !== "undefined" && window[key]) return window[key];
  if (typeof globalThis !== "undefined" && globalThis[key]) return globalThis[key];
  return null;
}

function resolveMode() {
  const mode = resolveGlobal("APONI_MODE") || DEFAULT_APONI_MODE;
  return String(mode).toLowerCase();
}

function resolveApiBase() {
  return resolveGlobal("APONI_API_BASE") || DEFAULT_APONI_API_BASE;
}

function toMockPath(path) {
  const normalized = (path || "").replace(/^\/?api\/?/, "").replace(/^\//, "");
  if (!normalized) return null;
  return `./mock/${normalized}.json`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const AponiAPI = (() => {
  async function apiGet(path) {
    try {
      const mode = resolveMode();
      if (mode === "mock") {
        const mockPath = toMockPath(path);
        if (!mockPath) return null;
        return await fetchJson(mockPath);
      }

      const apiBase = resolveApiBase();
      if (!apiBase) {
        console.error("AponiAPI: live mode requires window.APONI_API_BASE to be set");
        return null;
      }

      return await fetchJson(`${apiBase}${path}`);
    } catch (err) {
      console.error("API GET failed:", path, err);
      return null;
    }
  }

  function getMode() {
    return resolveMode();
  }

  function getApiBase() {
    return resolveApiBase();
  }

  function getStream(path = "/api/stream") {
    const mode = resolveMode();
    if (mode === "mock" || typeof EventSource === "undefined") return null;
    const apiBase = resolveApiBase();
    if (!apiBase) return null;
    return new EventSource(`${apiBase}${path}`);
  }

  return { apiGet, getMode, getApiBase, getStream };
})();

if (typeof window !== "undefined") {
  window.AponiAPI = AponiAPI;
}

if (typeof module !== "undefined") {
  module.exports = { AponiAPI, apiGet: AponiAPI.apiGet, resolveMode, resolveApiBase, toMockPath };
}
