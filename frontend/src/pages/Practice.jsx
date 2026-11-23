import { useState } from "react";
import { api } from "../utils/api";
import { useApi } from "../utils/hooks";
import { Page, Panel, Tabs, Field, Btn, Notice, Loading, Bar, Pill, Table, Empty, when } from "../components/ui";

function Take() {
  const types = useApi("/api/assessments/types");
  const [form, setForm] = useState({ type: "technical", subject: "python", mode: "standard", count: 6, difficulty: "beginner" });
  const [session, setSession] = useState(null); // { mode, token, questions | question, index, total }
  const [picked, setPicked] = useState({});     // standard: { id: option }
  const [choice, setChoice] = useState(null);   // adaptive: current choice
  const [feedback, setFeedback] = useState(null);
  const [next, setNext] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const guard = async (fn) => { setBusy(true); setError(""); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const reset = () => { setSession(null); setPicked({}); setChoice(null); setFeedback(null); setNext(null); setResult(null); };

  const start = () => guard(async () => {
    reset();
    if (form.mode === "adaptive") {
      const d = await api.post("/api/assessments/adaptive/start", { type: form.type, subject: form.subject, total: Number(form.count) });
      setSession({ mode: "adaptive", token: d.attemptToken, question: d.question, index: d.index, total: d.total });
    } else {
      const d = await api.post("/api/assessments/start", { type: form.type, subject: form.subject, count: Number(form.count), difficulty: form.difficulty });
      setSession({ mode: "standard", token: d.attemptToken, questions: d.questions });
    }
  });
  const submitStandard = () => guard(async () => { setResult(await api.post("/api/assessments/submit", { attemptToken: session.token, answers: picked })); setSession(null); });
  const checkAdaptive = () => guard(async () => {
    const d = await api.post("/api/assessments/adaptive/answer", { attemptToken: session.token, answer: choice });
    setFeedback(d.feedback);
    if (d.finished) setResult({ result: d.result, saved: d.saved }); else setNext(d);
  });
  const goNext = () => { setSession({ ...session, token: next.attemptToken, question: next.question, index: next.index }); setChoice(null); setFeedback(null); setNext(null); };

  return (
    <>
      <Notice kind="error">{error}</Notice>
      {!session && !result && (
        <Panel title="Start an assessment">
          <Loading loading={types.loading} error={types.error}>
            <div className="fx-row">
              <Field label="Type" options={[["technical", "Technical"], ["aptitude", "Aptitude (logical / numerical)"], ["communication", "Communication"]]} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
              {form.type === "technical" && (
                <div className="fx-field">
                  <label htmlFor="subj">Subject</label>
                  <input id="subj" list="subjects" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  <datalist id="subjects">{(types.data?.types?.[0]?.subjects || []).map((s) => <option key={s.subject} value={s.subject} />)}</datalist>
                </div>
              )}
              <Field label="Mode" options={[["standard", "Standard"], ["adaptive", "Adaptive (difficulty follows you)"]]} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} />
              {form.mode === "standard" && <Field label="Level" options={["beginner", "medium", "advanced"]} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />}
              <Field label="Questions" type="number" min="4" max="15" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} />
              <Btn disabled={busy} onClick={start}>{busy ? "Starting..." : "Start"}</Btn>
            </div>
            <p className="fx-muted">Answers are checked on the server, so results are saved to your history and feed weak-topic detection and your career readiness.</p>
          </Loading>
        </Panel>
      )}

      {session?.mode === "standard" && (
        <Panel title={`${form.type} assessment`} actions={<Pill>{Object.keys(picked).length}/{session.questions.length} answered</Pill>}>
          {session.questions.map((q) => (
            <div key={q.id} className="fx-card">
              <b>{q.id}. {q.question}</b> <Pill kind="gray">{q.difficulty}</Pill>
              {q.options.map((o) => <button key={o} type="button" className={`fx-opt ${picked[q.id] === o ? "sel" : ""}`} onClick={() => setPicked({ ...picked, [q.id]: o })}>{o}</button>)}
            </div>
          ))}
          <Btn disabled={busy} onClick={submitStandard}>Submit answers</Btn> <Btn kind="secondary" onClick={reset}>Cancel</Btn>
        </Panel>
      )}

      {session?.mode === "adaptive" && !result && (
        <Panel title={`Adaptive ${form.type} - question ${session.index} of ${session.total}`} actions={<Pill kind="amber">{session.question.difficulty}</Pill>}>
          <b>{session.question.question}</b>
          {session.question.options.map((o) => {
            const cls = feedback ? (o === feedback.correctAnswer ? "right" : o === choice ? "wrong" : "") : choice === o ? "sel" : "";
            return <button key={o} type="button" disabled={Boolean(feedback)} className={`fx-opt ${cls}`} onClick={() => setChoice(o)}>{o}</button>;
          })}
          {feedback && <Notice kind={feedback.correct ? "ok" : "error"}>{feedback.correct ? "Correct! " : "Not quite. "}{feedback.explanation}</Notice>}
          {!feedback ? <Btn disabled={!choice || busy} onClick={checkAdaptive}>Check answer</Btn> : next && <Btn onClick={goNext}>Next question</Btn>}
        </Panel>
      )}

      {result && (
        <Panel title="Result" actions={<Btn small kind="secondary" onClick={reset}>Take another</Btn>}>
          <div className="fx-grid">
            <div className="fx-stat"><b>{result.result.percent}%</b><span>{result.result.score}/{result.result.total} correct</span></div>
            {result.result.abilityScore !== undefined && <div className="fx-stat"><b>{result.result.abilityScore}</b><span>Ability estimate (difficulty-weighted)</span></div>}
            {result.saved && <div className="fx-stat"><b>+{result.saved.xp} XP</b><span>{result.saved.newBadges?.length ? `New badge: ${result.saved.newBadges.map((b) => b.name).join(", ")}` : "Saved to history"}</span></div>}
          </div>
          {result.result.topics?.length > 0 && <><h4>By topic</h4>{result.result.topics.map((t) => <Bar key={t.topic} label={t.topic} value={Math.round((t.correct / t.total) * 100)} />)}</>}
          {result.review && <><h4>Review</h4>{result.review.map((r) => <div key={r.id} className="fx-card"><b>Q{r.id}</b> {r.correct ? <Pill kind="green">Correct</Pill> : <Pill kind="red">Wrong</Pill>}<div className="fx-muted">Your answer: {r.yourAnswer ?? "(none)"} | Correct: {r.correctAnswer}</div><div>{r.explanation}</div></div>)}</>}
        </Panel>
      )}
    </>
  );
}

