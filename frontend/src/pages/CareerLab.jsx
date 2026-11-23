import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useApi } from "../utils/hooks";
import { Page, Panel, Tabs, Field, Btn, Notice, Loading, Bar, Pill, Stat, Empty, when } from "../components/ui";

const ROLE_OPTIONS = [["data", "Data Analyst / Scientist"], ["aiml", "AI / ML Engineer"], ["fullstack", "Full Stack Developer"], ["backend", "Backend / Java Developer"], ["cyber", "Cybersecurity Analyst"], ["devops", "DevOps / Cloud Engineer"], ["mobile", "Mobile App Developer"]];

function Copilot() {
  const c = useApi("/api/copilot/next-actions");
  return (
    <Panel title="AI Career Copilot - your next best actions" actions={<Btn small kind="secondary" onClick={c.reload}>Refresh</Btn>}>
      <Loading loading={c.loading} error={c.error}>
        {c.data?.best && <Notice kind="info"><b>Do this next:</b> {c.data.best.title}. {c.data.best.why}</Notice>}
        <ul className="fx-list">
          {(c.data?.actions || []).map((a) => (
            <li key={a.title}><div><b>{a.title}</b><div className="fx-muted">{a.why}</div></div><Link to={a.link}><Btn small>Open</Btn></Link></li>
          ))}
        </ul>
        {c.data && c.data.actions.length === 0 && <Empty>You are all caught up. Nice work!</Empty>}
      </Loading>
    </Panel>
  );
}

function WhatIf() {
  const [careers, setCareers] = useState(["data", "aiml"]);
  const [skills, setSkills] = useState("Power BI, Statistics");
  const [hours, setHours] = useState(8);
  const [out, setOut] = useState(null);
  const [error, setError] = useState("");
  const toggle = (id) => setCareers((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-5)));
  const run = async () => { setError(""); try { setOut(await api.post("/api/career/what-if", { careers, addSkills: skills.split(","), hoursPerWeek: Number(hours) })); } catch (e) { setError(e.message); } };
  return (
    <Panel title="Career What-If Simulator">
      <p className="fx-muted">See how learning new skills changes your match for different careers.</p>
      <div>{ROLE_OPTIONS.map(([id, name]) => <label key={id} style={{ marginRight: 14, display: "inline-block" }}><input type="checkbox" checked={careers.includes(id)} onChange={() => toggle(id)} /> {name}</label>)}</div>
      <div className="fx-row" style={{ marginTop: 12 }}>
        <Field label="Skills you could add (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} />
        <Field label="Hours per week" type="number" min="1" max="60" value={hours} onChange={(e) => setHours(e.target.value)} />
        <Btn onClick={run}>Simulate</Btn>
      </div>
      <Notice kind="error">{error}</Notice>
      {out && <>
        <Notice kind="ok">{out.best}</Notice>
        {out.results.map((r) => (
          <div key={r.careerId} className="fx-card"><b>{r.career}</b> <Pill kind={r.gain > 0 ? "green" : "gray"}>+{r.gain}%</Pill>
            <Bar label="Now" value={r.now} /><Bar label="After adding skills" value={r.afterAdding} />
            <div className="fx-muted">Estimated time to close gaps: {r.estimatedWeeksNow} wk now, {r.estimatedWeeksAfter} wk after. Still missing: {r.stillMissing.join(", ") || "nothing"}</div></div>
        ))}
        <p className="fx-muted">{out.note}</p></>}
    </Panel>
  );
}

function Compare() {
  const [careers, setCareers] = useState(["data", "aiml"]);
  const [out, setOut] = useState(null);
  const [error, setError] = useState("");
  const toggle = (id) => setCareers((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-4)));
  const run = async () => { setError(""); try { setOut(await api.post("/api/career/compare", { careers })); } catch (e) { setError(e.message); } };
  return (
    <Panel title="Career Comparison" actions={<Btn onClick={run} disabled={careers.length < 2}>Compare</Btn>}>
      <div>{ROLE_OPTIONS.map(([id, name]) => <label key={id} style={{ marginRight: 14, display: "inline-block" }}><input type="checkbox" checked={careers.includes(id)} onChange={() => toggle(id)} /> {name}</label>)}</div>
      <Notice kind="error">{error}</Notice>
      {out && <>
        <p>Closest match for you: <b>{out.recommendation}</b>. Skills common to all: {out.commonSkills.join(", ") || "none"}.</p>
        <div className="fx-grid">{out.compare.map((c) => (
          <div key={c.careerId} className="fx-card"><b>{c.career}</b><Bar label="Your match" value={c.matchPercent} />
            <div className="fx-muted">~{c.estimatedWeeks} weeks to close gaps - {c.openRolesInCatalogue} matching role profiles</div>
            <p><b>You have:</b> {c.youHave.join(", ") || "-"}</p>
            <p><b>Unique to this career:</b> {c.uniqueSkills.join(", ") || "-"}</p>
            <b>Learning path</b><ol>{c.learningPath.map((s) => <li key={s.skill}>{s.skill} <span className="fx-muted">({s.hours}h)</span></li>)}</ol></div>
        ))}</div></>}
    </Panel>
  );
}

