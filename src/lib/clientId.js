const KEY = "vd-client-id";

function randomId() {
  // lightweight, readable ID is fine for anon analytics
  return "vd_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getClientId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // if localStorage blocked, fall back to ephemeral id
    return randomId();
  }
}
