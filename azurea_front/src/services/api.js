// Generic API client — Laravel backend (Sanctum).
// Front .env : VITE_API_URL=http://localhost:8000/api
// Chaque requête ajoute automatiquement Authorization: Bearer <token>.

const BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api"
).replace(/\/$/, "");
const TOKEN_KEY = "token";

export function getApiBase() {
  return BASE;
}
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event("auberge-auth"));
  } catch {}
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("auberge-session");
    window.dispatchEvent(new Event("auberge-auth"));
  } catch {}
}

function buildHeaders(extra) {
  const h = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extra || {}),
  };
  const t = getToken();
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

async function handleRes(res, path) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      data?.message || data?.error || data?.msg || `Erreur ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    // Token expiré / supprimé → on nettoie et on renvoie vers /connexion.
    // (pas pour /auth/* : un mauvais mot de passe peut aussi répondre 401)
    if (res.status === 401 && !path.startsWith("/auth/")) {
      clearToken();
      if (!window.location.pathname.startsWith("/connexion")) {
        window.location.href = "/connexion";
      }
    }
    throw err;
  }
  return data;
}

export async function apiFetch(
  path,
  { method = "GET", body, headers, signal } = {},
) {
  const url = path.startsWith("http")
    ? path
    : `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const opts = { method, headers: buildHeaders(headers), signal };
  if (body !== undefined) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  return handleRes(res, path);
}

export const api = {
  get: (p, o) => apiFetch(p, { ...o, method: "GET" }),
  post: (p, body, o) => apiFetch(p, { ...o, method: "POST", body }),
  put: (p, body, o) => apiFetch(p, { ...o, method: "PUT", body }),
  patch: (p, body, o) => apiFetch(p, { ...o, method: "PATCH", body }),
  del: (p, body, o) => apiFetch(p, { ...o, method: "DELETE", body }),
};

const qs = (params = {}) => {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : "";
};

// ───────── Auth (inchangé) ─────────
export const AuthAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (payload) => api.post("/auth/register", payload),
  me: () => api.get("/me"),
  forgot: (email) => api.post("/auth/forgot-password", { email }),
  reset: (payload) => api.post("/auth/reset-password", payload),
  logout: () => api.post("/auth/logout", {}),
};

// ───────── Profil (tous les utilisateurs connectés) ─────────
export const ProfileAPI = {
  update: (body) => api.put("/me/update", body),
  changePassword: (body) => api.patch("/me/changepassword", body),
};

// ───────── Public ─────────
export const AubergeAPI = {
  get: () => api.get("/auberge"),
  update: (id, body) => api.patch(`/auberge/${id}`, body), // admin
};

export const RoomsAPI = {
  list: () => api.get("/chambres"),
  available: (params) => api.get(`/availablechambres${qs(params)}`),
  create: (body) => api.post("/chambre", body), // réception
  update: (id, body) => api.patch(`/chambre/${id}`, body),
  setStatus: (id, body) => api.patch(`/chambre/${id}/status`, body),
  remove: (id) => api.del(`/chambre/${id}`),
};

export const ServicesAPI = {
  list: () => api.get("/services"),
  create: (body) => api.post("/service", body), // réception
  update: (id, body) => api.patch(`/service/${id}`, body),
  remove: (id) => api.del(`/service/${id}`),
};

// ───────── Réservations ─────────
export const ReservationsAPI = {
  // client connecté
  mine: () => api.get("/me/reservations"),
  mineById: (id) => api.get(`/me/reservations/${id}`),
  create: (chambreId, body) =>
    api.post(`/chambres/${chambreId}/reservation`, body),
  cancel: (id) => api.patch(`/reservations/${id}/cancel`, {}),
  addService: (id, body) => api.patch(`/reservations/${id}/services`, body),
  // réception
  all: () => api.get("/reservations"),
  byId: (id) => api.get(`/reservation/${id}`),
  arrivalsToday: () => api.get("/reservations/CheckIn"),
  departuresToday: () => api.get("/reservations/CheckOut"),
  checkIn: (id) => api.post(`/reservation/${id}/CheckIn`, {}),
  checkOut: (id) => api.post(`/reservation/${id}/CheckOut`, {}),
};

// ───────── Factures / paiements ─────────
export const InvoicesAPI = {
  mine: () => api.get("/me/factures"),
  all: () => api.get("/factures"), // réception
  pay: (id, body) => api.post(`/facture/${id}`, body),
  resendConfirmation: (id) => api.post(`/facture/${id}/confirmation`, {}),
};

// ───────── Admin ─────────
export const UsersAPI = {
  list: () => api.get("/administration/AllUsers"),
  createReceptionniste: (body) =>
    api.post("/administration/createReceptionniste", body),
  removeReceptionniste: (body) =>
    api.del("/administration/receptionniste", body),
};