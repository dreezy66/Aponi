const DASHBOARD_TREE_IDS = {
  treeRoot: "tree-root",
  modeBadge: "mode-badge",
};

const AponiDashboardTree = (() => {
  let treeData = null;
  let filterQuery = "";

  function getTreeRoot() {
    return document.getElementById(DASHBOARD_TREE_IDS.treeRoot);
  }

  function renderNode(node, container) {
    const li = document.createElement("li");
    li.textContent = node.name;
    if (node.children && node.children.length) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = node.name;
      details.appendChild(summary);
      const ul = document.createElement("ul");
      node.children
        .filter(child => !filterQuery || child.name.includes(filterQuery))
        .slice(0, 200)
        .forEach(child => renderNode(child, ul));
      details.appendChild(ul);
      li.innerHTML = "";
      li.appendChild(details);
    }
    container.appendChild(li);
  }

  function render(tree) {
    const root = getTreeRoot();
    if (!root) return;
    root.innerHTML = "";
    const ul = document.createElement("ul");
    tree.slice(0, 500).forEach(node => renderNode(node, ul));
    root.appendChild(ul);
  }

  return {
    init(initialTree) {
      treeData = initialTree || [];
      render(treeData);
    },
    filter(query) {
      filterQuery = query || "";
      if (treeData) {
        render(treeData);
      }
    },
    setMode(mode) {
      const badge = document.getElementById(DASHBOARD_TREE_IDS.modeBadge);
      if (badge) {
        badge.textContent = mode;
      }
    },
  };
})();

window.AponiDashboardTree = AponiDashboardTree;
