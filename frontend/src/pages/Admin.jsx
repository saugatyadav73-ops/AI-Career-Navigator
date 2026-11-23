import { useState } from "react";
import { api } from "../utils/api";
import { useApi, useRole } from "../utils/hooks";
import { Page, Panel, Tabs, Field, Btn, Notice, Loading, Bar, Pill, Table, Stat, Empty, when } from "../components/ui";

const riskKind = { high: "red", medium: "amber", low: "gray", none: "green" };

function Overview() {
  const o = useApi("/api/admin/overview");
  const x = o.data?.overview;
  return (
    <Loading loading={o.loading} error={o.error}>
      {x && <>
        <div className="fx-grid"><Stat label="Total users" value={x.users.total} hint={`${x.users.students} students, ${x.users.faculty} faculty, ${x.users.admins} admins`} /><Stat label="Active last 7 days" value={x.users.activeLast7Days} /><Stat label="New last 7 days" value={x.users.newLast7Days} /><Stat label="Deactivated" value={x.users.deactivated} /></div>
        <Panel title="Platform content"><div className="fx-grid">{Object.entries(x.content).map(([k, v]) => <Stat key={k} label={k.replace(/([A-Z])/g, " $1")} value={v} />)}</div></Panel>
        <Panel title="AI calls (last 24h)">{x.ai.last24h.length ? x.ai.last24h.map((r) => <Pill key={r.status} kind={r.status === "success" ? "green" : "red"}>{r.status}: {r.c}</Pill>) : <Empty>No AI calls recorded.</Empty>}</Panel>
      </>}
    </Loading>
  );
}

