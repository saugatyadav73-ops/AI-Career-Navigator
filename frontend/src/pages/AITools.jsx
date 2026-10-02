import { useState } from "react";
import { getStudentData } from "../utils/studentStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TABS = [
  { id: "mentor", icon: "🤖", name: "Career Mentor" },
  { id: "resume", icon: "📄", name: "Resume Analyzer" },
  { id: "interview", icon: "🎤", name: "Mock Interview" },
  { id: "jobs", icon: "💼", name: "Job Matcher" },
  { id: "predict", icon: "🎯", name: "Career Prediction" },
  { id: "gap", icon: "🧠", name: "Skill Gap AI" },
  { id: "roadmap", icon: "🗺️", name: "Dynamic Roadmap" },
  { id: "resources", icon: "📚", name: "Resources" },
  { id: "projects", icon: "🧪", name: "Project Generator" },
  { id: "builder", icon: "📝", name: "Resume Builder" },
  { id: "quiz", icon: "❓", name: "Subject Quiz" },
];

const box = { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginTop: 12 };
const input = { width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8, boxSizing: "border-box", marginBottom: 8, fontFamily: "inherit" };
const btn = { padding: "10px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" };
const chip = { display: "inline-block", background: "#eef2ff", color: "#3730a3", padding: "3px 10px", borderRadius: 999, margin: "2px 4px 2px 0", fontSize: 13 };

async function call(path, body, method = "POST") {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
  return data;
}

const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

function Chips({ items }) {
  return <>{(items || []).map((x, i) => <span key={i} style={chip}>{typeof x === "string" ? x : x.skill || x.title}</span>)}</>;
}
function Bullets({ title, items }) {
  if (!items || !items.length) return null;
  return (<div><strong>{title}</strong><ul style={{ marginTop: 4 }}>{items.map((x, i) => <li key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</li>)}</ul></div>);
}
function Resources({ items }) {
  return (<ul>{(items || []).map((r, i) => <li key={i}>{r.type}: <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>)}</ul>);
}
function Bar({ value }) {
  return (<div style={{ background: "#e2e8f0", borderRadius: 999, height: 10, margin: "6px 0" }}><div style={{ width: `${Math.max(0, Math.min(100, value || 0))}%`, background: "#22c55e", height: 10, borderRadius: 999 }} /></div>);
}