function Explain() {
  const [career, setCareer] = useState("Data Analyst");
  const [out, setOut] = useState(null);
  const [error, setError] = useState("");
  const run = async () => { setError(""); try { setOut(await api.post("/api/career/explain", { career })); } catch (e) { setError(e.message); } };
  return (
    <Panel title="Why this career? (recommendation explanation)">
      <div className="fx-row"><Field label="Career" options={ROLE_OPTIONS.map(([, n]) => n)} value={career} onChange={(e) => setCareer(e.target.value)} /><Btn onClick={run}>Explain</Btn></div>
      <Notice kind="error">{error}</Notice>
      {out && <div className="fx-card"><b>{out.explanation.career}</b> <Pill kind="green">{out.explanation.matchPercent}% match</Pill> <Pill kind="gray">confidence: {out.explanation.confidence}</Pill> <Pill kind="gray">{out.engine === "ai" ? "AI" : "rule engine"}</Pill>
        <ul>{out.explanation.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        <p><b>Gaps:</b> {(out.explanation.gaps || []).join(", ") || "none"}</p><p><b>Next step:</b> {out.explanation.nextStep}</p></div>}
    </Panel>
  );
}

function Twin() {
  const t = useApi("/api/career/digital-twin");
  const d = t.data;
  return (
    <Panel title="Career Digital Twin" actions={<Btn small kind="secondary" onClick={t.reload}>Refresh snapshot</Btn>}>
      <Loading loading={t.loading} error={t.error}>
        {d && <>
          <p className="fx-muted">A live model of your career profile built from your profile, assessments, projects and activity. Generated {when(d.twin.generatedAt)}.</p>
          <div className="fx-grid">
            <Stat label="Career readiness" value={`${d.twin.readiness}%`} hint={d.changes ? `${d.changes.readiness >= 0 ? "+" : ""}${d.changes.readiness} since last snapshot` : "First snapshot"} />
            <Stat label="Assessment average" value={d.twin.assessmentAverage === null ? "-" : `${d.twin.assessmentAverage}%`} />
            <Stat label="Level / XP" value={`L${d.twin.level}`} hint={`${d.twin.xp} XP, ${d.twin.streak}-day streak`} />
            <Stat label="Projects / Certificates" value={`${d.twin.projects} / ${d.twin.certificates}`} hint={`${d.twin.interviews} mock interviews`} />
          </div>
          <h4>Top career matches</h4>{d.twin.topCareers.map((c) => <Bar key={c.career} label={c.career} value={c.match} />)}
          <p><b>Skills:</b> {d.twin.skills.map((s) => <Pill key={s}>{s}</Pill>)}{d.twin.skills.length === 0 && "none yet - add skills in your profile"}</p>
          <p><b>Strengths:</b> {d.twin.strengths.join(", ") || "take assessments to find out"}</p>
          <p><b>Weak areas:</b> {d.twin.weakAreas.join(", ") || "none detected"}</p>
          {d.history.length > 1 && <><h4>Readiness over time</h4>{d.history.map((h) => <Bar key={h.id} label={when(h.createdAt).slice(0, 10)} value={h.readiness ?? 0} />)}</>}
        </>}
      </Loading>
    </Panel>
  );
}

function CareerLab() {
  const [tab, setTab] = useState("copilot");
  return (
    <Page title="Career Lab" subtitle="Copilot, what-if simulation, career comparison, explanations and your digital twin.">
      <Tabs tabs={[["copilot", "Copilot / Next action"], ["whatif", "What-If simulator"], ["compare", "Compare careers"], ["explain", "Explain a match"], ["twin", "Digital twin"]]} value={tab} onChange={setTab} />
      {tab === "copilot" && <Copilot />}
      {tab === "whatif" && <WhatIf />}
      {tab === "compare" && <Compare />}
      {tab === "explain" && <Explain />}
      {tab === "twin" && <Twin />}
    </Page>
  );
}

export default CareerLab;
