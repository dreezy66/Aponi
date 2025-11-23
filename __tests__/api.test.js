const { AponiAPI } = require("../static/js/api");

describe("apiGet", () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error = originalConsoleError;
    delete global.fetch;
    delete global.APONI_MODE;
    delete global.APONI_API_BASE;
  });

  it("returns parsed JSON when the response is ok", async () => {
    const mockData = { status: "ok" };
    global.APONI_MODE = "live";
    global.APONI_API_BASE = "https://example.com";
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await AponiAPI.apiGet("/metrics");

    expect(global.fetch).toHaveBeenCalledWith(`https://example.com/metrics`);
    expect(result).toEqual(mockData);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs and returns null when the response is not ok", async () => {
    global.APONI_MODE = "live";
    global.APONI_API_BASE = "https://example.com";
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn(),
    });

    const result = await AponiAPI.apiGet("/metrics");

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "API GET failed:",
      "/metrics",
      expect.any(Error)
    );
  });

  it("logs and returns null when fetch throws an error", async () => {
    global.APONI_MODE = "live";
    global.APONI_API_BASE = "https://example.com";
    global.fetch.mockRejectedValue(new Error("network error"));

    const result = await AponiAPI.apiGet("/agents");

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "API GET failed:",
      "/agents",
      expect.any(Error)
    );
  });

  it("loads from mock paths when mode is mock", async () => {
    const mockResponse = { ok: true };
    global.APONI_MODE = "mock";
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await AponiAPI.apiGet("/api/status");

    expect(global.fetch).toHaveBeenCalledWith("./mock/status.json");
    expect(result).toEqual(mockResponse);
  });
});