export default function AITools() {
  const saved = getStudentData("studentProfile", {}) || {};
  const [tab, setTab] = useState("mentor");
  const [skills, setSkills] = useState(Array.isArray(saved.skills) ? saved.skills.join(", ") : saved.skills || "");
  const [interests, setInterests] = useState(Array.isArray(saved.interests) ? saved.interests.join(", ") : saved.interests || "");
  const [education, setEducation] = useState(saved.education || saved.degree || "B.Tech CSE");
  const [role, setRole] = useState("Full Stack Web Developer");
  const [name, setName] = useState(saved.name || "");
  const [text, setText] = useState("");
  const [extra, setExtra] = useState("");
  const [level, setLevel] = useState("beginner");
  const [subject, setSubject] = useState("Python");
  const [chat, setChat] = useState([]);
  const [data, setData] = useState(null);
  const [engine, setEngine] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [answers, setAnswers] = useState({});
  const [iv, setIv] = useState({ q: null, a: "", ev: null, history: [] });

  const profile = { name, skills: list(skills), interests: list(interests), education, projects: extra && tab === "builder" ? list(extra).map((t) => ({ title: t })) : [] };

  async function run(fn) {
    setBusy(true); setErr("");
    try { const r = await fn(); setEngine(r.engine ? `${r.engine}${r.provider ? ` · ${r.provider}` : ""}` : ""); return r; }
    catch (e) { setErr(e.message); return null; }
    finally { setBusy(false); }
  }

  const go = async (path, body, key) => { setData(null); const r = await run(() => call(path, body)); if (r) setData(r[key]); };

  async function sendChat() {
    if (!text.trim()) return;
    const msg = text; setText("");
    const history = [...chat, { role: "user", content: msg }];
    setChat(history);
    const r = await run(() => call("/api/mentor/chat", { message: msg, history: chat, profile }));
    if (r) setChat([...history, { role: "assistant", content: r.answer.reply, extra: r.answer }]);
  }
  async function nextQuestion() {
    const prev = iv.history.map((h) => h.question);
    const r = await run(() => call("/api/mock-interview/question", { career: role, difficulty: level, previousQuestions: prev }));
    if (r) setIv({ ...iv, q: r.question, a: "", ev: null });
  }
  async function evaluate() {
    const r = await run(() => call("/api/mock-interview/evaluate", { career: role, question: iv.q.question, answer: iv.a }));
    if (r) setIv({ ...iv, ev: r.evaluation, history: [...iv.history, { question: iv.q.question, ...r.evaluation }] });
  }
  async function finishInterview() {
    setData(null);
    const r = await run(() => call("/api/mock-interview/report", { career: role, difficulty: level, evaluations: iv.history }));
    if (r) setData(r.report);
  }

  const fields = (
    <div style={box}>
      <input style={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <input style={input} placeholder="Skills (comma separated) e.g. Python, SQL, React" value={skills} onChange={(e) => setSkills(e.target.value)} />
      <input style={input} placeholder="Interests e.g. AI, web, security" value={interests} onChange={(e) => setInterests(e.target.value)} />
      <input style={input} placeholder="Education" value={education} onChange={(e) => setEducation(e.target.value)} />
      <input style={input} placeholder="Target role" value={role} onChange={(e) => setRole(e.target.value)} />
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <h1>🤖 AI Career Tools</h1>
      <p style={{ color: "#64748b" }}>10 AI features. Works offline with the rule engine; add an API key in backend/.env for LLM answers.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => { setTab(t.id); setData(null); setErr(""); setEngine(""); }}
            style={{ ...btn, background: tab === t.id ? "#2563eb" : "#e2e8f0", color: tab === t.id ? "white" : "#0f172a" }}>{t.icon} {t.name}</button>
        ))}
      </div>

      {tab !== "quiz" && tab !== "mentor" && tab !== "resume" && tab !== "resources" && fields}

      {tab === "mentor" && (<div style={box}>
        {chat.map((m, i) => (<div key={i} style={{ marginBottom: 10, textAlign: m.role === "user" ? "right" : "left" }}>
          <div style={{ display: "inline-block", maxWidth: "80%", background: m.role === "user" ? "#dbeafe" : "#f1f5f9", padding: 10, borderRadius: 10, whiteSpace: "pre-wrap" }}>{m.content}</div>
          {m.extra && <div><Chips items={m.extra.relatedRoles} /></div>}
        </div>))}
        <input style={input} placeholder="Ask anything: which career, how to start, resume tips…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
        <input style={input} placeholder="Your skills (optional)" value={skills} onChange={(e) => setSkills(e.target.value)} />
        <button type="button" style={btn} disabled={busy} onClick={sendChat}>{busy ? "Thinking…" : "Ask mentor"}</button>
      </div>)}

      {tab === "resume" && (<div style={box}>
        <input style={input} placeholder="Target role (optional)" value={role} onChange={(e) => setRole(e.target.value)} />
        <textarea style={{ ...input, minHeight: 160 }} placeholder="Paste your resume text here" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" style={btn} disabled={busy} onClick={() => go("/api/resume/analyze-text", { resumeText: text, targetRole: role }, "analysis")}>{busy ? "Analyzing…" : "Analyze resume"}</button>
      </div>)}

      {tab === "interview" && (<div style={box}>
        <select style={input} value={level} onChange={(e) => setLevel(e.target.value)}><option>beginner</option><option>medium</option><option>advanced</option></select>
        {!iv.q && <button type="button" style={btn} disabled={busy} onClick={nextQuestion}>Start interview for {role}</button>}
        {iv.q && (<>
          <p><strong>Q{iv.history.length + (iv.ev ? 0 : 1)}.</strong> {iv.q.question}</p>
          <textarea style={{ ...input, minHeight: 110 }} placeholder="Type your answer" value={iv.a} onChange={(e) => setIv({ ...iv, a: e.target.value })} />
          {!iv.ev && <button type="button" style={btn} disabled={busy || !iv.a.trim()} onClick={evaluate}>Submit answer</button>}
          {iv.ev && (<div style={{ background: "#f0fdf4", padding: 10, borderRadius: 8 }}>
            <strong>Score {iv.ev.score}% · {iv.ev.rating}</strong><p>{iv.ev.feedback}</p>
            <Bullets title="Improve" items={iv.ev.improvements} /><p><em>Ideal answer:</em> {iv.ev.idealAnswer}</p>
            <button type="button" style={btn} onClick={nextQuestion}>Next question</button>{" "}
            <button type="button" style={{ ...btn, background: "#0f172a" }} onClick={finishInterview}>Finish &amp; report</button>
          </div>)}
        </>)}
      </div>)}

      {tab === "jobs" && (<div style={box}>
        <textarea style={{ ...input, minHeight: 90 }} placeholder="Optional: paste a job description to match against" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" style={btn} disabled={busy} onClick={() => go("/api/jobs/match", { profile, jobDescription: text }, "matches")}>Match jobs</button>
      </div>)}

      {tab === "predict" && (<div style={box}><button type="button" style={btn} disabled={busy} onClick={() => go("/api/career/predict", { profile }, "predictions")}>Predict my career</button></div>)}
      {tab === "gap" && (<div style={box}>
        <textarea style={{ ...input, minHeight: 80 }} placeholder="Optional: paste job description" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" style={btn} disabled={busy} onClick={() => go("/api/skill-gap/analyze", { profile, targetRole: role, jobDescription: text }, "analysis")}>Analyze skill gap</button>
      </div>)}
      {tab === "roadmap" && (<div style={box}>
        <input style={input} placeholder='Quiz scores as skill:score e.g. sql:40, react:75 (weak skills get more time)' value={extra} onChange={(e) => setExtra(e.target.value)} />
        <button type="button" style={btn} disabled={busy} onClick={() => go("/api/roadmap/generate", { profile, targetRole: role, quizScores: Object.fromEntries(list(extra).map((p) => p.split(":")).filter((p) => p.length === 2)) }, "roadmap")}>Generate roadmap</button>
      </div>)}
      {tab === "resources" && (<div style={box}>
        <input style={input} placeholder="Missing skills e.g. Docker, Pandas, React" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" style={btn} disabled={busy} onClick={() => go("/api/resources/recommend", { missingSkills: list(text) }, "recommendations")}>Recommend resources</button>
      </div>)}
      {tab === "projects" && (<div style={box}>
        <select style={input} value={level} onChange={(e) => setLevel(e.target.value)}><option>beginner</option><option>intermediate</option><option>advanced</option></select>
        <button type="button" style={btn} disabled={busy} onClick={() => go("/api/projects/generate", { profile, targetRole: role, level, count: 3, previousProjects: (Array.isArray(data) ? data : []).map((p) => p.title) }, "projects")}>Generate projects (click again for new ideas)</button>
      </div>)}
      {tab === "builder" && (<div style={box}>
        <input style={input} placeholder="Project titles (comma separated)" value={extra} onChange={(e) => setExtra(e.target.value)} />
        <button type="button" style={btn} disabled={busy} onClick={() => go("/api/resume/build", { profile, targetRole: role }, "resume")}>Build my resume</button>
      </div>)}

      {tab === "quiz" && (<div style={box}>
        <input style={input} placeholder="Subject e.g. Python, SQL, React, DSA, Networking…" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <select style={input} value={level} onChange={(e) => setLevel(e.target.value)}><option>beginner</option><option>medium</option><option>advanced</option></select>
        <button type="button" style={btn} disabled={busy} onClick={() => { setAnswers({}); go("/api/quiz/generate", { subject, difficulty: level, count: 5 }, "questions"); }}>Generate new quiz</button>
      </div>)}

      {err && <div style={{ ...box, borderColor: "#fca5a5", color: "#b91c1c" }}>{err}</div>}
      {engine && <p style={{ color: "#64748b", fontSize: 12 }}>Answered by: {engine}</p>}

      {data && (<div style={box}>
        {tab === "resume" && (<><h3>ATS score: {data.overallScore}%</h3><Bar value={data.overallScore} /><p>{data.summary}</p><Bullets title="Strengths" items={data.strengths} /><Bullets title="ATS issues" items={data.atsIssues || data.weaknesses} /><strong>Missing keywords</strong><div><Chips items={data.missingKeywords || data.missingSkills} /></div><Bullets title="Suggestions" items={data.suggestions} /></>)}
        {tab === "interview" && (<><h3>Interview score: {data.overallScore}% · {data.readinessLevel}</h3><p>{data.summary}</p><Bullets title="Strengths" items={data.strengths} /><Bullets title="Weaknesses" items={data.weaknesses} /><Bullets title="Recommendations" items={data.recommendations} /></>)}
        {tab === "jobs" && data.map((j, i) => (<div key={i} style={{ marginBottom: 12 }}><strong>{j.title} — {j.matchPercentage}%</strong><Bar value={j.matchPercentage} /><div>Have: <Chips items={j.matchedSkills} /></div><div>Missing: <Chips items={j.missingSkills} /></div></div>))}
        {tab === "predict" && data.map((p, i) => (<div key={i} style={{ marginBottom: 12 }}><strong>{p.role} — {p.matchPercentage}%</strong><Bar value={p.matchPercentage} /><p>{p.why}</p><div>Learn next: <Chips items={p.skillsToLearn} /></div></div>))}
        {tab === "gap" && (<><h3>{data.targetRole}: {data.readinessPercent}% ready</h3><Bar value={data.readinessPercent} /><p>{data.summary}</p><div>You have: <Chips items={data.haveSkills} /></div>{(data.gaps || []).map((g, i) => <p key={i}><strong>{g.skill}</strong> ({g.priority}) — {g.reason}</p>)}</>)}
        {tab === "roadmap" && (<><h3>{data.targetRole} · {data.totalWeeks} weeks · readiness {data.currentReadiness}%</h3><p>{data.note}</p>{(data.phases || []).map((p, i) => (<div key={i} style={{ borderLeft: "4px solid #2563eb", paddingLeft: 10, marginBottom: 14 }}><strong>Week {p.startWeek}-{p.endWeek}: {p.skill}</strong> ({p.priority}) <em>{p.reason}</em><Bullets title="Tasks" items={p.tasks} /><p>Mini project: {p.miniProject}</p><Resources items={p.resources} /></div>))}</>)}
        {tab === "resources" && data.map((r, i) => (<div key={i}><h4>{r.skill}</h4><Resources items={r.resources} /></div>))}
        {tab === "projects" && data.map((p, i) => (<div key={i} style={{ marginBottom: 14 }}><h4>{p.title} <small>({p.level}, ~{p.estimatedWeeks} wks)</small></h4><p>{p.description}</p><Chips items={p.techStack} /><Bullets title="Milestones" items={(p.milestones || []).map((m) => `Week ${m.week}: ${m.goal}`)} /><Bullets title="Stretch goals" items={p.stretchGoals} /></div>))}
        {tab === "builder" && (<><h3>{data.header?.name}</h3><p>{data.summary}</p><div>Skills: <Chips items={data.skills} /></div>{(data.projects || []).map((p, i) => (<div key={i}><strong>{p.title}</strong><Bullets title="" items={p.bullets} /></div>))}<button type="button" style={btn} onClick={() => window.print()}>Print / Save as PDF</button></>)}
        {tab === "quiz" && data.map((q) => (<div key={q.id} style={{ marginBottom: 14 }}><strong>{q.id}. {q.question}</strong>{q.options.map((o) => (<div key={o}><label><input type="radio" name={`q${q.id}`} onChange={() => setAnswers({ ...answers, [q.id]: o })} /> {o}</label></div>))}{answers[q.id] && <p style={{ color: answers[q.id] === q.correctAnswer ? "#15803d" : "#b91c1c" }}>{answers[q.id] === q.correctAnswer ? "Correct! " : `Wrong - answer: ${q.correctAnswer}. `}{q.explanation}</p>}</div>))}
      </div>)}
    </div>
  );
}
