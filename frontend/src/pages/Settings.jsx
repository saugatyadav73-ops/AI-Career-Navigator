import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { useApi, resetRoleCache } from "../utils/hooks";
import { Page, Panel, Field, Btn, Notice, Loading, Pill, Tabs } from "../components/ui";

function Settings() {
  const navigate = useNavigate();
  const me = useApi("/api/me");
  const prefs = useApi("/api/me/settings");
  const [tab, setTab] = useState("account");
  const [name, setName] = useState("");
  const [settings, setSettings] = useState(null);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [delPw, setDelPw] = useState("");
  const [msg, setMsg] = useState({ kind: "", text: "" });

  useEffect(() => { if (me.data?.student) setName(me.data.student.name); }, [me.data]);
  useEffect(() => { if (prefs.data?.settings) setSettings(prefs.data.settings); }, [prefs.data]);

  const act = async (fn, okText) => {
    setMsg({ kind: "", text: "" });
    try { const r = await fn(); setMsg({ kind: "ok", text: okText || r?.message || "Saved." }); return r; } catch (e) { setMsg({ kind: "error", text: e.message }); return null; }
  };
  const signOutLocal = () => {
    ["authToken", "student", "user"].forEach((k) => localStorage.removeItem(k));
    resetRoleCache();
    navigate("/login", { replace: true });
  };

  return (
    <Page title="Account Settings" subtitle="Manage your account, preferences and security.">
      <Tabs tabs={[["account", "Account"], ["prefs", "Preferences"], ["security", "Security"]]} value={tab} onChange={setTab} />
      <Notice kind={msg.kind === "ok" ? "ok" : "error"}>{msg.text}</Notice>
      <Loading loading={me.loading || prefs.loading} error={me.error || prefs.error}>
        {tab === "account" && me.data && (
          <Panel title="Account">
            <p className="fx-muted">Email: <b>{me.data.student.email}</b> <Pill kind="gray">{me.data.student.role}</Pill> {me.data.student.googleLinked && <Pill kind="green">Google linked</Pill>}</p>
            <div className="fx-row">
              <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Btn onClick={() => act(async () => { const r = await api.put("/api/me", { name }); localStorage.setItem("student", JSON.stringify({ ...JSON.parse(localStorage.getItem("student") || "{}"), name })); return r; }, "Name updated.")}>Save</Btn>
            </div>
          </Panel>
        )}
        {tab === "prefs" && settings && (
          <Panel title="Preferences">
            <div className="fx-row">
              <Field label="Theme" options={["light", "dark"]} value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })} />
              <Field label="Weekly study hours" type="number" min="1" max="80" value={settings.weeklyStudyHours} onChange={(e) => setSettings({ ...settings, weeklyStudyHours: e.target.value })} />
            </div>
            {[["inAppNotifications", "In-app notifications"], ["emailNotifications", "Email notifications"], ["leaderboardOptIn", "Show me on the leaderboard (first name + initial only)"], ["publicPortfolio", "Make my portfolio public"]].map(([key, text]) => (
              <p key={key}><label><input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })} /> {text}</label></p>
            ))}
            <Btn onClick={() => act(() => api.put("/api/me/settings", { ...settings, weeklyStudyHours: Number(settings.weeklyStudyHours) }), "Preferences saved.")}>Save preferences</Btn>
          </Panel>
        )}
        {tab === "security" && (
          <>
            <Panel title="Change password">
              <div className="fx-row">
                <Field label="Current password" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" />
                <Field label="New password (6+ characters)" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" />
                <Btn onClick={async () => { const r = await act(() => api.post("/api/me/change-password", pw), "Password changed."); if (r?.token) { localStorage.setItem("authToken", r.token); setPw({ currentPassword: "", newPassword: "" }); } }}>Update</Btn>
              </div>
            </Panel>
            <Panel title="Sessions">
              <p className="fx-muted">Sign out of every device (including this one).</p>
              <Btn kind="secondary" onClick={async () => { const r = await act(() => api.post("/api/auth/logout-all"), "Signed out everywhere."); if (r) signOutLocal(); }}>Sign out everywhere</Btn>
            </Panel>
            <Panel title="Delete account">
              <p className="fx-muted">Permanently deletes your account and all its data. This cannot be undone.</p>
              <div className="fx-row">
                <Field label="Confirm with your password" type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} autoComplete="current-password" />
                <Btn kind="danger" disabled={!delPw} onClick={async () => { if (window.confirm("Delete your account permanently?")) { const r = await act(() => api.del("/api/me", { password: delPw })); if (r) signOutLocal(); } }}>Delete my account</Btn>
              </div>
            </Panel>
          </>
        )}
      </Loading>
    </Page>
  );
}

export default Settings;
