import { useState } from "react";
import { api } from "../utils/api";
import { useApi } from "../utils/hooks";
import { Page, Panel, Tabs, Field, Btn, Notice, Loading, Bar, Pill, Table, Stat, Empty, when } from "../components/ui";

const useMsg = () => { const [m, setM] = useState(""); return [m, setM]; };

function Progress() {
  const g = useApi("/api/gamification/me");
  const d = g.data;
  return (
    <Loading loading={g.loading} error={g.error}>
      {d && <>
        <div className="fx-grid"><Stat label={`Level ${d.level.level}`} value={d.level.name} hint={d.level.nextName ? `${d.level.xpIntoLevel}/${d.level.xpForNext} XP to ${d.level.nextName}` : "Max level"} /><Stat label="Total XP" value={d.xp} /><Stat label="Current streak" value={`${d.streak.current} days`} hint={`Best ${d.streak.best}`} /><Stat label="Badges" value={`${d.badges.filter((b) => b.earned).length}/${d.badges.length}`} /></div>
        <Panel title="Level progress"><Bar label={`Level ${d.level.level} → ${d.level.level + 1}`} value={d.level.percent} /></Panel>
        <Panel title={`Weekly challenges (${d.challenges.week})`}>{d.challenges.challenges.map((c) => <div key={c.id}><Bar label={c.title} value={c.progress} max={c.target} suffix={`/${c.target}`} />{c.completed && <Pill kind="green">Completed +{c.reward} XP</Pill>}</div>)}</Panel>
        <Panel title="Achievement badges"><div className="fx-grid">{d.badges.map((b) => <div key={b.id} className={`fx-badge ${b.earned ? "" : "off"}`}><div className="ic">{b.earned ? "🏅" : "🔒"}</div><b>{b.name}</b><div className="fx-muted">{b.description}</div></div>)}</div></Panel>
        <Panel title="Recent XP"><Table head={["Activity", "XP", "Date"]} empty="No XP yet." rows={d.recent.map((r) => [r.action.replace(/_/g, " "), `+${r.points}`, r.date])} /></Panel>
      </>}
    </Loading>
  );
}

