import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useApi } from "../utils/hooks";
import { Page, Panel, Tabs, Btn, Notice, Loading, Bar, Pill, Stat, Empty, when } from "../components/ui";

function Skills() {
  const s = useApi("/api/analytics/skills");
  const d = s.data;
  return (
    <Loading loading={s.loading} error={s.error}>
      {d && <>
        <Panel title="Assessment performance by subject">
          {d.assessed.length ? d.assessed.map((x) => <div key={`${x.type}${x.subject}`}><Bar label={`${x.subject} (${x.type})`} value={x.latest} /><div className="fx-muted" style={{ marginTop: -4 }}>best {x.best}% - {x.attempts} attempt(s){x.change ? ` - ${x.change > 0 ? "+" : ""}${x.change} since first` : ""}</div></div>) : <Empty>Take an assessment to see skill-wise performance. <Link to="/practice">Start</Link></Empty>}
          {d.weakTopics.length > 0 && <p><b>Weak topics:</b> {d.weakTopics.map((t) => <Pill key={t.topic} kind="red">{t.topic} {t.percent}%</Pill>)}</p>}
        </Panel>
        {d.targetRole && <Panel title={`Skills for ${d.targetRole.name}`}>{d.targetRole.skills.map((x) => <span key={x.skill} className={`fx-pill ${x.have ? "green" : "red"}`}>{x.have ? "✓" : "✗"} {x.skill}{x.weight === 3 ? " ★" : ""}</span>)}<p className="fx-muted">★ = high importance. Green = you have it.</p></Panel>}
      </>}
    </Loading>
  );
}

function Timeline() {
  const t = useApi("/api/analytics/timeline");
  const icon = { account: "🎉", assessment: "🧠", interview: "🎤", project: "💻", certificate: "📜", application: "💼", badge: "🏅", readiness: "📈" };
  return (
    <Panel title="Career progress timeline"><Loading loading={t.loading} error={t.error}>
      <ul className="fx-list">{(t.data?.events || []).map((e, i) => <li key={i}><span>{icon[e.type] || "•"} <b>{e.title}</b> {e.detail && <span className="fx-muted">- {e.detail}</span>}</span><span className="fx-muted">{when(e.at)}</span></li>)}</ul>
    </Loading></Panel>
  );
}

function Radar({ axes, series }) {
  const size = 280, c = size / 2, r = 100, n = axes.length;
  if (n < 3) return <Empty>Select careers with 3+ skills to draw the radar.</Empty>;
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; const rr = (v / 3) * r; return [c + rr * Math.cos(a), c + rr * Math.sin(a)]; };
  const poly = (vals) => vals.map((v, i) => pt(i, v).join(",")).join(" ");
  const colors = ["#2563eb", "#7c3aed", "#f59e0b"];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 380 }} role="img" aria-label="Career skill radar">
      {[1, 2, 3].map((k) => <polygon key={k} points={poly(axes.map(() => k))} fill="none" stroke="#e2e8f0" />)}
      {axes.map((a, i) => { const [x, y] = pt(i, 3.5); return <text key={a} x={x} y={y} fontSize="8" textAnchor="middle" fill="#64748b">{a}</text>; })}
      {series.map((s, k) => <polygon key={s.career} points={poly(s.required)} fill={colors[k % 3]} fillOpacity="0.15" stroke={colors[k % 3]} />)}
      {series[0] && <polygon points={poly(series[0].you)} fill="#16a34a" fillOpacity="0.25" stroke="#16a34a" strokeDasharray="3 2" />}
    </svg>
  );
}
function Charts() {
  const c = useApi("/api/analytics/career-charts");
  return (
    <Loading loading={c.loading} error={c.error}>
      {c.data && <>
        <Panel title="Career match comparison">{c.data.bar.map((b) => <Bar key={b.careerId} label={b.career} value={b.match} />)}</Panel>
        <Panel title="Skill radar (top 2 careers vs you)">
          <Radar axes={c.data.radar.axes} series={c.data.radar.series} />
          <p className="fx-muted">{c.data.radar.series.map((s, i) => <span key={s.career} style={{ marginRight: 12 }}><b style={{ color: ["#2563eb", "#7c3aed", "#f59e0b"][i % 3] }}>■</b> {s.career}</span>)}<b style={{ color: "#16a34a" }}>■</b> you</p>
        </Panel>
      </>}
    </Loading>
  );
}

function Demand() {
  const d = useApi("/api/analytics/skill-demand");
  return (
    <Panel title="Skill demand analytics"><Loading loading={d.loading} error={d.error}>
      {d.data && <><p className="fx-muted">{d.data.note} Based on {d.data.basedOn}.</p>
        {d.data.inDemandYouLack.length > 0 && <Notice kind="info">In-demand skills you lack: <b>{d.data.inDemandYouLack.join(", ")}</b></Notice>}
        {d.data.skills.map((s) => <Bar key={s.skill} label={`${s.skill}${s.youHave ? " ✓" : ""}`} value={s.demandPercent} />)}</>}
    </Loading></Panel>
  );
}

