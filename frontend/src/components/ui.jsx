// Tiny UI kit shared by the checklist feature pages.
export function Page({ title, subtitle, children }) {
  return (
    <div className="fx-page">
      <div className="fx-head"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {children}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="fx-tabs" role="tablist">
      {tabs.map(([id, label]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} className={`fx-tab ${value === id ? "active" : ""}`} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}

export const Panel = ({ title, actions, children }) => (
  <section className="fx-panel">{(title || actions) && <h3><span>{title}</span><span>{actions}</span></h3>}{children}</section>
);

export const Stat = ({ label, value, hint }) => (
  <div className="fx-stat"><b>{value ?? "-"}</b><span>{label}</span>{hint && <div className="fx-muted">{hint}</div>}</div>
);

export const Btn = ({ kind = "", small, children, ...rest }) => (
  <button type="button" className={`fx-btn ${kind} ${small ? "small" : ""}`} {...rest}>{children}</button>
);

export function Field({ label, type = "text", options, textarea, ...rest }) {
  const id = `f-${String(label).replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="fx-field">
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select id={id} {...rest}>{options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}</select>
      ) : textarea ? <textarea id={id} {...rest} /> : <input id={id} type={type} {...rest} />}
    </div>
  );
}

export const Notice = ({ kind = "info", children }) => (children ? <div className={`fx-notice ${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div> : null);

export const Bar = ({ label, value, max = 100, suffix = "%" }) => (
  <div className="fx-barrow">
    <span title={label}>{label}</span>
    <div className="fx-bar"><div style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} /></div>
    <b>{value}{suffix}</b>
  </div>
);

export const Pill = ({ kind = "", children }) => <span className={`fx-pill ${kind}`}>{children}</span>;
export const Empty = ({ children }) => <div className="fx-empty">{children}</div>;
export const Loading = ({ error, loading, children }) => (error ? <Notice kind="error">{error}</Notice> : loading ? <div className="fx-empty">Loading...</div> : children);

export const Table = ({ head, rows, empty = "Nothing here yet." }) => (
  rows.length === 0 ? <Empty>{empty}</Empty> : (
    <div className="fx-scroll"><table className="fx-table"><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
  )
);

export const when = (v) => (v ? String(v).replace("T", " ").slice(0, 16) : "-");
export const prettyList = (arr) => (Array.isArray(arr) && arr.length ? arr.join(", ") : "-");
