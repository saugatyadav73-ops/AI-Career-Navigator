import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api";

// Renders "Sign in with Google" only when the server has GOOGLE_CLIENT_ID configured.
export default function GoogleButton() {
  const navigate = useNavigate();
  const holder = useRef(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/auth/google/config`).then((r) => r.json()).then((c) => alive && setConfig(c)).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!config?.enabled) return undefined;
    const init = () => {
      if (!window.google?.accounts?.id || !holder.current) return;
      window.google.accounts.id.initialize({
        client_id: config.clientId,
        callback: async ({ credential }) => {
          try {
            const res = await fetch(`${API_BASE}/api/auth/google`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
            const data = await res.json();
            if (!res.ok || !data.success) { setError(data.message || "Google sign-in failed."); return; }
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("student", JSON.stringify(data.student));
            localStorage.setItem("user", JSON.stringify(data.student));
            navigate("/dashboard");
          } catch { setError("Unable to reach the server."); }
        },
      });
      window.google.accounts.id.renderButton(holder.current, { theme: "outline", size: "large", width: 300 });
    };
    if (window.google?.accounts?.id) { init(); return undefined; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
    return () => { script.onload = null; };
  }, [config, navigate]);

  if (!config?.enabled) return null;
  return (
    <div style={{ marginTop: 16, textAlign: "center" }}>
      <div style={{ margin: "8px 0", color: "#94a3b8", fontSize: 13 }}>or</div>
      <div ref={holder} style={{ display: "flex", justifyContent: "center" }} />
      {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
    </div>
  );
}
