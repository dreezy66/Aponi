(function () {
  const treeContainer = document.getElementById("tree-panel");

  function createNode(node) {
    const wrapper = document.createElement("li");
    const label = document.createElement("div");
    label.className = "tree-label";
    label.textContent = node.label || node.name || "Node";
    wrapper.appendChild(label);

    if (node.children && node.children.length) {
      const list = document.createElement("ul");
      node.children.forEach((child) => list.appendChild(createNode(child)));
      wrapper.appendChild(list);
    }

    return wrapper;
  }

  function normalizeNodes(tree) {
    const payload = tree?.items ?? tree;

    if (!payload) return [];

    return Array.isArray(payload) ? payload : [payload];
  }

  function renderTree(tree) {
    if (!treeContainer) return;
    treeContainer.innerHTML = "";

    const list = document.createElement("ul");
    const nodes = normalizeNodes(tree);
    nodes.forEach((node) => list.appendChild(createNode(node)));

    treeContainer.appendChild(list);
  }

  async function loadTree() {
    try {
      const tree = await AponiAPI.apiGet("tree");
      renderTree(tree);
    } catch (err) {
      console.error(err); // eslint-disable-line no-console
    }
  }

  document.addEventListener("DOMContentLoaded", loadTree);
})();
