const DASHBOARD_IDS = {
  status: "status",
  kpiContainer: "kpi-container",
  agentList: "agent-list",
  refreshButton: "refresh-agents",
  streamLog: "stream-log",
  banner: "banner",
  treeFilter: "tree-filter",
  changeLogList: "change-log-list",
  suggestionsList: "suggestions-list",
};

function getEl(id) {
  return document.getElementById(id);
}

function createBanner(message, tone = "error") {
  const banner = getEl(DASHBOARD_IDS.banner);
  if (!banner) return;
  banner.textContent = message;
  banner.dataset.tone = tone;
  banner.hidden = false;
}

function clearBanner() {
  const banner = getEl(DASHBOARD_IDS.banner);
  if (banner) {
    banner.textContent = "";
    banner.hidden = true;
  }
}

function formatListItem(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";

  const parts = [item.title || item.name, item.description || item.message];

  if (item.timestamp || item.time) {
    parts.push(`(${item.timestamp || item.time})`);
  }

  return parts
    .filter(Boolean)
    .join(" — ")
    .trim();
}

function renderListWithFallback(element, items, emptyMessage) {
  if (!element) return;

  const formattedItems = Array.isArray(items)
    ? items
        .map(formatListItem)
        .map(text => text && text.trim())
        .filter(Boolean)
        .slice(0, 50)
    : [];

  element.innerHTML = "";

  if (!formattedItems.length) {
    const empty = document.createElement("li");
    empty.textContent = emptyMessage;
    element.appendChild(empty);
    return;
  }

  formattedItems.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    element.appendChild(li);
  });
}

async function loadStatus() {
  const statusEl = getEl(DASHBOARD_IDS.status);
  const status = await AponiAPI.apiGet("/api/status");
  if (status && (status.ok || status.status === "ok")) {
    const reportedTime = status.time || status.timestamp || "online";
    statusEl.textContent = `✅ Online (${reportedTime})`;
    statusEl.style.color = "";
    return;
  }

  statusEl.textContent = "⚠️ Offline";
  statusEl.style.color = "#f00";
  createBanner("System status unavailable");
}

async function loadKpis() {
  const kpiContainer = getEl(DASHBOARD_IDS.kpiContainer);
  const kpis = await AponiAPI.apiGet("/api/kpis");
  if (kpis) {
    kpiContainer.innerHTML = Object.entries(kpis)
      .map(([key, val]) => `<p><strong>${key}:</strong> ${val}</p>`)
      .join("");
  } else {
    createBanner("Could not load KPIs");
  }
}

async function loadAgents() {
  const agentList = getEl(DASHBOARD_IDS.agentList);
  const agents = await AponiAPI.apiGet("/api/agents");
  agentList.innerHTML = "";
  if (agents && agents.length > 0) {
    agents.forEach(agent => {
      const li = document.createElement("li");
      li.textContent = `${agent.name} — ${agent.status}`;
      agentList.appendChild(li);
    });
  } else {
    agentList.innerHTML = "<li>No active agents</li>";
  }
}

async function loadChangeLog() {
  const changeLogEl = getEl(DASHBOARD_IDS.changeLogList);
  if (!changeLogEl) return;

  const changeLog = await AponiAPI.apiGet("/api/changes");
  if (!changeLog) {
    createBanner("Could not load recent changes");
  }

  renderListWithFallback(changeLogEl, changeLog, "No recent changes logged");
}

async function loadSuggestions() {
  const suggestionsEl = getEl(DASHBOARD_IDS.suggestionsList);
  if (!suggestionsEl) return;

  const suggestions = await AponiAPI.apiGet("/api/suggestions");
  if (!suggestions) {
    createBanner("Could not load suggestions");
  }

  renderListWithFallback(suggestionsEl, suggestions, "No suggestions available");
}

async function loadTree() {
  const tree = await AponiAPI.apiGet("/api/tree");
  if (tree) {
    AponiDashboardTree.init(tree);
  } else {
    createBanner("Could not load explorer tree");
  }
}

function initStream() {
  const streamLog = getEl(DASHBOARD_IDS.streamLog);
  if (!streamLog) return;
  AponiDashboardEvents.init({
    streamElement: streamLog,
    onError: message => createBanner(message),
  });
}

function initTreeFilter() {
  const filterEl = getEl(DASHBOARD_IDS.treeFilter);
  if (!filterEl) return;
  filterEl.addEventListener("input", event => {
    AponiDashboardTree.filter(event.target.value);
  });
}

const AponiDashboard = (() => {
  return {
    async init() {
      clearBanner();
      AponiDashboardTree.setMode(AponiAPI.getMode());
      await Promise.all([
        loadStatus(),
        loadKpis(),
        loadAgents(),
        loadChangeLog(),
        loadSuggestions(),
        loadTree(),
      ]);
      initStream();
      initTreeFilter();
      const refreshBtn = getEl(DASHBOARD_IDS.refreshButton);
      if (refreshBtn) {
        refreshBtn.addEventListener("click", loadAgents);
      }
    },
    filter(query) {
      AponiDashboardTree.filter(query);
    },
    setMode(mode) {
      AponiDashboardTree.setMode(mode);
    },
    appendEvent(event) {
      const streamLog = getEl(DASHBOARD_IDS.streamLog);
      if (streamLog) {
        streamLog.textContent += `${event}\n`;
      }
    },
  };
})();

window.AponiDashboard = AponiDashboard;

document.addEventListener("DOMContentLoaded", () => {
  AponiDashboard.init();
});
