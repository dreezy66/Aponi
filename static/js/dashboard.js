document.addEventListener("DOMContentLoaded", async () => {
  const statusEl = document.getElementById("status");
  const kpiContainer = document.getElementById("kpi-container");
  const agentList = document.getElementById("agent-list");
  const refreshBtn = document.getElementById("refresh-agents");

  // Fetch system status
  const status = await apiGet("/api/status");
  if (status && status.ok) {
    statusEl.textContent = `✅ Online (${status.time})`;
  } else {
    statusEl.textContent = "⚠️ Offline";
    statusEl.style.color = "#f00";
  }

  // Fetch KPIs
  const kpis = await apiGet("/api/kpis");
  if (kpis) {
    kpiContainer.innerHTML = Object.entries(kpis)
      .map(([key, val]) => `<p><strong>${key}:</strong> ${val}</p>`)
      .join("");
  }

  // Load agent list
  async function loadAgents() {
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

  refreshBtn.addEventListener("click", loadAgents);
  loadAgents();
});