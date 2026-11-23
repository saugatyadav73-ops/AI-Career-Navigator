import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useApi } from "../utils/hooks";
import { Page, Panel, Tabs, Field, Btn, Notice, Loading, Bar, Pill, Table, Stat, Empty } from "../components/ui";

const STATUSES = ["saved", "applied", "interview", "offer", "rejected", "withdrawn"];
const readinessKind = { ready: "green", almost: "amber", "needs-work": "red" };

function Dashboard() {
  const d = useApi("/api/jobs/placement-dashboard");
  const x = d.data?.dashboard;
  return (
    <Loading loading={d.loading} error={d.error}>
      {x && <>
        <div className="fx-grid"><Stat label="Career readiness" value={`${x.readiness}%`} /><Stat label="Placement checklist" value={`${x.checklistPercent}%`} /><Stat label="Applications tracked" value={x.funnel.tracked} hint={x.responseRate === null ? "" : `${x.responseRate}% reached interview/offer`} /><Stat label="Mock interview average" value={x.interviewAverage ?? "-"} /></div>
        <Panel title="Funnel">{["applied", "interview", "offer", "rejected"].map((k) => <Bar key={k} label={k} value={x.funnel[k]} max={Math.max(1, x.funnel.tracked)} suffix="" />)}</Panel>
        <div className="fx-grid">
          <Panel title="Placement checklist"><ul className="fx-list">{x.checklist.map((c) => <li key={c.item}><span>{c.done ? "✅" : "⬜"} {c.item}</span></li>)}</ul></Panel>
          <Panel title="Top matches">{x.topMatches.map((j) => <div key={j.id} className="fx-card"><b>{j.title}</b> <Pill kind={readinessKind[j.readiness]}>{j.matchScore}%</Pill><div className="fx-muted">Missing: {j.missing.join(", ") || "nothing"}</div></div>)}</Panel>
          <Panel title="Upcoming deadlines">{x.deadlines.length ? x.deadlines.map((e) => <div key={`${e.source}${e.id}`}>{e.title} <Pill kind={e.daysLeft <= 2 ? "red" : "amber"}>{e.daysLeft === 0 ? "today" : `${e.daysLeft}d`}</Pill></div>) : <Empty>No deadlines in the next 2 weeks.</Empty>}</Panel>
          <Panel title="Do next">{x.nextActions.map((a) => <div key={a.title} style={{ marginBottom: 8 }}><b>{a.title}</b><div className="fx-muted">{a.why}</div></div>)}</Panel>
        </div>
      </>}
    </Loading>
  );
}