function Students() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("readiness");
  const s = useApi(`/api/faculty/students?sort=${sort}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState("");
  const open = async (id) => { try { setDetail(await api.get(`/api/faculty/students/${id}`)); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <Panel title="Student progress monitor" actions={<Btn small onClick={() => api.download("/api/faculty/export/students.csv", "students.csv").catch((e) => setMsg(e.message))}>Export CSV</Btn>}>
        <div className="fx-row"><Field label="Search name / email" value={q} onChange={(e) => setQ(e.target.value)} /><Field label="Sort by" options={[["readiness", "Readiness"], ["avgScore", "Assessment avg"], ["xp", "XP"], ["risk", "Risk"], ["name", "Name"]]} value={sort} onChange={(e) => setSort(e.target.value)} /></div>
        <Notice kind="error">{msg}</Notice>
        <Loading loading={s.loading} error={s.error}>
          <Table head={["Student", "College", "Readiness", "Assess. avg", "Profile", "XP", "Risk", ""]} empty="No students found." rows={(s.data?.students || []).map((x) => [<span key="n"><b>{x.name}</b><div className="fx-muted">{x.email}</div></span>, x.college || "-", `${x.readiness}%`, x.avgScore === null ? "-" : `${x.avgScore}%`, `${x.profileCompletion}%`, x.xp, <Pill key="r" kind={riskKind[x.risk.level]}>{x.risk.level}</Pill>, <Btn key="o" small kind="secondary" onClick={() => open(x.id)}>Details</Btn>])} />
          {s.data && <p className="fx-muted">{s.data.total} students</p>}
        </Loading>
      </Panel>
      {detail && <Panel title={`${detail.student.name} - individual analytics`} actions={<Btn small kind="secondary" onClick={() => setDetail(null)}>Close</Btn>}>
        <div className="fx-grid"><Stat label="Readiness" value={`${detail.student.readiness}%`} /><Stat label="Target role" value={detail.student.targetRole || "-"} /><Stat label="Role coverage" value={detail.student.roleCoverage === null ? "-" : `${detail.student.roleCoverage}%`} /><Stat label="Streak" value={detail.student.streak} /></div>
        {detail.student.risk.reasons.length > 0 && <Notice kind="info"><b>Risk factors:</b> {detail.student.risk.reasons.join("; ")}</Notice>}
        <h4>Subjects</h4>{detail.assessments.subjects.map((x) => <Bar key={`${x.type}${x.subject}`} label={`${x.subject} (${x.attempts}x)`} value={x.latest} />)}
        <p><b>Weak topics:</b> {detail.assessments.weakTopics.map((t) => <Pill key={t.topic} kind="red">{t.topic} {t.percent}%</Pill>)}</p>
        <p><b>Projects:</b> {detail.projects.map((p) => `${p.title} (${p.status})`).join(", ") || "none"} - <b>Interviews:</b> {detail.interviews.length}</p>
      </Panel>}
    </>
  );
}

function AtRisk() {
  const r = useApi("/api/faculty/at-risk");
  return (
    <Panel title="At-risk student detection"><Loading loading={r.loading} error={r.error}>
      {r.data && <p className="fx-muted">Criteria: inactive {r.data.criteria.inactiveDays}+ days, assessment average below {r.data.criteria.lowScore}%, no assessments, profile under {r.data.criteria.lowProfile}% or 3+ weak topics. {r.data.count} student(s) flagged.</p>}
      <Table head={["Student", "Risk", "Why", "Readiness"]} empty="No at-risk students." rows={(r.data?.students || []).map((s) => [<span key="n"><b>{s.name}</b><div className="fx-muted">{s.email}</div></span>, <Pill key="r" kind={riskKind[s.risk.level]}>{s.risk.level}</Pill>, s.risk.reasons.join("; "), `${s.readiness}%`])} />
    </Loading></Panel>
  );
}

function College() {
  const a = useApi("/api/faculty/analytics");
  const x = a.data?.analytics;
  return (
    <Loading loading={a.loading} error={a.error}>
      {x && <>
        <div className="fx-grid"><Stat label="Students" value={x.students} /><Stat label="Avg readiness" value={x.averageReadiness === null ? "-" : `${x.averageReadiness}%`} /><Stat label="Avg assessment" value={x.averageAssessmentScore === null ? "-" : `${x.averageAssessmentScore}%`} /><Stat label="Avg profile" value={x.averageProfileCompletion === null ? "-" : `${x.averageProfileCompletion}%`} /></div>
        <Panel title="Readiness bands">{Object.entries(x.readinessBands).map(([k, v]) => <Bar key={k} label={`${k}%`} value={v} max={Math.max(1, x.students)} suffix="" />)}</Panel>
        <Panel title="Risk distribution">{Object.entries(x.risk).map(([k, v]) => <Pill key={k} kind={riskKind[k]}>{k}: {v}</Pill>)}</Panel>
        <Panel title="Subject averages (weakest first)">{x.subjectAverages.length ? x.subjectAverages.map((s) => <Bar key={s.subject} label={`${s.subject} (${s.students})`} value={s.average} />) : <Empty>No assessment data yet.</Empty>}</Panel>
        <div className="fx-grid"><Panel title="Career interest">{x.careerInterest.map((c) => <div key={c.career}>{c.career}: <b>{c.students}</b></div>)}{x.careerInterest.length === 0 && <Empty>None yet.</Empty>}</Panel><Panel title="Most common skills">{x.topSkills.map((s) => <Pill key={s.skill}>{s.skill} {s.students}</Pill>)}</Panel></div>
      </>}
    </Loading>
  );
}

function Users() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const u = useApi(`/api/admin/users?pageSize=50${role ? `&role=${role}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  const [msg, setMsg] = useState("");
  const patch = async (id, body) => { setMsg(""); try { await api.patch(`/api/admin/users/${id}`, body); u.reload(); } catch (e) { setMsg(e.message); } };
  return (
    <Panel title="User management" actions={<Btn small onClick={() => api.download("/api/admin/export/users", "users.csv").catch((e) => setMsg(e.message))}>Export users</Btn>}>
      <div className="fx-row"><Field label="Search" value={q} onChange={(e) => setQ(e.target.value)} /><Field label="Role" options={[["", "All"], "student", "faculty", "admin"]} value={role} onChange={(e) => setRole(e.target.value)} /></div>
      <Notice kind="error">{msg}</Notice>
      <Loading loading={u.loading} error={u.error}>
        <Table head={["User", "Role", "Status", "Last active", ""]} empty="No users." rows={(u.data?.users || []).map((x) => [<span key="n"><b>{x.name}</b><div className="fx-muted">{x.email}</div></span>,
          <select key="r" value={x.role} onChange={(e) => patch(x.id, { role: e.target.value })} aria-label={`Role for ${x.name}`}><option>student</option><option>faculty</option><option>admin</option></select>, <Pill key="s" kind={x.active ? "green" : "red"}>{x.active ? "active" : "deactivated"}</Pill>, when(x.lastActiveAt),
          <Btn key="a" small kind={x.active ? "danger" : "secondary"} onClick={() => patch(x.id, { isActive: !x.active })}>{x.active ? "Deactivate" : "Reactivate"}</Btn>])} />
        {u.data && <p className="fx-muted">{u.data.total} users</p>}
      </Loading>
    </Panel>
  );
}

function Questions() {
  const q = useApi("/api/manage/questions");
  const [f, setF] = useState({ subject: "", level: "beginner", question: "", options: "", correct: "", explanation: "" });
  const [msg, setMsg] = useState("");
  const run = async (fn) => { setMsg(""); try { await fn(); q.reload(); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <Panel title="Assessment management - add a question">
        <div className="fx-row"><Field label="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="e.g. python or a custom subject" /><Field label="Level" options={["beginner", "medium", "advanced"]} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })} /></div>
        <div className="fx-row"><Field label="Question" textarea value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} /></div>
        <div className="fx-row"><Field label="Options (one per line, include the correct one)" textarea value={f.options} onChange={(e) => setF({ ...f, options: e.target.value })} /><Field label="Correct answer (exactly as written above)" value={f.correct} onChange={(e) => setF({ ...f, correct: e.target.value })} /><Field label="Explanation" value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} /></div>
        <Btn onClick={() => run(async () => { await api.post("/api/manage/questions", { ...f, options: f.options.split("\n") }); setF({ ...f, question: "", options: "", correct: "", explanation: "" }); })}>Add question</Btn><Notice kind="error">{msg}</Notice>
      </Panel>
      <Panel title="Custom questions"><Loading loading={q.loading} error={q.error}>
        <Table head={["Subject", "Level", "Question", "Correct", "Active", ""]} empty="No custom questions yet. They are mixed into student assessments for the same subject." rows={(q.data?.questions || []).map((x) => [x.subject, x.level, x.question, x.correct, <input key="a" type="checkbox" checked={x.active} onChange={(e) => run(() => api.put(`/api/manage/questions/${x.id}`, { active: e.target.checked }))} aria-label="Active" />, <Btn key="d" small kind="danger" onClick={() => run(() => api.del(`/api/manage/questions/${x.id}`))}>Delete</Btn>])} />
      </Loading></Panel>
    </>
  );
}

function Courses() {
  const c = useApi("/api/courses");
  const [f, setF] = useState({ title: "", skill: "", provider: "", url: "", level: "beginner", hours: "" });
  const [msg, setMsg] = useState("");
  const run = async (fn) => { setMsg(""); try { await fn(); c.reload(); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <Panel title="Course management - add a learning resource">
        <div className="fx-row"><Field label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /><Field label="Skill" value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value })} /><Field label="Provider" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} /></div>
        <div className="fx-row"><Field label="Link (https://)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /><Field label="Level" options={["beginner", "medium", "advanced"]} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })} /><Field label="Hours" type="number" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} />
          <Btn onClick={() => run(async () => { await api.post("/api/manage/courses", f); setF({ title: "", skill: "", provider: "", url: "", level: "beginner", hours: "" }); })}>Add course</Btn></div><Notice kind="error">{msg}</Notice>
      </Panel>
      <Panel title="Courses"><Loading loading={c.loading} error={c.error}>
        <Table head={["Course", "Skill", "Provider", "Level", "Hours", ""]} empty="No courses yet." rows={(c.data?.courses || []).map((x) => [<a key="a" href={x.url} target="_blank" rel="noreferrer noopener">{x.title}</a>, x.skill || "-", x.provider || "-", x.level, x.hours || "-", <Btn key="d" small kind="danger" onClick={() => run(() => api.del(`/api/manage/courses/${x.id}`))}>Delete</Btn>])} />
      </Loading></Panel>
    </>
  );
}

function Exports() {
  const [msg, setMsg] = useState("");
  const go = (path, name) => api.download(path, name).then(() => setMsg(`${name} downloaded.`)).catch((e) => setMsg(e.message));
  return (
    <Panel title="Reports & exports (CSV)">
      <p className="fx-muted">Spreadsheet-safe CSV files that open in Excel or Google Sheets.</p>
      <div className="fx-row">
        <Btn onClick={() => go("/api/faculty/export/students.csv", "students.csv")}>Student progress</Btn>
        <Btn kind="secondary" onClick={() => go("/api/admin/export/users", "users.csv")}>All users (admin)</Btn><Btn kind="secondary" onClick={() => go("/api/admin/export/assessments", "assessments.csv")}>Assessments (admin)</Btn>
        <Btn kind="secondary" onClick={() => go("/api/admin/export/applications", "applications.csv")}>Applications (admin)</Btn><Btn kind="secondary" onClick={() => go("/api/admin/export/audit", "audit.csv")}>Audit log (admin)</Btn>
      </div><Notice kind="info">{msg}</Notice>
    </Panel>
  );
}

function Audit() {
  const [action, setAction] = useState("");
  const a = useApi(`/api/admin/audit?limit=200${action ? `&action=${encodeURIComponent(action)}` : ""}`);
  return (
    <Panel title="Audit logs"><div className="fx-row"><Field label="Filter by action prefix" placeholder="e.g. admin. or auth." value={action} onChange={(e) => setAction(e.target.value)} /></div>
      <Loading loading={a.loading} error={a.error}>
        <Table head={["When", "Actor", "Action", "Target", "Details"]} empty="No audit entries." rows={(a.data?.logs || []).map((l) => [when(l.createdAt), `${l.actorEmail || l.actorId || "-"} (${l.actorRole || "-"})`, l.action, l.target || "-", <code key="d">{JSON.stringify(l.details)}</code>])} />
      </Loading></Panel>
  );
}

function Ops() {
  const b = useApi("/api/admin/backups");
  const m = useApi("/api/admin/metrics");
  const [msg, setMsg] = useState("");
  return (
    <>
      <Panel title="Database backups" actions={<Btn small onClick={async () => { try { const d = await api.post("/api/admin/backup"); setMsg(`Backup created: ${d.backup.name}`); b.reload(); } catch (e) { setMsg(e.message); } }}>Back up now</Btn>}>
        <Notice kind="info">{msg}</Notice>
        <Loading loading={b.loading} error={b.error}><p className="fx-muted">Keeps the newest {b.data?.keep} backups{b.data?.scheduledEveryHours ? `, automatic every ${b.data.scheduledEveryHours} h` : " (set BACKUP_INTERVAL_HOURS for automatic backups)"}.</p>
          <Table head={["File", "Size", "Created"]} empty="No backups yet." rows={(b.data?.backups || []).map((x) => [x.name, `${Math.round(x.sizeBytes / 1024)} KB`, when(x.createdAt)])} /></Loading>
      </Panel>
      <Panel title="System monitoring" actions={<Btn small kind="secondary" onClick={m.reload}>Refresh</Btn>}>
        <Loading loading={m.loading} error={m.error}>{m.data && <>
          <div className="fx-grid"><Stat label="Uptime" value={`${Math.round(m.data.uptimeSeconds / 60)} min`} /><Stat label="Memory (RSS)" value={`${m.data.memoryMB.rss} MB`} /><Stat label="API requests" value={m.data.requests.total} /><Stat label="Server errors" value={m.data.requests.serverErrors} hint={`${m.data.requests.rateLimited} rate-limited`} /></div>
          <h4>Recent server errors</h4><Table head={["Time", "Request", "Status"]} empty="No server errors today." rows={m.data.recentServerErrors.map((e) => [e.t, `${e.m} ${e.u}`, e.s])} /></>}</Loading>
      </Panel>
    </>
  );
}

function Admin() {
  const role = useRole();
  const isAdmin = role === "admin";
  const tabsFor = isAdmin ? [["overview", "Overview"], ["students", "Students"], ["risk", "At-risk"], ["college", "College analytics"], ["users", "Users"], ["questions", "Assessments"], ["courses", "Courses"], ["exports", "Reports"], ["audit", "Audit logs"], ["ops", "Backup & monitoring"]]
    : [["students", "Students"], ["risk", "At-risk"], ["college", "College analytics"], ["questions", "Assessments"], ["courses", "Courses"], ["exports", "Reports"]];
  const [tab, setTab] = useState(null);
  if (role === null) return <Page title="Faculty & Admin"><div className="fx-empty">Loading...</div></Page>;
  if (role === "student") return <Page title="Faculty & Admin"><Notice kind="error">This area is only for faculty and admin accounts.</Notice></Page>;
  const current = tab || tabsFor[0][0];
  return (
    <Page title={isAdmin ? "Admin Dashboard" : "Faculty Dashboard"} subtitle="Monitor student progress, manage content and keep the platform healthy.">
      <Tabs tabs={tabsFor} value={current} onChange={setTab} />
      {current === "overview" && <Overview />}{current === "students" && <Students />}{current === "risk" && <AtRisk />}{current === "college" && <College />}{current === "users" && <Users />}
      {current === "questions" && <Questions />}{current === "courses" && <Courses />}{current === "exports" && <Exports />}{current === "audit" && <Audit />}{current === "ops" && <Ops />}
    </Page>
  );
}

export default Admin;
