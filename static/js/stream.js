// Live Server-Sent Events stream
const streamLog = document.getElementById("stream-log");

if (!!window.EventSource) {
  const stream = new EventSource(`${APONI_API_BASE}/api/stream`);
  stream.onmessage = function (e) {
    const data = e.data.trim();
    if (data) {
      streamLog.textContent += data + "\n";
      streamLog.scrollTop = streamLog.scrollHeight;
    }
  };
  stream.onerror = function () {
    streamLog.textContent += "[Stream error]\n";
  };
} else {
  streamLog.textContent = "SSE not supported by browser.";
}