(function () {
  const statusContainer = document.getElementById("status-panel");
  const kpiContainer = document.getElementById("kpi-panel");
  const agentsContainer = document.getElementById("agents-panel");
  const changesContainer = document.getElementById("changes-panel");
  const suggestionsContainer = document.getElementById("suggestions-panel");
  const modeBadge = document.getElementById("mode-badge");
  const errorContainer = document.getElementById("error-panel");

  function setModeBadge() {
    const mode = (window.APONI_MODE || "mock").toLowerCase();
    modeBadge.textContent = mode === "live" ? "Live" : "Mock";
    modeBadge.className = mode === "live" ? "badge live" : "badge mock";
  }

  function safeText(value) {
    return document.createTextNode(value);
  }

  function buildAgentIcon(agent) {
    const iconPath =
      agent?.icon ||
      (agent?.path ? `/file-view/${agent.path}/state_icon.png` : null);

    if (!iconPath) return null;

    const img = document.createElement("img");
    img.src = iconPath;
    img.className = "agent-status-icon";
    img.alt = `${agent.name || agent.id || "Agent"} status icon`;
    return img;
  }

  function renderStatus(status) {
    if (!statusContainer) return;
    statusContainer.innerHTML = "";
    const heading = document.createElement("h3");
    heading.appendChild(safeText(status.title || "Status"));

    const summary = document.createElement("p");
    summary.appendChild(safeText(status.summary || ""));

    const uptime = document.createElement("p");
    uptime.className = "muted";
    uptime.appendChild(safeText(`Uptime: ${status.uptime || "n/a"}`));

    statusContainer.appendChild(heading);
    statusContainer.appendChild(summary);
    statusContainer.appendChild(uptime);
  }

  function renderKpis(kpis) {
    if (!kpiContainer) return;
    kpiContainer.innerHTML = "";
    const list = document.createElement("div");
    list.className = "kpi-grid";

    (kpis || []).forEach((kpi) => {
      const item = document.createElement("div");
      item.className = "card";

      const label = document.createElement("div");
      label.className = "muted";
      label.appendChild(safeText(kpi.label || "Metric"));

      const value = document.createElement("div");
      value.className = "value";
      value.appendChild(safeText(kpi.value || "-"));

      const trend = document.createElement("div");
      trend.className = `trend ${kpi.trend || "flat"}`;
      trend.appendChild(safeText(kpi.change || ""));

      item.appendChild(label);
      item.appendChild(value);
      item.appendChild(trend);
      list.appendChild(item);
    });

    kpiContainer.appendChild(list);
  }

  function renderAgents(agents) {
    if (!agentsContainer) return;
    agentsContainer.innerHTML = "";
    const list = document.createElement("ul");
    list.className = "stacked";

    (agents || []).forEach((agent) => {
      const item = document.createElement("li");

      const heading = document.createElement("div");
      heading.className = "agent-heading";

      const icon = buildAgentIcon(agent);
      if (icon) {
        heading.appendChild(icon);
      }

      const name = document.createElement("strong");
      name.appendChild(safeText(agent.name || "Agent"));
      heading.appendChild(name);

      const summary = document.createElement("div");
      summary.className = "muted";
      summary.appendChild(safeText(agent.summary || ""));

      const state = document.createElement("span");
      state.className = `state ${agent.state || "idle"}`;
      state.appendChild(safeText(agent.state || "idle"));

      item.appendChild(heading);
      item.appendChild(summary);
      item.appendChild(state);
      list.appendChild(item);
    });

    agentsContainer.appendChild(list);
  }

  function renderSuggestions(suggestions) {
    if (!suggestionsContainer) return;
    suggestionsContainer.innerHTML = "";
    const list = document.createElement("ol");

    (suggestions || []).forEach((suggestion) => {
      const item = document.createElement("li");
      item.appendChild(safeText(suggestion.text || suggestion));
      list.appendChild(item);
    });

    suggestionsContainer.appendChild(list);
  }

  function renderChanges(changes) {
    if (!changesContainer) return;
    changesContainer.innerHTML = "";
    const list = document.createElement("ul");
    list.className = "stacked";

    (changes || []).forEach((change) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      title.appendChild(safeText(change.title || "Change"));

      const meta = document.createElement("div");
      meta.className = "muted";
      meta.appendChild(
        safeText(`${change.timestamp || ""} • ${change.owner || "Aponi"}`.trim())
      );

      const description = document.createElement("p");
      description.appendChild(safeText(change.summary || ""));

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(description);
      list.appendChild(item);
    });

    changesContainer.appendChild(list);
  }

  function showError(message) {
    if (!errorContainer) return;
    errorContainer.textContent = message;
    errorContainer.classList.add("visible");
  }

  async function loadData() {
    try {
      setModeBadge();
      const [status, kpis, agents, changes, suggestions] = await Promise.all([
        AponiAPI.apiGet("status"),
        AponiAPI.apiGet("kpis"),
        AponiAPI.apiGet("agents"),
        AponiAPI.apiGet("changes"),
        AponiAPI.apiGet("suggestions"),
      ]);

      renderStatus(status);
      renderKpis(kpis.items || kpis);
      renderAgents(agents.items || agents);
      renderChanges(changes.items || changes);
      renderSuggestions(suggestions.items || suggestions);
    } catch (err) {
      console.error(err); // eslint-disable-line no-console
      showError("Unable to load dashboard data. Check console for details.");
    }
  }

  document.addEventListener("DOMContentLoaded", loadData);
})();
