// Keeps the browser's per-student localStorage data in step with the server (fire-and-forget, never blocks the UI).
// Existing pages keep reading/writing localStorage exactly as before; this adds a server copy so that
// analytics, faculty views and cross-device sign-in work.
import { API_BASE, getToken } from "./api";

const KEY_OK = /^[A-Za-z0-9_-]{1,80}$/;
const pending = new Map();
let timer = null;

const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

async function flush() {
  timer = null;
  const batch = [...pending.entries()];
  pending.clear();
  for (const [kind, data] of batch) {
    try {
      if (data === undefined) await fetch(`${API_BASE}/api/me/data/${kind}`, { method: "DELETE", headers: headers() });
      else await fetch(`${API_BASE}/api/me/data/${kind}`, { method: "PUT", headers: headers(), body: JSON.stringify({ data }) });
    } catch { /* offline or server down: localStorage still has the data */ }
  }
}

function queue(kind, data) {
  if (!getToken() || !KEY_OK.test(kind)) return;
  pending.set(kind, data);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 800);
}

export const queueSync = (kind, data) => queue(kind, data);
export const queueRemove = (kind) => queue(kind, undefined);

/** Once per browser session: copy any server data missing locally (new device / cleared storage), then reload once. */
export async function hydrateFromServer() {
  try {
    const token = getToken();
    const student = JSON.parse(localStorage.getItem("student") || "null");
    if (!token || !student?.id || sessionStorage.getItem(`hydrated_${student.id}`)) return;
    sessionStorage.setItem(`hydrated_${student.id}`, "1");
    const res = await fetch(`${API_BASE}/api/me/data`, { headers: headers() });
    if (!res.ok) return;
    const { data = {} } = await res.json();
    let wrote = 0;
    for (const [kind, value] of Object.entries(data)) {
      const key = `student_${student.id}_${kind}`;
      if (localStorage.getItem(key) === null && value !== null) { localStorage.setItem(key, JSON.stringify(value)); wrote++; }
    }
    if (wrote > 0) window.location.reload();
  } catch { /* ignore */ }
}
