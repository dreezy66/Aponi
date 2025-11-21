// Base URL for Render backend; allows override via global for local dev
const DEFAULT_APONI_API_BASE = "https://aponi-dashboard.onrender.com";
const APONI_API_BASE =
  (typeof window !== "undefined" && window.APONI_API_BASE) || DEFAULT_APONI_API_BASE;

/**
 * Helper function for GET requests with consistent error handling.
 * @param {string} path
 * @returns {Promise<any|null>}
 */
async function apiGet(path) {
  try {
    const res = await fetch(`${APONI_API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("API GET failed:", path, err);
    return null;
  }
}

// Export for testing environments
if (typeof module !== "undefined") {
  module.exports = {
    apiGet,
    APONI_API_BASE,
  };
}
