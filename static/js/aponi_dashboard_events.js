const AponiDashboardEvents = (() => {
  let source = null;

  function close() {
    if (source) {
      source.close();
      source = null;
    }
  }

  function init({ streamElement, onEvent, onError }) {
    if (!streamElement) {
      return;
    }
    close();
    const mode = AponiAPI.getMode();

    if (mode === "mock") {
      fetch("./mock/stream.json")
        .then(res => (res.ok ? res.json() : []))
        .then(entries => {
          (entries || []).forEach(entry => {
            const line = typeof entry === "string" ? entry : entry.message;
            if (!line) return;
            streamElement.textContent += `${line}\n`;
          });
          streamElement.scrollTop = streamElement.scrollHeight;
        })
        .catch(() => {
          if (onError) onError("Stream demo unavailable");
        });
      return;
    }

    source = AponiAPI.getStream();
    if (!source) {
      if (onError) onError("Stream unavailable");
      return;
    }

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
