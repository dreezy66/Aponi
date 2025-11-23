(function (global) {
  const base = (global.APONI_API_BASE || "http://127.0.0.1:8001").replace(/\/$/, "");
  const norm = (path) => {
    const cleaned = (path || "").toString().replace(/^\/*/, "");
    return `/${cleaned}`;
  };

  async function apiGet(path) {
    const url = base + norm(path);
    const response = await fetch(url, { method: "GET", headers: { "X-Local": "true" } });
    if (!response.ok) throw new Error(`GET ${url} => ${response.status}`);
    return response.json();
  }

  async function apiPost(path, body) {
    const url = base + norm(path);
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body || {}),
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`POST ${url} => ${response.status}`);
    return response.json();
  }

  global.AponiAPI = { apiGet, apiPost };
})(typeof window !== "undefined" ? window : globalThis);
