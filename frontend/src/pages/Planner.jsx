import { useState } from "react";
import { api } from "../utils/api";
import { useApi } from "../utils/hooks";
import { Page, Panel, Tabs, Field, Btn, Notice, Loading, Bar, Pill, Table, Empty } from "../components/ui";

function Weekly() {
  const w = useApi("/api/planner/weekly");
  const [form, setForm] = useState({ targetRole: "", hoursPerWeek: 8 });
  const [error, setError] = useState("");
  const create = async () => { setError(""); try { await api.post("/api/planner/weekly", { targetRole: form.targetRole || undefined, hoursPerWeek: Number(form.hoursPerWeek) }); w.reload(); } catch (e) { setError(e.message); } };
  const toggle = async (taskId) => { try { await api.post("/api/planner/weekly/toggle", { taskId }); w.reload(); } catch (e) { setError(e.message); } };
  const plan = w.data?.plan;
  return (
    <>
      <Panel title={plan ? "Generate a new plan" : "Create your weekly plan"}>
        <div className="fx-row">
          <Field label="Target career (optional)" placeholder="e.g. Data Analyst" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} />
          <Field label="Study hours per week" type="number" min="2" max="60" value={form.hoursPerWeek} onChange={(e) => setForm({ ...form, hoursPerWeek: e.target.value })} />
          <Btn onClick={create}>Generate</Btn>
        </div>
        <p className="fx-muted">The plan targets your weak topics first, then the biggest skill gaps for your career.</p>
        <Notice kind="error">{error}</Notice>
      </Panel>
      <Loading loading={w.loading} error={w.error}>
        {plan ? (
          <Panel title={`Week of ${plan.weekStart} - ${plan.targetRole || "general"}`} actions={<Pill kind={w.data.stale ? "amber" : "green"}>{w.data.stale ? "Past week - regenerate" : `${w.data.progress.percent}% done`}</Pill>}>
            <Bar label="Progress" value={w.data.progress.percent} />
            {plan.days.map((d) => (
              <div key={d.date} className="fx-card"><b>{d.day}</b> <span className="fx-muted">{d.date}</span>
                {d.tasks.map((t) => (
                  <label key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                    <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
                    <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title} <span className="fx-muted">({t.minutes} min)</span></span>
                    {t.resource && <a href={t.resource.url} target="_blank" rel="noreferrer noopener">resource</a>}
                  </label>
                ))}
              </div>
            ))}
          </Panel>
        ) : <Empty>No weekly plan yet.</Empty>}
      </Loading>
    </>
  );
}

function Daily() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const g = useApi(`/api/planner/daily?date=${date}`);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const run = async (fn) => { setError(""); try { await fn(); g.reload(); } catch (e) { setError(e.message); } };
  return (
    <Panel title="Daily learning goals" actions={<input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />}>
      <div className="fx-row">
        <Field label="New goal" placeholder="e.g. Solve 5 SQL joins" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Btn disabled={title.trim().length < 3} onClick={() => run(async () => { await api.post("/api/planner/daily", { title, date }); setTitle(""); })}>Add</Btn>
        <Btn kind="secondary" onClick={() => run(() => api.post("/api/planner/daily/from-plan", { date }))}>Import from weekly plan</Btn>
      </div>
      <Notice kind="error">{error}</Notice>
      <Loading loading={g.loading} error={g.error}>
        {g.data && <><Bar label={`${g.data.summary.done}/${g.data.summary.total} done`} value={g.data.summary.total ? Math.round((g.data.summary.done / g.data.summary.total) * 100) : 0} />
          <ul className="fx-list">{g.data.goals.map((x) => (
            <li key={x.id}><label><input type="checkbox" checked={x.done} onChange={() => run(() => api.post(`/api/planner/daily/${x.id}/toggle`))} /> <span style={{ textDecoration: x.done ? "line-through" : "none" }}>{x.title}</span> {x.source === "plan" && <Pill kind="gray">from plan</Pill>}</label>
              <Btn small kind="secondary" onClick={() => run(() => api.del(`/api/planner/daily/${x.id}`))}>Remove</Btn></li>))}</ul>
          {g.data.goals.length === 0 && <Empty>No goals for this day. Completing goals earns XP.</Empty>}</>}
      </Loading>
    </Panel>
  );
}

function Estimator() {
  const [skills, setSkills] = useState("Pandas, Power BI, Statistics");
  const [hours, setHours] = useState(8);
  const [level, setLevel] = useState("beginner");
  const [out, setOut] = useState(null);
  const [error, setError] = useState("");
  const run = async () => { setError(""); try { setOut(await api.post("/api/planner/estimate", { skills: skills.split(","), hoursPerWeek: Number(hours), level })); } catch (e) { setError(e.message); } };
  return (
    <Panel title="Learning time estimator">
      <div className="fx-row">
        <Field label="Skills to learn (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} />
        <Field label="Hours per week" type="number" min="1" max="80" value={hours} onChange={(e) => setHours(e.target.value)} />
        <Field label="Your level" options={["beginner", "intermediate", "advanced"]} value={level} onChange={(e) => setLevel(e.target.value)} />
        <Btn onClick={run}>Estimate</Btn>
      </div>
      <Notice kind="error">{error}</Notice>
      {out && <><Notice kind="info">About <b>{out.estimate.totalHours} hours</b> = <b>{out.estimate.totalWeeks} weeks</b> at {out.estimate.hoursPerWeek} h/week.</Notice>
        <Table head={["Skill", "Importance", "Hours", "Weeks"]} rows={out.estimate.items.map((i) => [i.skill, i.weight, i.hours, i.weeks])} /><p className="fx-muted">{out.note}</p></>}
    </Panel>
  );
}

