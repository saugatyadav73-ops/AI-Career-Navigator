import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

// Forgot + reset password in one flow: email -> 6-digit code -> new password.
function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: "", text: "" });

  const run = async (fn) => {
    setBusy(true); setMsg({ kind: "", text: "" });
    try { await fn(); } catch (e) { setMsg({ kind: "error", text: e.message }); } finally { setBusy(false); }
  };

  const sendCode = (e) => {
    e.preventDefault();
    run(async () => {
      const d = await api.post("/api/auth/forgot-password", { email: email.trim() });
      setStep(2);
      setMsg({ kind: "ok", text: d.devCode ? `${d.message} (Development mode: your code is ${d.devCode})` : d.message });
    });
  };
  const reset = (e) => {
    e.preventDefault();
    run(async () => {
      const d = await api.post("/api/auth/reset-password", { email: email.trim(), code: code.trim(), newPassword: password });
      setMsg({ kind: "ok", text: d.message });
      setTimeout(() => navigate("/login"), 1200);
    });
  };

  const input = { width: "100%", boxSizing: "border-box" };
  const label = { display: "block", textAlign: "left", marginTop: 10, fontWeight: 600 };
  return (
    <div className="auth-container" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div className="auth-card" style={{ width: "100%", maxWidth: 430, boxSizing: "border-box" }}>
        <h1>Reset your password</h1>
        <p>{step === 1 ? "Enter your account email and we will send a 6-digit code." : "Enter the code and choose a new password."}</p>
        {msg.text && <p role="status" style={{ color: msg.kind === "error" ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{msg.text}</p>}
        {step === 1 ? (
          <form onSubmit={sendCode} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="fp-email" style={label}>Email</label>
            <input id="fp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={input} autoComplete="email" />
            <button type="submit" disabled={busy} style={{ marginTop: 15 }}>{busy ? "Sending..." : "Send code"}</button>
          </form>
        ) : (
          <form onSubmit={reset} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="fp-code" style={label}>6-digit code</label>
            <input id="fp-code" inputMode="numeric" pattern="\d{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} style={input} autoComplete="one-time-code" />
            <label htmlFor="fp-pass" style={label}>New password</label>
            <input id="fp-pass" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} style={input} autoComplete="new-password" />
            <button type="submit" disabled={busy} style={{ marginTop: 15 }}>{busy ? "Updating..." : "Update password"}</button>
            <button type="button" className="link" onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>Use a different email / resend code</button>
          </form>
        )}
        <p style={{ marginTop: 20, textAlign: "center" }}>
          <span className="link" style={{ cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/login")}>Back to login</span>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
