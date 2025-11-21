const { apiGet, APONI_API_BASE } = require("../static/js/api");

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
  });

  it("returns parsed JSON when the response is ok", async () => {
    const mockData = { status: "ok" };
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await apiGet("/metrics");

    expect(global.fetch).toHaveBeenCalledWith(`${APONI_API_BASE}/metrics`);
    expect(result).toEqual(mockData);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs and returns null when the response is not ok", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn(),
    });

    const result = await apiGet("/metrics");

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "API GET failed:",
      "/metrics",
      expect.any(Error)
    );
  });

  it("logs and returns null when fetch throws an error", async () => {
    global.fetch.mockRejectedValue(new Error("network error"));

    const result = await apiGet("/agents");

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "API GET failed:",
      "/agents",
      expect.any(Error)
    );
  });
});
