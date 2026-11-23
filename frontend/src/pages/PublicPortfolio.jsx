import { useParams } from "react-router-dom";
import { useApi } from "../utils/hooks";
import { Loading, Pill } from "../components/ui";

const THEMES = { clean: { bg: "#f8fafc", fg: "#0f172a", card: "#ffffff" }, dark: { bg: "#0f172a", fg: "#e2e8f0", card: "#1e293b" }, colorful: { bg: "#faf5ff", fg: "#3b0764", card: "#ffffff" } };

// Public, read-only portfolio page (/p/:slug). No login needed; only data the student chose to publish.
function PublicPortfolio() {
  const { slug } = useParams();
  const p = useApi(`/api/portfolio/public/${slug}`);
  const d = p.data?.portfolio;
  const t = THEMES[d?.theme] || THEMES.clean;
  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.fg, padding: "32px 16px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <Loading loading={p.loading} error={p.error}>
          {d && <>
            <h1 style={{ marginBottom: 4 }}>{d.name}</h1>
            <p style={{ fontSize: 18, marginTop: 0 }}>{d.headline}</p>
            {d.education && <p style={{ opacity: 0.8 }}>{d.education}</p>}
            <p>{d.about}</p>
            <p>{Object.entries(d.links || {}).filter(([, v]) => v).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noreferrer noopener" style={{ marginRight: 14, color: "inherit" }}>{k}</a>)}</p>
            <h2>Skills</h2><p>{d.skills.map((s) => <Pill key={s}>{s}</Pill>)}</p>
            <h2>Projects</h2>
            {d.projects.map((x) => <div key={x.title} style={{ background: t.card, borderRadius: 12, padding: 16, margin: "10px 0" }}><b>{x.title}</b> <Pill kind="gray">{x.status.replace("_", " ")}</Pill><p>{x.description}</p><p style={{ opacity: 0.8 }}>{x.tech.join(" - ")}</p>
              {x.githubUrl && <a href={x.githubUrl} target="_blank" rel="noreferrer noopener" style={{ color: "inherit" }}>Code</a>} {x.liveUrl && <a href={x.liveUrl} target="_blank" rel="noreferrer noopener" style={{ marginLeft: 12, color: "inherit" }}>Live demo</a>}</div>)}
            {d.certificates.length > 0 && <><h2>Certificates</h2><ul>{d.certificates.map((c) => <li key={c.title}>{c.credentialUrl ? <a href={c.credentialUrl} target="_blank" rel="noreferrer noopener" style={{ color: "inherit" }}>{c.title}</a> : c.title}{c.issuer ? ` - ${c.issuer}` : ""}</li>)}</ul></>}
          </>}
        </Loading>
      </div>
    </div>
  );
}

export default PublicPortfolio;
