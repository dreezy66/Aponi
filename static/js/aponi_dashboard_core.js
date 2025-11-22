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
  const status = await apiGet("/api/status");
  if (status && status.ok) {
    statusEl.textContent = `✅ Online (${status.time})`;
    statusEl.style.color = "";
  } else {
    statusEl.textContent = "⚠️ Offline";
    statusEl.style.color = "#f00";
    createBanner("System status unavailable");
  }
}

async function loadKpis() {
  const kpiContainer = getEl(DASHBOARD_IDS.kpiContainer);
  const kpis = await apiGet("/api/kpis");
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
  const agents = await apiGet("/api/agents");
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

  const changeLog = await apiGet("/api/changes");
  if (!changeLog) {
    createBanner("Could not load recent changes");
  }

  renderListWithFallback(changeLogEl, changeLog, "No recent changes logged");
}

async function loadSuggestions() {
  const suggestionsEl = getEl(DASHBOARD_IDS.suggestionsList);
  if (!suggestionsEl) return;

  const suggestions = await apiGet("/api/suggestions");
  if (!suggestions) {
    createBanner("Could not load suggestions");
  }

  renderListWithFallback(suggestionsEl, suggestions, "No suggestions available");
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
    async init(treeData) {
      clearBanner();
      await Promise.all([
        loadStatus(),
        loadKpis(),
        loadAgents(),
        loadChangeLog(),
        loadSuggestions(),
      ]);
      initStream();
      initTreeFilter();
      if (treeData) {
        AponiDashboardTree.init(treeData);
      }
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
