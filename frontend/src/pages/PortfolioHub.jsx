import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useApi } from "../utils/hooks";
import { Page, Panel, Tabs, Field, Btn, Notice, Loading, Bar, Pill, Table, Empty, Stat } from "../components/ui";

const useMsg = () => { const [m, setM] = useState({ kind: "", text: "" }); return [m, (kind, text) => setM({ kind, text })]; };

function Overview() {
  const p = useApi("/api/portfolio/me");
  const s = p.data?.strength;
  return (
    <Panel title="Portfolio strength score">
      <Loading loading={p.loading} error={p.error}>
        {s && <>
          <div className="fx-grid"><Stat label="Portfolio score" value={`${s.score}/100`} hint={s.grade} /></div>
          {s.breakdown.map((b) => <div key={b.area}><Bar label={b.area} value={b.got} max={b.max} suffix={`/${b.max}`} />{b.got < b.max * 0.6 && <div className="fx-muted" style={{ marginTop: -4 }}>Tip: {b.tip}</div>}</div>)}
          {s.improvements.length > 0 && <Notice kind="info"><b>Biggest improvements:</b> {s.improvements.join(" ")}</Notice>}
        </>}
      </Loading>
    </Panel>
  );
}

function Projects() {
  const l = useApi("/api/hub/projects");
  const [form, setForm] = useState({ title: "", description: "", tech: "", difficulty: "beginner", githubUrl: "", liveUrl: "", status: "planned" });
  const [open, setOpen] = useState(null);
  const [msg, say] = useMsg();
  const run = async (fn, ok) => { say("", ""); try { await fn(); if (ok) say("ok", ok); l.reload(); } catch (e) { say("error", e.message); } };
  return (
    <>
      <Panel title="Add a project">
        <div className="fx-row"><Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Tech (comma separated)" value={form.tech} onChange={(e) => setForm({ ...form, tech: e.target.value })} />
          <Field label="Difficulty" options={["beginner", "medium", "advanced"]} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} /><Field label="Status" options={[["planned", "Planned"], ["in_progress", "In progress"], ["completed", "Completed"]]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} /></div>
        <div className="fx-row"><Field label="Description" textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="fx-row"><Field label="GitHub URL" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} /><Field label="Live demo URL" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} />
          <Btn onClick={() => run(async () => { await api.post("/api/hub/projects", { ...form, tech: form.tech.split(",") }); setForm({ ...form, title: "", description: "", tech: "", githubUrl: "", liveUrl: "" }); }, "Project added with a milestone roadmap.")}>Add project</Btn></div>
        <Notice kind={msg.kind === "ok" ? "ok" : "error"}>{msg.text}</Notice>
      </Panel>
      <Panel title="Project history">
        <Loading loading={l.loading} error={l.error}>
          {l.data && <p className="fx-muted">{l.data.summary.total} projects - {l.data.summary.completed} completed - {l.data.summary.inProgress} in progress</p>}
          {(l.data?.projects || []).map((p) => (
            <div key={p.id} className="fx-card">
              <b>{p.title}</b> <Pill kind={p.status === "completed" ? "green" : p.status === "in_progress" ? "amber" : "gray"}>{p.status.replace("_", " ")}</Pill> <Pill kind="gray">{p.difficulty}</Pill> {p.score !== null && <Pill kind="green">score {p.score}</Pill>}
              <div className="fx-muted">{p.tech.join(", ")}</div><p>{p.description}</p>
              <div>{p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer noopener">GitHub</a>} {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer noopener" style={{ marginLeft: 10 }}>Live</a>}</div>
              <div className="fx-row" style={{ marginTop: 8 }}>
                <Btn small kind="secondary" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? "Hide milestones" : `Milestones (${p.milestones.filter((m) => m.done).length}/${p.milestones.length})`}</Btn>
                <Btn small onClick={() => run(() => api.post(`/api/hub/projects/${p.id}/evaluate`), "Evaluated.")}>Evaluate</Btn>
                {p.status !== "completed" && <Btn small kind="secondary" onClick={() => run(() => api.put(`/api/hub/projects/${p.id}`, { status: "completed" }), "Marked completed.")}>Mark completed</Btn>}
                <Btn small kind="danger" onClick={() => window.confirm("Delete this project?") && run(() => api.del(`/api/hub/projects/${p.id}`))}>Delete</Btn>
              </div>
              {open === p.id && <ul className="fx-list">{p.milestones.map((m) => <li key={m.id}><label><input type="checkbox" checked={m.done} onChange={() => run(() => api.post(`/api/hub/projects/${p.id}/milestone`, { milestoneId: m.id }))} /> {m.title}</label></li>)}</ul>}
              {p.feedback && <div className="fx-card"><b>Evaluation: {p.feedback.score}/100</b>{p.feedback.breakdown.map((b) => <Bar key={b.area} label={b.area} value={b.got} max={b.max} suffix={`/${b.max}`} />)}{p.feedback.improvements.length > 0 && <ul>{p.feedback.improvements.map((i) => <li key={i}>{i}</li>)}</ul>}</div>}
            </div>
          ))}
          {l.data?.projects.length === 0 && <Empty>No projects yet.</Empty>}
        </Loading>
      </Panel>
    </>
  );
}