function Find({ onSaved }) {
  const [filters, setFilters] = useState({ q: "", kind: "", role: "" });
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  const c = useApi(`/api/jobs/catalog${qs ? `?${qs}` : ""}`);
  const [msg, setMsg] = useState({ kind: "", text: "" });
  const [prep, setPrep] = useState(null);
  const save = async (j) => { try { await api.post("/api/jobs/saved", { jobRef: j.id, title: j.title, kind: j.kind }); setMsg({ kind: "ok", text: `Saved "${j.title}".` }); onSaved?.(); } catch (e) { setMsg({ kind: "error", text: e.message }); } };
  const track = async (j) => { try { await api.post("/api/jobs/applications", { company: "To be added", title: j.title, kind: j.kind, status: "saved" }); setMsg({ kind: "ok", text: "Added to tracker (edit the company there)." }); } catch (e) { setMsg({ kind: "error", text: e.message }); } };
  const prepare = async (j) => { try { setPrep((await api.post("/api/jobs/interview-prep", { jobId: j.id })).prep); } catch (e) { setMsg({ kind: "error", text: e.message }); } };
  return (
    <>
      <Panel title="Job & internship finder">
        <div className="fx-row"><Field label="Search" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="e.g. data, react, java" /><Field label="Type" options={[["", "Jobs & internships"], ["job", "Jobs"], ["internship", "Internships"]]} value={filters.kind} onChange={(e) => setFilters({ ...filters, kind: e.target.value })} />
          <Field label="Field" options={[["", "All"], ["fullstack", "Full stack"], ["aiml", "AI/ML"], ["data", "Data"], ["cyber", "Cyber"], ["backend", "Backend"], ["devops", "DevOps"], ["mobile", "Mobile"]]} value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} /></div>
        <p className="fx-muted">{c.data?.note}</p><Notice kind={msg.kind === "ok" ? "ok" : "error"}>{msg.text}</Notice>
        <Loading loading={c.loading} error={c.error}>
          {(c.data?.items || []).map((j) => (
            <div key={j.id} className="fx-card"><b>{j.title}</b> <Pill kind="gray">{j.kind}</Pill> <Pill kind={readinessKind[j.readiness]}>{j.matchScore}% match - {j.readiness}</Pill>
              <div className="fx-muted">Required: {j.required.join(", ")}{j.missing.length ? ` | You lack: ${j.missing.join(", ")}` : ""}</div>
              <div className="fx-row" style={{ marginTop: 8 }}><Btn small onClick={() => save(j)}>Save</Btn><Btn small kind="secondary" onClick={() => track(j)}>Track</Btn><Btn small kind="secondary" onClick={() => prepare(j)}>Interview prep</Btn>
                {Object.entries(j.links).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noreferrer noopener" style={{ fontSize: 13 }}>{k}</a>)}</div></div>
          ))}
        </Loading>
      </Panel>
      {prep && <Panel title={`Interview preparation: ${prep.job}`} actions={<Btn small kind="secondary" onClick={() => setPrep(null)}>Close</Btn>}>
        <p><b>Revise:</b> {prep.skillsToRevise.map((s) => <Pill key={s}>{s}</Pill>)}</p>
        <h4>Technical questions</h4><ol>{prep.technicalQuestions.map((q) => <li key={q.question}><b>{q.skill}:</b> {q.question}<div className="fx-muted">Answer: {q.answerHint}. {q.explanation}</div></li>)}</ol>
        <h4>Role questions</h4><ol>{prep.roleQuestions.map((q) => <li key={q.question}>{q.question}<div className="fx-muted">Key points: {q.keyPoints.join(", ")}</div></li>)}</ol>
        <h4>HR questions</h4><ul>{prep.hrQuestions.map((q) => <li key={q}>{q}</li>)}</ul><h4>Tips</h4><ul>{prep.tips.map((q) => <li key={q}>{q}</li>)}</ul>
        <Link to="/mock-interview"><Btn small>Practise in Mock Interview</Btn></Link></Panel>}
    </>
  );
}

function Recommended() {
  const r = useApi("/api/jobs/recommendations");
  const list = (arr) => arr.map((j) => <div key={j.id} className="fx-card"><b>{j.title}</b> <Pill kind={readinessKind[j.readiness]}>{j.matchScore}%</Pill><div className="fx-muted">Missing: {j.missing.join(", ") || "nothing"}</div></div>);
  return (
    <Loading loading={r.loading} error={r.error}>
      {r.data && <div className="fx-grid"><Panel title="Recommended jobs">{list(r.data.jobs)}</Panel><Panel title="Recommended internships">{list(r.data.internships)}</Panel></div>}
      {r.data && <p className="fx-muted">Based on your skills: {r.data.basedOn.join(", ") || "none yet - add skills in your profile"}</p>}
    </Loading>
  );
}

function Saved({ refreshKey }) {
  const s = useApi(`/api/jobs/saved?k=${refreshKey}`);
  const [form, setForm] = useState({ title: "", company: "", deadline: "", url: "" });
  const [err, setErr] = useState("");
  const run = async (fn) => { setErr(""); try { await fn(); s.reload(); } catch (e) { setErr(e.message); } };
  return (
    <>
      <Panel title="Save a job"><div className="fx-row"><Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /><Field label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /><Field label="Link" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <Btn onClick={() => run(async () => { await api.post("/api/jobs/saved", form); setForm({ title: "", company: "", deadline: "", url: "" }); })}>Save</Btn></div><Notice kind="error">{err}</Notice></Panel>
      <Panel title="Saved jobs"><Loading loading={s.loading} error={s.error}>
        <Table head={["Job", "Company", "Deadline", ""]} empty="No saved jobs." rows={(s.data?.saved || []).map((j) => [j.url ? <a key="a" href={j.url} target="_blank" rel="noreferrer noopener">{j.title}</a> : j.title, j.company || "-", j.deadline || "-", <span key="b" className="fx-inline"><Btn small onClick={() => run(async () => { await api.post("/api/jobs/applications", { company: j.company || "Unknown", title: j.title, kind: j.kind, deadline: j.deadline, url: j.url, status: "applied" }); })}>Mark applied</Btn><Btn small kind="danger" onClick={() => run(() => api.del(`/api/jobs/saved/${j.id}`))}>Remove</Btn></span>])} /></Loading></Panel>
    </>
  );
}

