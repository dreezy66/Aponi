const { apiGet, apiPost } = require("../static/js/api");

describe("AponiAPI", () => {
  beforeEach(() => {
    global.APONI_MODE = "mock";
    global.APONI_API_BASE = undefined;
    global.fetch = jest.fn();
  });

  it("uses mock files by default", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await apiGet("status");

    expect(global.fetch).toHaveBeenCalledWith("./mock/status.json", { cache: "no-cache" });
  });

  it("posts to mock files in mock mode", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ saved: true }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await apiPost("changes", { foo: "bar" });

    expect(global.fetch).toHaveBeenCalledWith("./mock/changes.json", { cache: "no-cache" });
  });

  it("builds live URLs when APONI_MODE is live", async () => {
    global.APONI_MODE = "live";
    global.APONI_API_BASE = "https://example.test";
    const response = { ok: true, json: () => Promise.resolve({}) };
    global.fetch.mockResolvedValue(response);

    await apiGet("/agents");

    expect(global.fetch).toHaveBeenCalledWith("https://example.test/agents", { method: "GET" });
  });

  it("posts JSON bodies in live mode", async () => {
    global.APONI_MODE = "live";
    global.APONI_API_BASE = "https://example.test";
    const response = { ok: true, json: () => Promise.resolve({ created: true }) };
    global.fetch.mockResolvedValue(response);

    await apiPost("changes", { foo: "bar" });

    expect(global.fetch).toHaveBeenCalledWith("https://example.test/changes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foo: "bar" }),
    });
  });
});