function Certificates() {
  const l = useApi("/api/certificates");
  const [form, setForm] = useState({ title: "", issuer: "", issueDate: "", credentialUrl: "", skills: "" });
  const [msg, say] = useMsg();
  const run = async (fn) => { say("", ""); try { await fn(); l.reload(); } catch (e) { say("error", e.message); } };
  return (
    <>
      <Panel title="Add a certificate">
        <div className="fx-row"><Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Issuer" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} /><Field label="Issue date" type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></div>
        <div className="fx-row"><Field label="Credential URL" value={form.credentialUrl} onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })} /><Field label="Skills (comma separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <Btn onClick={() => run(async () => { await api.post("/api/certificates", { ...form, skills: form.skills.split(",") }); setForm({ title: "", issuer: "", issueDate: "", credentialUrl: "", skills: "" }); })}>Save</Btn></div>
        <Notice kind="error">{msg.text}</Notice>
      </Panel>
      <Panel title="Certificate manager">
        <Loading loading={l.loading} error={l.error}>
          <Table head={["Certificate", "Issuer", "Date", "Skills", ""]} empty="No certificates stored yet." rows={(l.data?.certificates || []).map((c) => [c.credentialUrl ? <a key="a" href={c.credentialUrl} target="_blank" rel="noreferrer noopener">{c.title}</a> : c.title, c.issuer || "-", c.issueDate || "-", c.skills.join(", ") || "-", <Btn key="d" small kind="danger" onClick={() => run(() => api.del(`/api/certificates/${c.id}`))}>Delete</Btn>])} />
        </Loading>
      </Panel>
    </>
  );
}

function GitHub() {
  const saved = useApi("/api/github/analysis");
  const [username, setUsername] = useState("");
  const [data, setData] = useState(null);
  const [msg, say] = useMsg();
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (saved.data?.analysis) setData(saved.data.analysis); }, [saved.data]);
  const run = async () => { setBusy(true); say("", ""); try { const d = await api.post("/api/github/analyze", { username }); setData(d.analysis); say("ok", "GitHub connected and analysed."); } catch (e) { say("error", e.message); } finally { setBusy(false); } };
  return (
    <Panel title="GitHub integration & analyzer">
      <div className="fx-row"><Field label="GitHub username" placeholder={data?.username || "octocat"} value={username} onChange={(e) => setUsername(e.target.value)} /><Btn disabled={busy} onClick={run}>{busy ? "Analysing..." : "Connect & analyse"}</Btn></div>
      <Notice kind={msg.kind === "ok" ? "ok" : "error"}>{msg.text}</Notice>
      {data && <>
        <div className="fx-grid"><Stat label="Profile score" value={`${data.score}/100`} /><Stat label="Original repos" value={data.originalRepos} /><Stat label="Stars" value={data.totalStars} /><Stat label="Active (90 days)" value={data.activeLast90Days} /></div>
        <p><a href={data.profileUrl} target="_blank" rel="noreferrer noopener">{data.profileUrl}</a></p>
        <p><b>Languages:</b> {data.languages.map((x) => <Pill key={x.language}>{x.language} ({x.repos})</Pill>)}</p>
        {data.tips.length > 0 && <Notice kind="info"><b>Tips:</b><ul>{data.tips.map((t) => <li key={t}>{t}</li>)}</ul></Notice>}
        <Table head={["Top repositories", "Language", "Stars"]} rows={data.topRepos.map((r) => [<a key="r" href={r.url} target="_blank" rel="noreferrer noopener">{r.name}</a>, r.language || "-", r.stars])} />
      </>}
    </Panel>
  );
}

