// Central JWT helpers — role auto-detection from token
// Supports Laravel Sanctum / JWT / Passport style payloads.

function b64Decode(str) {
  // url-safe
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  try {
    // atob available in browser
    const json = atob(b64);
    // handle utf8
    try { return decodeURIComponent(escape(json)); } catch { return json; }
  } catch { return null; }
}

export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payload = b64Decode(parts[1]);
  if (!payload) return null;
  try { return JSON.parse(payload); } catch { return null; }
}

// Normalise any backend role string to canonical values used by the router
const ROLE_MAP = {
  'CLIENT': 'CLIENT',
  'USER': 'CLIENT',
  'CUSTOMER': 'CLIENT',
  'RECEPTIONNISTE': 'RECEPTIONNISTE',
  'RECEPTIONISTE': 'RECEPTIONNISTE',
  'RECEPTIONIST': 'RECEPTIONNISTE',
  'RECEPTION': 'RECEPTIONNISTE',
  'STAFF': 'RECEPTIONNISTE',
  'ADMIN': 'ADMIN',
  'ADMINISTRATEUR': 'ADMIN',
  'ADMINISTRATOR': 'ADMIN',
  'SUPER_ADMIN': 'ADMIN',
};

export function normalizeRole(raw) {
  if (!raw) return null;
  const upper = String(raw).trim().toUpperCase();
  return ROLE_MAP[upper] || null;
}

// Tries many common claim keys Laravel/JWT may use
export function getRoleFromToken(token) {
  const p = parseJwt(token);
  if (!p) return null;
  // direct keys in order of likelihood
  const candidates = [
    p.role,
    p.roles,
    p.Role,
    p.Roles,
    p['role'],
    p['roles'],
    p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'],
    p.user?.role,
    p.data?.role,
  ];
  for (const c of candidates) {
    if (!c) continue;
    // roles as array -> first entry
    const raw = Array.isArray(c) ? c[0] : c;
    const norm = normalizeRole(raw);
    if (norm) return norm;
    // fallback: if normalize failed but value looks like string, keep uppercased
    if (typeof raw === 'string' && raw.trim()) {
      const upper = raw.trim().toUpperCase();
      if (['CLIENT','RECEPTIONNISTE','ADMIN'].includes(upper)) return upper;
    }
  }
  return null;
}

export function isTokenExpired(token) {
  const p = parseJwt(token);
  if (!p || !p.exp) return false; // no exp => treat as not expired
  const now = Math.floor(Date.now() / 1000);
  return p.exp < now;
}

export function getUserFromToken(token) {
  const p = parseJwt(token);
  if (!p) return null;
  return {
    id: p.sub || p.id || p.user_id || p.uid || p.user?.id || null,
    email: p.email || p.user?.email || null,
    prenom: p.prenom || p.firstname || p.first_name || p.given_name || p.user?.prenom || null,
    nom: p.nom || p.lastname || p.last_name || p.family_name || p.user?.nom || null,
    role: getRoleFromToken(token),
    raw: p,
  };
}

export const ROLE_HOME = {
  CLIENT: '/client/dashboard',
  RECEPTIONNISTE: '/reception/dashboard',
  ADMIN: '/admin/dashboard',
};

export function homeForRole(role) {
  const norm = normalizeRole(role);
  return ROLE_HOME[norm] || '/';
}
