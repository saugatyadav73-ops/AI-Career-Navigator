import { useEffect, useRef, useState } from "react";
import { api } from "../utils/api";
import { useApi } from "../utils/hooks";
import { Page, Panel, Tabs, Field, Btn, Notice, Bar, Pill, Table, Loading, Stat, when } from "../components/ui";

const HR_QUESTIONS = ["Tell me about yourself.", "Why do you want this role?", "What are your greatest strengths and one weakness?", "Describe a challenge you faced in a project and how you handled it.", "Tell me about a time you worked in a team and disagreed with someone.", "Where do you see yourself in three years?", "Why should we hire you?"];
const ROLES = ["Full Stack Web Developer", "AI / Machine Learning Engineer", "Data Analyst / Data Scientist", "Cybersecurity Analyst", "Backend / Java Developer", "DevOps / Cloud Engineer", "Mobile App Developer"];
const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function Session() {
  const [cfg, setCfg] = useState({ type: "technical", role: ROLES[0], total: 5, speak: true });
  const [state, setState] = useState("setup"); // setup | asking | evaluating | done
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [index, setIndex] = useState(0);
  const [asked, setAsked] = useState([]);
  const [results, setResults] = useState([]);
  const [last, setLast] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const recog = useRef(null);
  const started = useRef(0);

  useEffect(() => () => { try { recog.current?.stop(); window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);

  const speak = (text) => { if (cfg.speak && window.speechSynthesis) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } };
  const nextQuestion = async (n, previous) => {
    setError(""); setAnswer(""); setLast(null);
    try {
      let q;
      if (cfg.type === "hr") q = HR_QUESTIONS[n % HR_QUESTIONS.length];
      else q = (await api.post("/api/mock-interview/question", { career: cfg.role, difficulty: n < 2 ? "beginner" : "medium", previousQuestions: previous })).question.question;
      setQuestion(q); setAsked([...previous, q]); setIndex(n); setState("asking"); speak(q);
    } catch (e) { setError(e.message); }
  };
  const start = () => { started.current = Date.now(); setResults([]); setSaved(null); nextQuestion(0, []); };
  const listen = () => {
    if (!Recognition) return;
    const r = new Recognition(); r.lang = "en-IN"; r.interimResults = true; r.continuous = true;
    let base = answer;
    r.onresult = (e) => { let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; setAnswer(`${base} ${t}`.trim()); if (e.results[e.results.length - 1].isFinal) base = `${base} ${t}`.trim(); };
    r.onerror = () => setListening(false); r.onend = () => setListening(false);
    recog.current = r; r.start(); setListening(true);
  };
  const stopListening = () => { try { recog.current?.stop(); } catch { /* ignore */ } setListening(false); };

  const submit = async () => {
    stopListening(); setState("evaluating"); setError("");
    try {
      const ev = (await api.post("/api/mock-interview/evaluate", { question, answer })).evaluation;
      setLast(ev); setResults((r) => [...r, { question, score: ev.score, feedback: [...(ev.improvements || [])].slice(0, 2).join(" ") }]); setState("feedback");
    } catch (e) { setError(e.message); setState("asking"); }
  };
  const finish = async (all) => {
    setState("done");
    try { const d = await api.post("/api/interviews/history", { type: "voice", role: cfg.type === "hr" ? "HR round" : cfg.role, answers: all, durationSec: Math.round((Date.now() - started.current) / 1000) }); setSaved(d); } catch (e) { setError(e.message); }
  };
  const proceed = () => (index + 1 >= cfg.total ? finish(results) : nextQuestion(index + 1, asked));
  const avg = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;

  return (
    <>
      {!Recognition && <Notice kind="info">Your browser does not support speech recognition (use Chrome or Edge for voice input). You can still type your answers and hear the questions.</Notice>}
      <Notice kind="error">{error}</Notice>
      {state === "setup" && (
        <Panel title="Voice mock interview">
          <div className="fx-row">
            <Field label="Interview type" options={[["technical", "Technical (role based)"], ["hr", "HR round"]]} value={cfg.type} onChange={(e) => setCfg({ ...cfg, type: e.target.value })} />
            {cfg.type === "technical" && <Field label="Role" options={ROLES} value={cfg.role} onChange={(e) => setCfg({ ...cfg, role: e.target.value })} />}
            <Field label="Questions" type="number" min="3" max="10" value={cfg.total} onChange={(e) => setCfg({ ...cfg, total: Number(e.target.value) })} />
            <Btn onClick={start}>Start interview</Btn>
          </div>
          <p><label><input type="checkbox" checked={cfg.speak} onChange={(e) => setCfg({ ...cfg, speak: e.target.checked })} /> Read questions aloud</label></p>
          <p className="fx-muted">Allow microphone access when asked. Speak your answer, then press Submit. Your score and feedback are saved to your interview history.</p>
        </Panel>
      )}
      {(state === "asking" || state === "evaluating" || state === "feedback") && (
        <Panel title={`Question ${index + 1} of ${cfg.total}`} actions={<Pill kind="gray">{cfg.type === "hr" ? "HR" : "Technical"}</Pill>}>
          <h3 style={{ display: "block" }}>{question}</h3>
          <Btn small kind="secondary" onClick={() => speak(question)}>🔊 Repeat question</Btn>
          <div className="fx-row" style={{ marginTop: 12 }}><Field label="Your answer (speak or type)" textarea rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={state !== "asking"} /></div>
          {state === "asking" && <div className="fx-row">
            {Recognition && (listening ? <Btn kind="danger" onClick={stopListening}>⏹ Stop recording</Btn> : <Btn kind="secondary" onClick={listen}>🎤 Speak answer</Btn>)}
            <Btn disabled={answer.trim().length < 5} onClick={submit}>Submit answer</Btn></div>}
          {listening && <Notice kind="info">Listening... speak clearly, then press Stop.</Notice>}
          {state === "evaluating" && <Notice kind="info">Evaluating your answer...</Notice>}
          {state === "feedback" && last && <>
            <Notice kind={last.score >= 60 ? "ok" : "info"}><b>Score: {last.score}/100</b></Notice>
            {last.strengths?.length > 0 && <p><b>Strengths:</b> {last.strengths.join(" ")}</p>}{last.improvements?.length > 0 && <p><b>Improve:</b> {last.improvements.join(" ")}</p>}
            <Btn onClick={proceed}>{index + 1 >= cfg.total ? "Finish & save" : "Next question"}</Btn></>}
        </Panel>
      )}
      {state === "done" && (
        <Panel title="Interview complete" actions={<Btn small onClick={() => setState("setup")}>New interview</Btn>}>
          <div className="fx-grid"><Stat label="Average score" value={avg} />{saved && <Stat label="XP earned" value={`+${saved.xp?.awarded || 0}`} />}</div>
          {results.map((r, i) => <div key={i} className="fx-card"><b>Q{i + 1}.</b> {r.question}<Bar label="Score" value={r.score} suffix="" /></div>)}
        </Panel>
      )}
    </>
  );
}

function History() {
  const h = useApi("/api/interviews/history");
  const c = h.data?.comparison;
  return (
    <Panel title="Interview history & comparison"><Loading loading={h.loading} error={h.error}>
      {c && <div className="fx-grid"><Stat label="Attempts" value={c.attempts} /><Stat label="Latest" value={c.latest} hint={c.previous !== null ? `previous ${c.previous}` : ""} /><Stat label="Best / Average" value={`${c.best} / ${c.average}`} /><Stat label="Trend" value={c.trend} /></div>}
      <Table head={["Date", "Type", "Role", "Questions", "Score"]} empty="No interviews saved yet." rows={(h.data?.items || []).map((i) => [when(i.createdAt), i.type, i.role || "-", i.questions, <Pill key="s" kind={i.score >= 70 ? "green" : i.score >= 50 ? "amber" : "red"}>{i.score}</Pill>])} />
    </Loading></Panel>
  );
}

function VoiceInterview() {
  const [tab, setTab] = useState("session");
  return (
    <Page title="Voice Mock Interview" subtitle="Practise out loud with technical and HR rounds, get feedback, and compare with earlier attempts.">
      <Tabs tabs={[["session", "Practice"], ["history", "History"]]} value={tab} onChange={setTab} />
      {tab === "session" ? <Session /> : <History />}
    </Page>
  );
}

export default VoiceInterview;