function Builder() {
  const p = useApi("/api/portfolio/me");
  const projects = useApi("/api/hub/projects");
  const [form, setForm] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [msg, say] = useMsg();
  useEffect(() => { if (p.data) { setForm({ headline: p.data.portfolio.headline, about: p.data.portfolio.about, theme: p.data.portfolio.theme, linkedin: p.data.portfolio.links.linkedin || "", website: p.data.portfolio.links.website || "", github: p.data.portfolio.links.github || "" }); setIsPublic(p.data.isPublic); } }, [p.data]);
  const save = async () => { say("", ""); try { await api.put("/api/portfolio/me", { headline: form.headline, about: form.about, theme: form.theme, isPublic, links: { github: form.github, linkedin: form.linkedin, website: form.website } }); say("ok", "Portfolio saved."); p.reload(); } catch (e) { say("error", e.message); } };
  const link = p.data ? `${window.location.origin}/p/${p.data.slug}` : "";
  return (
    <Panel title="Portfolio builder">
      <Loading loading={p.loading || !form} error={p.error}>
        {form && <>
          <div className="fx-row"><Field label="Headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /><Field label="Theme" options={["clean", "dark", "colorful"]} value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} /></div>
          <div className="fx-row"><Field label="About you" textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></div>
          <div className="fx-row"><Field label="GitHub URL" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} /><Field label="LinkedIn URL" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /><Field label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <p><label><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Make my portfolio public (shows name, skills, projects and certificates only; never your email or phone)</label></p>
          <Btn onClick={save}>Save portfolio</Btn>
          <Notice kind={msg.kind === "ok" ? "ok" : "error"}>{msg.text}</Notice>
          {isPublic && p.data.isPublic && <Notice kind="info">Public link: <a href={link}>{link}</a></Notice>}
          <p className="fx-muted">{projects.data?.projects.length || 0} project(s) are included automatically.</p>
        </>}
      </Loading>
    </Panel>
  );
}

function ResumeTools() {
  const [text, setText] = useState("");
  const [jd, setJd] = useState("");
  const [ats, setAts] = useState(null);
  const [opt, setOpt] = useState(null);
  const [msg, say] = useMsg();
  const run = async (fn) => { say("", ""); try { await fn(); } catch (e) { say("error", e.message); } };
  return (
    <Panel title="ATS checker & job-specific resume optimizer">
      <div className="fx-row"><Field label="Paste your resume text" textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} /></div>
      <div className="fx-row"><Btn onClick={() => run(async () => setAts((await api.post("/api/resume/ats-check", { resumeText: text })).ats))}>Run ATS check</Btn></div>
      {ats && <div className="fx-card"><b>ATS score: {ats.score}/100</b> <span className="fx-muted">({ats.words} words, {ats.checks.actionVerbs} action verbs, {ats.checks.quantifiedResults} quantified results)</span>{ats.issues.length ? <ul>{ats.issues.map((i) => <li key={i}>{i}</li>)}</ul> : <p>No formatting issues found.</p>}</div>}
      <div className="fx-row" style={{ marginTop: 14 }}><Field label="Paste the job description" textarea rows={6} value={jd} onChange={(e) => setJd(e.target.value)} /></div>
      <Btn onClick={() => run(async () => setOpt((await api.post("/api/resume/optimize", { resumeText: text, jobDescription: jd })).optimization))}>Optimize for this job</Btn>
      <Notice kind="error">{msg.text}</Notice>
      {opt && <div className="fx-card"><b>Keyword match: {opt.keywordMatch ?? "n/a"}{opt.keywordMatch !== null && "%"}</b> - ATS {opt.atsScore}/100
        <p><b>Matched:</b> {opt.matchedKeywords.map((k) => <Pill key={k} kind="green">{k}</Pill>)}</p><p><b>Missing:</b> {opt.missingKeywords.map((k) => <Pill key={k} kind="red">{k}</Pill>)}</p>
        <ul>{opt.suggestions.map((s) => <li key={s}>{s}</li>)}</ul><p className="fx-muted">{opt.note}</p></div>}
    </Panel>
  );
}

function PortfolioHub() {
  const [tab, setTab] = useState("overview");
  return (
    <Page title="Portfolio Hub" subtitle="Projects, certificates, GitHub, portfolio page and resume tools in one place.">
      <Tabs tabs={[["overview", "Strength score"], ["projects", "Projects"], ["certs", "Certificates"], ["github", "GitHub"], ["builder", "Portfolio builder"], ["resume", "Resume tools"]]} value={tab} onChange={setTab} />
      {tab === "overview" && <Overview />}{tab === "projects" && <Projects />}{tab === "certs" && <Certificates />}{tab === "github" && <GitHub />}{tab === "builder" && <Builder />}{tab === "resume" && <ResumeTools />}
    </Page>
  );
}

export default PortfolioHub;
