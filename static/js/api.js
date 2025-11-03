// Base URL for Render backend
const APONI_API_BASE = "https://aponi-dashboard.onrender.com";

// Helper function for GET requests
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