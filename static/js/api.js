(function (global) {
  const DEFAULT_MODE = "mock";

  function getMode() {
    const mode = (global.APONI_MODE || DEFAULT_MODE).toLowerCase();
    return mode === "live" ? "live" : DEFAULT_MODE;
  }

  function normalizePath(path) {
    const normalized = (path || "").toString().replace(/^\/*/, "");
    return normalized ? `/${normalized}` : "/";
  }

  function buildLiveUrl(path) {
    const base = (global.APONI_API_BASE || "").replace(/\/$/, "");
    return `${base}${normalizePath(path)}`;
  }

  function buildMockUrl(path) {
    const normalized = normalizePath(path).replace(/^\//, "");
    return `./mock/${normalized || "index"}.json`;
  }

  async function handleResponse(label, response) {
    if (!response.ok) {
      throw new Error(`${label} => ${response.status}`);
    }
    return response.json();
  }

  async function apiGet(path) {
    if (getMode() === "mock") {
      const mockUrl = buildMockUrl(path);
      const response = await fetch(mockUrl, { cache: "no-cache" });
      return handleResponse(`MOCK GET ${mockUrl}`, response);
    }

    const liveUrl = buildLiveUrl(path);
    const response = await fetch(liveUrl, { method: "GET" });
    return handleResponse(`GET ${liveUrl}`, response);
  }

  async function apiPost(path, body) {
    const liveUrl = buildLiveUrl(path);
    const response = await fetch(liveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    return handleResponse(`POST ${liveUrl}`, response);
  }

  global.AponiAPI = { apiGet, apiPost };

  if (typeof module !== "undefined") {
    module.exports = global.AponiAPI;
  }
})(typeof window !== "undefined" ? window : globalThis);