function Revision() {
  const r = useApi("/api/planner/revision");
  const [msg, setMsg] = useState("");
  const done = async (topic) => { try { const d = await api.post("/api/planner/revision/done", { topic }); setMsg(d.xp.awarded ? `+${d.xp.awarded} XP for revising ${topic}!` : "Already counted today."); } catch (e) { setMsg(e.message); } };
  return (
    <Panel title="Revision recommendations">
      <Loading loading={r.loading} error={r.error}>
        <p className="fx-muted">{r.data?.note}</p><Notice kind="ok">{msg}</Notice>
        {(r.data?.revision || []).map((x) => (
          <div key={x.topic} className="fx-card"><b>{x.topic}</b> <Pill kind="red">{x.percent}%</Pill> <span className="fx-muted">{x.why} - suggested {x.suggestedMinutes} min</span>
            <div>{x.resources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer noopener" style={{ marginRight: 12 }}>{s.title}</a>)}</div><Btn small onClick={() => done(x.topic)}>Mark revised</Btn></div>
        ))}
        {(r.data?.reassessSuggestions || []).length > 0 && <p>Consider retaking: {r.data.reassessSuggestions.map((s) => <Pill key={s.subject} kind="amber">{s.subject} ({s.latest}%)</Pill>)}</p>}
      </Loading>
    </Panel>
  );
}

function Unlock() {
  const [role, setRole] = useState("Data Analyst");
  const [completed, setCompleted] = useState([]);
  const [scores, setScores] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const profile = (() => { try { const p = JSON.parse(localStorage.getItem(`student_${JSON.parse(localStorage.getItem("student") || "{}").id}_studentProfile`) || "{}"); return { skills: p.skills || "", interests: p.interests || "" }; } catch { return {}; } })();
  const quizScores = () => Object.fromEntries(scores.split(",").map((s) => s.split(":")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), Number(v)]));
  const refresh = async (phases, done) => { const d = await api.post("/api/roadmap/unlock-status", { phases, completedSkills: done }); setStatus(d); };
  const generate = async () => { setError(""); try { const d = await api.post("/api/roadmap/generate", { profile, targetRole: role, quizScores: quizScores() }); setRoadmap(d.roadmap); setCompleted([]); await refresh(d.roadmap.phases, []); } catch (e) { setError(e.message); } };
  const complete = async (skill) => { try { const done = [...completed, skill]; setCompleted(done); await refresh(roadmap.phases, done); await api.post("/api/gamification/event", { action: "roadmap_step", ref: skill.toLowerCase() }); } catch (e) { setError(e.message); } };
  const adapt = async () => { try { const d = await api.post("/api/roadmap/adapt", { phases: roadmap.phases, completedSkills: completed, quizScores: quizScores() }); setRoadmap({ ...roadmap, phases: d.phases, totalWeeks: d.totalWeeks }); await refresh(d.phases, completed); } catch (e) { setError(e.message); } };
  return (
    <Panel title="Module unlock & adaptive roadmap">
      <p className="fx-muted">Modules unlock one after another. Add quiz scores (e.g. <code>sql:40, pandas:85</code>) and press Adapt to move weak skills earlier.</p>
      <div className="fx-row">
        <Field label="Target role" value={role} onChange={(e) => setRole(e.target.value)} />
        <Field label="Quiz scores (skill:score)" value={scores} onChange={(e) => setScores(e.target.value)} />
        <Btn onClick={generate}>Generate roadmap</Btn>{roadmap && <Btn kind="secondary" onClick={adapt}>Adapt to scores</Btn>}
      </div>
      <Notice kind="error">{error}</Notice>
      {status && <><Bar label={`${status.completed}/${status.total} modules complete`} value={Math.round((status.completed / status.total) * 100)} />
        {status.phases.map((p) => (
          <div key={p.skill} className="fx-card" style={{ opacity: p.status === "locked" ? 0.55 : 1 }}>
            <b>{p.status === "locked" ? "Locked: " : ""}{p.skill}</b> <Pill kind={p.status === "completed" ? "green" : p.status === "unlocked" ? "amber" : "gray"}>{p.status}</Pill>
            <span className="fx-muted"> weeks {p.startWeek}-{p.endWeek}{p.adaptedReason ? ` - ${p.adaptedReason}` : ""}</span>
            {p.status === "unlocked" && <div><Btn small onClick={() => complete(p.skill)}>Mark complete</Btn></div>}
          </div>))}</>}
    </Panel>
  );
}

function Planner() {
  const [tab, setTab] = useState("weekly");
  return (
    <Page title="Learning Planner" subtitle="Weekly plans, daily goals, time estimates, revision and adaptive roadmap.">
      <Tabs tabs={[["weekly", "Weekly plan"], ["daily", "Daily goals"], ["estimate", "Time estimator"], ["revision", "Revision"], ["unlock", "Roadmap unlock"]]} value={tab} onChange={setTab} />
      {tab === "weekly" && <Weekly />}{tab === "daily" && <Daily />}{tab === "estimate" && <Estimator />}{tab === "revision" && <Revision />}{tab === "unlock" && <Unlock />}
    </Page>
  );
}

export default Planner;
