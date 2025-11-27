const path = require("path");

describe("aponi_dashboard_tree", () => {
  const treeScriptPath = path.resolve(__dirname, "../static/js/aponi_dashboard_tree.js");
  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="tree-panel"></div>';
    global.AponiAPI = { apiGet: jest.fn() };
  });

  it("renders tree children when API returns an object", async () => {
    const treeResponse = {
      label: "Root",
      children: [{ label: "Child" }],
    };

    global.AponiAPI.apiGet.mockResolvedValue(treeResponse);

    require(treeScriptPath);

    document.dispatchEvent(new Event("DOMContentLoaded"));
    await flushPromises();

    const labels = Array.from(document.querySelectorAll(".tree-label")).map(
      (node) => node.textContent,
    );

    expect(global.AponiAPI.apiGet).toHaveBeenCalledWith("tree");
    expect(labels).toEqual(["Root", "Child"]);
  });

  it("renders tree children when API returns an items object", async () => {
    const treeResponse = {
      items: {
        label: "Root",
        children: [{ label: "Child" }],
      },
    };

    global.AponiAPI.apiGet.mockResolvedValue(treeResponse);

    require(treeScriptPath);

    document.dispatchEvent(new Event("DOMContentLoaded"));
    await flushPromises();

    const labels = Array.from(document.querySelectorAll(".tree-label")).map(
      (node) => node.textContent,
    );

    expect(global.AponiAPI.apiGet).toHaveBeenCalledWith("tree");
    expect(labels).toEqual(["Root", "Child"]);
  });
});