function Tracker() {
  const a = useApi("/api/jobs/applications");
  const [form, setForm] = useState({ company: "", title: "", kind: "job", status: "applied", deadline: "", url: "", notes: "" });
  const [err, setErr] = useState("");
  const run = async (fn) => { setErr(""); try { await fn(); a.reload(); } catch (e) { setErr(e.message); } };
  return (
    <>
      <Panel title="Track an application">
        <div className="fx-row"><Field label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /><Field label="Role" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Type" options={["job", "internship"]} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} /><Field label="Status" options={STATUSES} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} /></div>
        <div className="fx-row"><Field label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /><Field label="Link" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /><Field label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Btn onClick={() => run(async () => { await api.post("/api/jobs/applications", form); setForm({ ...form, company: "", title: "", deadline: "", url: "", notes: "" }); })}>Add</Btn></div>
        <Notice kind="error">{err}</Notice>
      </Panel>
      <Panel title="Application status">
        <Loading loading={a.loading} error={a.error}>
          {a.data && <p>{STATUSES.map((s) => <Pill key={s} kind={s === "offer" ? "green" : s === "rejected" ? "red" : "gray"}>{s}: {a.data.counts[s]}</Pill>)}</p>}
          <Table head={["Company", "Role", "Type", "Status", "Deadline", ""]} empty="No applications tracked yet." rows={(a.data?.applications || []).map((x) => [x.company, x.title, x.kind,
            <select key="s" value={x.status} onChange={(e) => run(() => api.put(`/api/jobs/applications/${x.id}`, { status: e.target.value }))} aria-label="Status">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>, x.deadline || "-", <Btn key="d" small kind="danger" onClick={() => run(() => api.del(`/api/jobs/applications/${x.id}`))}>Delete</Btn>])} />
        </Loading>
      </Panel>
    </>
  );
}

function Deadlines() {
  const [days, setDays] = useState(14);
  const d = useApi(`/api/jobs/deadlines?days=${days}`);
  return (
    <Panel title="Deadline alerts" actions={<select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Window"><option value={7}>Next 7 days</option><option value={14}>Next 14 days</option><option value={30}>Next 30 days</option></select>}>
      <Loading loading={d.loading} error={d.error}>
        <Table head={["Role", "Company", "Deadline", "Left", "From"]} empty="No upcoming deadlines. Add deadlines to saved jobs and applications." rows={(d.data?.deadlines || []).map((x) => [x.title, x.company || "-", x.deadline, <Pill key="p" kind={x.daysLeft <= 2 ? "red" : x.daysLeft <= 7 ? "amber" : "gray"}>{x.daysLeft === 0 ? "today" : `${x.daysLeft} days`}</Pill>, x.source])} />
        <p className="fx-muted">Deadlines within 3 days also appear in your notifications.</p>
      </Loading>
    </Panel>
  );
}

function Jobs() {
  const [tab, setTab] = useState("dashboard");
  const [k, setK] = useState(0);
  return (
    <Page title="Jobs & Placement" subtitle="Find roles, track applications, never miss a deadline, and follow your placement progress.">
      <Tabs tabs={[["dashboard", "Placement dashboard"], ["find", "Find jobs & internships"], ["recommended", "Recommended"], ["saved", "Saved"], ["tracker", "Application tracker"], ["deadlines", "Deadlines"]]} value={tab} onChange={setTab} />
      {tab === "dashboard" && <Dashboard />}{tab === "find" && <Find onSaved={() => setK(k + 1)} />}{tab === "recommended" && <Recommended />}{tab === "saved" && <Saved refreshKey={k} />}{tab === "tracker" && <Tracker />}{tab === "deadlines" && <Deadlines />}
    </Page>
  );
}

export default Jobs;
