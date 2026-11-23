// Small authenticated API client used by the checklist feature pages.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getToken = () => {
  try { return localStorage.getItem("authToken"); } catch { return null; }
};

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const type = res.headers.get("content-type") || "";
  const data = type.includes("json") ? await res.json() : await res.text();
  if (!res.ok || data?.success === false) {
    const message = res.status === 401 && token ? "Your session has expired. Please log in again." : data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body = {}) => request("POST", path, body),
  put: (path, body = {}) => request("PUT", path, body),
  patch: (path, body = {}) => request("PATCH", path, body),
  del: (path, body) => request("DELETE", path, body),
  // Download a file (CSV / HTML report) with the auth header, then save it from a blob URL.
  async download(path, fallbackName) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      let message = `Download failed (${res.status})`;
      try { message = (await res.json()).message || message; } catch { /* not json */ }
      throw new Error(message);
    }
    const disposition = res.headers.get("content-disposition") || "";
    const name = (disposition.match(/filename="?([^"]+)"?/) || [])[1] || fallbackName;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
