const AponiDashboardEvents = (() => {
  let source = null;

  function close() {
    if (source) {
      source.close();
      source = null;
    }
  }

  function init({ streamElement, onEvent, onError }) {
    if (!streamElement || !window.EventSource) {
      return;
    }
    close();
    source = new EventSource(`${APONI_API_BASE}/api/stream`);
    source.onmessage = event => {
      const data = event.data ? event.data.trim() : "";
      if (data) {
        streamElement.textContent += `${data}\n`;
        streamElement.scrollTop = streamElement.scrollHeight;
        if (onEvent) onEvent(data);
      }
    };
    source.onerror = () => {
      if (onError) onError("Stream error");
    };
  }

  return { init, close };
})();

window.AponiDashboardEvents = AponiDashboardEvents;