function Trends() {
  const t = useApi("/api/analytics/trends");
  return (
    <Panel title="Career trend dashboard"><Loading loading={t.loading} error={t.error}>
      <p className="fx-muted">{t.data?.note}</p>
      <div className="fx-grid">{(t.data?.trends || []).map((x) => <div key={x.id} className="fx-card"><b>{x.area}</b> <Pill kind={/very/i.test(x.outlook) ? "green" : "amber"}>{x.outlook}</Pill><p>{x.why}</p><p>{x.skills.map((s) => <Pill key={s} kind="gray">{s}</Pill>)}</p>{x.yourMatch !== null && <Bar label="Your match" value={x.yourMatch} />}</div>)}</div>
    </Loading></Panel>
  );
}

function Report() {
  const r = useApi("/api/analytics/report");
  const [msg, setMsg] = useState("");
  const rep = r.data?.report;
  return (
    <Panel title="Career report" actions={<Btn onClick={async () => { try { await api.download("/api/analytics/report/download", "career-report.html"); setMsg("Report downloaded. Open it and use Print > Save as PDF if you need a PDF."); } catch (e) { setMsg(e.message); } }}>Download report</Btn>}>
      <Notice kind="info">{msg}</Notice>
      <Loading loading={r.loading} error={r.error}>
        {rep && <><div className="fx-grid"><Stat label="Career readiness" value={`${rep.readiness}%`} /><Stat label="Profile" value={`${rep.profileCompletion}%`} /><Stat label="Portfolio score" value={rep.portfolioStrength} /><Stat label="Interview average" value={rep.interviewAverage ?? "-"} /></div>
          <h4>Best-fit careers</h4>{rep.topCareers.map((c) => <Bar key={c.career} label={c.career} value={c.match} />)}<h4>Recommended next steps</h4><ul>{rep.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul></>}
      </Loading>
    </Panel>
  );
}

function Notifications() {
  const n = useApi("/api/notifications");
  const [msg, setMsg] = useState("");
  const run = async (fn) => { try { await fn(); n.reload(); } catch (e) { setMsg(e.message); } };
  return (
    <Panel title={`Progress notifications${n.data?.unread ? ` (${n.data.unread} new)` : ""}`} actions={<span className="fx-inline"><Btn small kind="secondary" onClick={() => run(async () => { const d = await api.post("/api/notifications/refresh"); setMsg(d.created ? `${d.created} new update(s).` : d.note || "You are up to date."); })}>Check for updates</Btn><Btn small kind="secondary" onClick={() => run(() => api.post("/api/notifications/read-all"))}>Mark all read</Btn></span>}>
      <Notice kind="info">{msg}</Notice>
      <Loading loading={n.loading} error={n.error}>
        <ul className="fx-list">{(n.data?.notifications || []).map((x) => <li key={x.id} style={{ opacity: x.read ? 0.6 : 1 }}><div><b>{x.title}</b>{x.body && <div className="fx-muted">{x.body}</div>}<div className="fx-muted">{when(x.createdAt)}</div></div>
          <span className="fx-inline">{x.link && <Link to={x.link}><Btn small>Open</Btn></Link>}{!x.read && <Btn small kind="secondary" onClick={() => run(() => api.post(`/api/notifications/${x.id}/read`))}>Read</Btn>}<Btn small kind="secondary" onClick={() => run(() => api.del(`/api/notifications/${x.id}`))}>✕</Btn></span></li>)}</ul>
        {n.data?.notifications.length === 0 && <Empty>No notifications yet. Press "Check for updates".</Empty>}
      </Loading>
    </Panel>
  );
}

function Insights() {
  const [tab, setTab] = useState("skills");
  return (
    <Page title="Insights & Reports" subtitle="Skill analytics, timeline, comparison charts, market demand, trends, reports and notifications.">
      <Tabs tabs={[["skills", "Skill analytics"], ["timeline", "Timeline"], ["charts", "Comparison charts"], ["demand", "Skill demand"], ["trends", "Career trends"], ["report", "Report"], ["notes", "Notifications"]]} value={tab} onChange={setTab} />
      {tab === "skills" && <Skills />}{tab === "timeline" && <Timeline />}{tab === "charts" && <Charts />}{tab === "demand" && <Demand />}{tab === "trends" && <Trends />}{tab === "report" && <Report />}{tab === "notes" && <Notifications />}
    </Page>
  );
}

export default Insights;