function History() {
  const h = useApi("/api/assessments/history?limit=100");
  return (
    <Panel title="Assessment history">
      <Loading loading={h.loading} error={h.error}>
        <Table head={["Date", "Type", "Subject", "Mode", "Score", "%"]} empty="No assessments yet." rows={(h.data?.items || []).map((i) => [when(i.createdAt), i.type, i.subject, i.mode, `${i.score}/${i.total}`, <Pill key="p" kind={i.percent >= 70 ? "green" : i.percent >= 40 ? "amber" : "red"}>{i.percent}%</Pill>])} />
      </Loading>
    </Panel>
  );
}

function Weak() {
  const w = useApi("/api/assessments/weak-topics");
  return (
    <Panel title="Weak topics">
      <Loading loading={w.loading} error={w.error}>
        <p className="fx-muted">{w.data?.note}</p>
        {(w.data?.weakTopics || []).map((t) => (
          <div key={t.topic} className="fx-card"><b>{t.topic}</b> <Pill kind="red">{t.percent}%</Pill> <span className="fx-muted">({t.correct}/{t.total} correct)</span>
            <div>{t.resources.map((r) => <a key={r.url} href={r.url} target="_blank" rel="noreferrer noopener" style={{ marginRight: 12 }}>{r.title}</a>)}</div></div>
        ))}
      </Loading>
    </Panel>
  );
}

function Progress() {
  const p = useApi("/api/assessments/progress");
  return (
    <>
      <Panel title="Skill progress tracker">
        <Loading loading={p.loading} error={p.error}>
          {p.data?.skills?.length ? <><p className="fx-muted">Average across subjects: <b>{p.data.average}%</b> over {p.data.attempts} attempts</p>
            {p.data.skills.map((s) => <div key={`${s.type}-${s.subject}`}><Bar label={`${s.subject} (${s.type})`} value={s.latest} /><div className="fx-muted" style={{ marginTop: -4, marginBottom: 6 }}>First {s.first}% - Best {s.best}% - {s.attempts} attempt(s) - <Pill kind={s.trend === "improving" ? "green" : s.trend === "declining" ? "red" : "gray"}>{s.trend}</Pill></div></div>)}</> : <Empty>Take an assessment to start tracking.</Empty>}
        </Loading>
      </Panel>
      <Panel title="Reassessment - did you improve?">
        <Loading loading={p.loading} error={p.error}>
          <Table head={["Subject", "Previous", "Latest", "Change"]} empty="Retake an assessment to compare with your previous attempt." rows={(p.data?.reassessment || []).map((r) => [r.subject, `${r.previous}%`, `${r.latest}%`, <Pill key="d" kind={r.delta > 0 ? "green" : r.delta < 0 ? "red" : "gray"}>{r.delta > 0 ? "+" : ""}{r.delta}</Pill>])} />
        </Loading>
      </Panel>
    </>
  );
}

function Practice() {
  const [tab, setTab] = useState("take");
  return (
    <Page title="Practice & Assessments" subtitle="Technical, aptitude and communication tests, adaptive quizzes, weak-topic detection and progress tracking.">
      <Tabs tabs={[["take", "Take a test"], ["history", "History"], ["weak", "Weak topics"], ["progress", "Progress & reassessment"]]} value={tab} onChange={setTab} />
      {tab === "take" && <Take />}
      {tab === "history" && <History />}
      {tab === "weak" && <Weak />}
      {tab === "progress" && <Progress />}
    </Page>
  );
}

export default Practice;
