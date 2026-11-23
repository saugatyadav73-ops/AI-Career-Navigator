import { useEffect, useState } from "react";
import { api } from "./api";

/** GET `path` and expose { loading, data, error, reload }. Pass path = null to skip. */
export function useApi(path) {
  const [state, setState] = useState({ loading: Boolean(path), data: null, error: "" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return undefined;
    let alive = true;
    api.get(path)
      .then((data) => alive && setState({ loading: false, data, error: "" }))
      .catch((e) => alive && setState({ loading: false, data: null, error: e.message }));
    return () => { alive = false; };
  }, [path, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

let cachedRole = null;
/** Current account role (student | faculty | admin) from /api/me. */
export function useRole() {
  const [role, setRole] = useState(cachedRole);
  useEffect(() => {
    if (cachedRole) return undefined;
    let alive = true;
    api.get("/api/me").then((d) => { cachedRole = d.student?.role || "student"; if (alive) setRole(cachedRole); }).catch(() => alive && setRole("student"));
    return () => { alive = false; };
  }, []);
  return role;
}
export const resetRoleCache = () => { cachedRole = null; };