function Leaderboard() {
  const [scope, setScope] = useState("week");
  const l = useApi(`/api/gamification/leaderboard?scope=${scope}`);
  return (
    <Panel title="Leaderboard (optional)" actions={<select value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Scope"><option value="week">This week</option><option value="all">All time</option></select>}>
      <Loading loading={l.loading} error={l.error}>
        <p className="fx-muted">{l.data?.note}</p>
        <Table head={["#", "Student", "Level", "XP"]} empty="Nobody has opted in yet." rows={(l.data?.board || []).map((b) => [b.rank, <span key="n">{b.name} {b.you && <Pill>you</Pill>}</span>, b.level, b.xp])} />
      </Loading>
    </Panel>
  );
}

function Discussions() {
  const [topic, setTopic] = useState("");
  const l = useApi(`/api/community/discussions${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`);
  const [form, setForm] = useState({ title: "", body: "", topic: "general" });
  const [open, setOpen] = useState(null);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState("");
  const [msg, setMsg] = useMsg();
  const run = async (fn) => { setMsg(""); try { await fn(); l.reload(); } catch (e) { setMsg(e.message); } };
  const load = async (id) => { setOpen(id); try { setThread(await api.get(`/api/community/discussions/${id}`)); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <Panel title="Start a discussion">
        <div className="fx-row"><Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
        <div className="fx-row"><Field label="Message" textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        <Btn onClick={() => run(async () => { await api.post("/api/community/discussions", form); setForm({ ...form, title: "", body: "" }); })}>Post</Btn><Notice kind="error">{msg}</Notice>
      </Panel>
      <Panel title="Peer learning" actions={<input placeholder="Filter by topic" value={topic} onChange={(e) => setTopic(e.target.value.toLowerCase())} aria-label="Topic filter" />}>
        <Loading loading={l.loading} error={l.error}>
          {(l.data?.discussions || []).map((d) => (
            <div key={d.id} className="fx-card"><b>{d.title}</b> <Pill kind="gray">{d.topic}</Pill> <span className="fx-muted">by {d.author} - {when(d.createdAt)} - {d.replies} replies</span><p>{d.body}</p>
              <Btn small kind="secondary" onClick={() => (open === d.id ? setOpen(null) : load(d.id))}>{open === d.id ? "Hide" : "Replies"}</Btn> {d.mine && <Btn small kind="danger" onClick={() => run(() => api.del(`/api/community/discussions/${d.id}`))}>Delete</Btn>}
              {open === d.id && thread && <div style={{ marginTop: 8 }}>{thread.replies.map((r) => <div key={r.id} className="fx-card"><span className="fx-muted">{r.author}:</span> {r.body}</div>)}
                <div className="fx-row"><Field label="Your reply" value={reply} onChange={(e) => setReply(e.target.value)} /><Btn onClick={() => run(async () => { await api.post(`/api/community/discussions/${d.id}/replies`, { body: reply }); setReply(""); await load(d.id); })}>Reply</Btn></div></div>}
            </div>))}
          {l.data?.discussions.length === 0 && <Empty>No discussions yet. Be the first to post.</Empty>}
        </Loading>
      </Panel>
    </>
  );
}

function Teams() {
  const l = useApi("/api/community/teams");
  const [form, setForm] = useState({ title: "", description: "", skillsNeeded: "" });
  const [reqs, setReqs] = useState({});
  const [msg, setMsg] = useMsg();
  const run = async (fn) => { setMsg(""); try { await fn(); l.reload(); } catch (e) { setMsg(e.message); } };
  const loadReqs = async (id) => { try { setReqs({ ...reqs, [id]: (await api.get(`/api/community/teams/${id}/requests`)).requests }); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <Panel title="Find teammates - post what you need">
        <div className="fx-row"><Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Skills needed (comma separated)" value={form.skillsNeeded} onChange={(e) => setForm({ ...form, skillsNeeded: e.target.value })} /></div>
        <div className="fx-row"><Field label="Description" textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <Btn onClick={() => run(async () => { await api.post("/api/community/teams", { ...form, skillsNeeded: form.skillsNeeded.split(",") }); setForm({ title: "", description: "", skillsNeeded: "" }); })}>Post team request</Btn><Notice kind="error">{msg}</Notice>
      </Panel>
      <Panel title="Open teams (sorted by how well your skills fit)"><Loading loading={l.loading} error={l.error}>
        {(l.data?.teams || []).map((t) => (
          <div key={t.id} className="fx-card"><b>{t.title}</b> {t.skillFit !== null && <Pill kind={t.skillFit >= 60 ? "green" : "amber"}>{t.skillFit}% skill fit</Pill>} {t.status === "closed" && <Pill kind="gray">closed</Pill>}<div className="fx-muted">by {t.owner}</div><p>{t.description}</p><p>{t.skillsNeeded.map((s) => <Pill key={s}>{s}</Pill>)}</p>
            {t.mine ? <span className="fx-inline"><Btn small kind="secondary" onClick={() => loadReqs(t.id)}>View requests</Btn>{t.status === "open" && <Btn small kind="secondary" onClick={() => run(() => api.post(`/api/community/teams/${t.id}/close`))}>Close</Btn>}</span>
              : t.myRequest ? <Pill kind="amber">Your request: {t.myRequest}</Pill> : <Btn small onClick={() => run(() => api.post(`/api/community/teams/${t.id}/request`, { message: "Hi, I would like to join." }))}>Request to join</Btn>}
            {reqs[t.id]?.map((r) => <div key={r.id} className="fx-card">{r.name}: {r.message || "(no message)"} <Pill kind="gray">{r.status}</Pill> {r.status === "pending" && <span className="fx-inline"><Btn small onClick={() => run(async () => { await api.post(`/api/community/teams/${t.id}/requests/${r.id}`, { action: "accept" }); await loadReqs(t.id); })}>Accept</Btn><Btn small kind="secondary" onClick={() => run(async () => { await api.post(`/api/community/teams/${t.id}/requests/${r.id}`, { action: "decline" }); await loadReqs(t.id); })}>Decline</Btn></span>}</div>)}
          </div>))}
        {l.data?.teams.length === 0 && <Empty>No open team requests yet.</Empty>}
      </Loading></Panel>
    </>
  );
}

function Hackathons() {
  const [mode, setMode] = useState("");
  const l = useApi(`/api/community/hackathons${mode ? `?mode=${mode}` : ""}`);
  const [form, setForm] = useState({ title: "", organizer: "", mode: "online", location: "", deadline: "", url: "", tags: "" });
  const [msg, setMsg] = useMsg();
  const run = async (fn) => { setMsg(""); try { await fn(); l.reload(); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <Panel title="Hackathon finder" actions={<select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Mode"><option value="">All modes</option><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option></select>}>
        <Loading loading={l.loading} error={l.error}>
          <p className="fx-muted">{l.data?.note} Discover more on {Object.entries(l.data?.searchLinks || {}).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noreferrer noopener" style={{ marginRight: 10 }}>{k}</a>)}</p>
          {(l.data?.hackathons || []).map((h) => <div key={h.id} className="fx-card"><b><a href={h.url} target="_blank" rel="noreferrer noopener">{h.title}</a></b> <Pill kind="gray">{h.mode}</Pill> <div className="fx-muted">{h.organizer} {h.location && `- ${h.location}`} {h.deadline && `- register by ${h.deadline}`}</div><p>{h.tags.map((t) => <Pill key={t}>{t}</Pill>)}</p>{h.mine && <Btn small kind="danger" onClick={() => run(() => api.del(`/api/community/hackathons/${h.id}`))}>Remove</Btn>}</div>)}
        </Loading>
      </Panel>
      <Panel title="Share a hackathon you found">
        <div className="fx-row"><Field label="Name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Organizer" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} /><Field label="Mode" options={["online", "offline", "hybrid"]} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} /></div>
        <div className="fx-row"><Field label="Registration link (https://)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /><Field label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /><Field label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <Btn onClick={() => run(async () => { await api.post("/api/community/hackathons", { ...form, tags: form.tags.split(",") }); setForm({ title: "", organizer: "", mode: "online", location: "", deadline: "", url: "", tags: "" }); })}>Add</Btn></div><Notice kind="error">{msg}</Notice>
      </Panel>
    </>
  );
}

function Workspace({ id, onBack }) {
  const w = useApi(`/api/workspaces/${id}`);
  const [task, setTask] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useMsg();
  const run = async (fn) => { setMsg(""); try { await fn(); w.reload(); } catch (e) { setMsg(e.message); } };
  const d = w.data;
  return (
    <Loading loading={w.loading} error={w.error}>
      {d && <>
        <Panel title={d.workspace.name} actions={<Btn small kind="secondary" onClick={onBack}>All workspaces</Btn>}>
          <p>{d.workspace.description}</p><p>Members: {d.members.map((m) => <Pill key={m.id} kind={m.role === "owner" ? "amber" : "gray"}>{m.name}</Pill>)}</p>
          {d.myRole === "owner" && <div className="fx-row"><Field label="Add member by email" value={email} onChange={(e) => setEmail(e.target.value)} /><Btn onClick={() => run(async () => { await api.post(`/api/workspaces/${id}/members`, { email }); setEmail(""); })}>Add</Btn></div>}
          <Notice kind="error">{msg}</Notice>
        </Panel>
        <Panel title="Task board">
          <div className="fx-row"><Field label="New task" value={task} onChange={(e) => setTask(e.target.value)} /><Btn onClick={() => run(async () => { await api.post(`/api/workspaces/${id}/tasks`, { title: task }); setTask(""); })}>Add task</Btn></div>
          <div className="fx-kanban">{["todo", "doing", "done"].map((s) => <div key={s}><b>{s.toUpperCase()}</b>{d.tasks.filter((t) => t.status === s).map((t) => <div key={t.id} className="fx-card">{t.title}<div className="fx-inline" style={{ marginTop: 6 }}>{["todo", "doing", "done"].filter((x) => x !== s).map((x) => <Btn key={x} small kind="secondary" onClick={() => run(() => api.put(`/api/workspaces/${id}/tasks/${t.id}`, { status: x }))}>→ {x}</Btn>)}<Btn small kind="danger" onClick={() => run(() => api.del(`/api/workspaces/${id}/tasks/${t.id}`))}>✕</Btn></div></div>)}</div>)}</div>
        </Panel>
        <Panel title="Team chat">
          {d.messages.map((m) => <div key={m.id}><b>{m.name}</b> <span className="fx-muted">{when(m.createdAt)}</span><div>{m.body}</div></div>)}
          <div className="fx-row" style={{ marginTop: 10 }}><Field label="Message" value={text} onChange={(e) => setText(e.target.value)} /><Btn onClick={() => run(async () => { await api.post(`/api/workspaces/${id}/messages`, { body: text }); setText(""); })}>Send</Btn><Btn kind="secondary" onClick={() => w.reload()}>Refresh</Btn></div>
        </Panel>
      </>}
    </Loading>
  );
}
function Workspaces() {
  const l = useApi("/api/workspaces");
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [msg, setMsg] = useMsg();
  if (open) return <Workspace id={open} onBack={() => { setOpen(null); l.reload(); }} />;
  return (
    <>
      <Panel title="Create a collaboration space"><div className="fx-row"><Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Field label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Btn onClick={async () => { setMsg(""); try { await api.post("/api/workspaces", form); setForm({ name: "", description: "" }); l.reload(); } catch (e) { setMsg(e.message); } }}>Create</Btn></div><Notice kind="error">{msg}</Notice></Panel>
      <Panel title="My workspaces"><Loading loading={l.loading} error={l.error}>
        {(l.data?.workspaces || []).map((w) => <div key={w.id} className="fx-card"><b>{w.name}</b> <Pill kind="gray">{w.role}</Pill> <span className="fx-muted">{w.members} members - {w.openTasks} open tasks</span><div><Btn small onClick={() => setOpen(w.id)}>Open</Btn></div></div>)}
        {l.data?.workspaces.length === 0 && <Empty>No workspaces yet. Create one for your team project.</Empty>}
      </Loading></Panel>
    </>
  );
}

function Community() {
  const [tab, setTab] = useState("progress");
  return (
    <Page title="Gamification & Community" subtitle="XP, levels, badges, streaks, weekly challenges, peer learning, teammates, hackathons and team workspaces.">
      <Tabs tabs={[["progress", "XP & badges"], ["leaderboard", "Leaderboard"], ["discuss", "Peer learning"], ["teams", "Team finder"], ["hack", "Hackathons"], ["spaces", "Collaboration"]]} value={tab} onChange={setTab} />
      {tab === "progress" && <Progress />}{tab === "leaderboard" && <Leaderboard />}{tab === "discuss" && <Discussions />}{tab === "teams" && <Teams />}{tab === "hack" && <Hackathons />}{tab === "spaces" && <Workspaces />}
    </Page>
  );
}

export default Community;
