// Auth helpers — token storage + role auto-detection
import { getRoleFromToken, isTokenExpired, normalizeRole, parseJwt, homeForRole } from '../utils/jwt';
import { getToken as getApiToken, setToken as setApiToken, clearToken as clearApiToken } from './api';

export const TOKEN_KEY = 'auberge-token';
export const SESSION_KEY = 'auberge-session';

// re-export for convenience
export { getRoleFromToken, isTokenExpired, normalizeRole, parseJwt, homeForRole };

export function getStoredToken(){
  try{ return localStorage.getItem(TOKEN_KEY); }catch{ return null; }
}
export function getStoredUser(){
  try{
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{ return null; }
}

export function saveAuth({ token, user }){
  // token can be string or object containing it
  let t = token;
  if(t && typeof t === 'object'){
    t = t.token || t.access_token || t.accessToken || t.jwt || t.id_token || null;
  }
  if(typeof t === 'string' && t){
    setApiToken(t);
    try{ localStorage.setItem(TOKEN_KEY, t); }catch{}
  }
  // user may be inside token response or separate
  let u = user;
  if(!u && token && typeof token === 'object'){
    u = token.user || token.data?.user || token.data || null;
  }
  // if still no user, try to derive from JWT payload
  if(!u && t){
    const payload = parseJwt(t);
    if(payload){
      const role = getRoleFromToken(t);
      u = {
        id: payload.sub || payload.id || payload.user_id || payload.uid || null,
        email: payload.email || payload.user?.email || null,
        prenom: payload.prenom || payload.firstname || payload.first_name || payload.given_name || payload.user?.prenom || null,
        nom: payload.nom || payload.lastname || payload.last_name || payload.family_name || payload.user?.nom || null,
        role: role || payload.role || null,
      };
    }
  }
  if(u){
    try{ localStorage.setItem(SESSION_KEY, JSON.stringify(u)); }catch{}
  }
  try{ window.dispatchEvent(new Event('auberge-auth')); }catch{}
  return { token: t, user: u, role: u?.role ? normalizeRole(u.role) : (t ? getRoleFromToken(t) : null) };
}

export function clearAuth(){
  clearApiToken();
  try{
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('pending-booking');
    window.dispatchEvent(new Event('auberge-auth'));
  }catch{}
}

export function isAuthenticated(){
  const t = getStoredToken() || getApiToken();
  if(!t) return false;
  if(isTokenExpired(t)) { clearAuth(); return false; }
  return true;
}

export function getCurrentRole(){
  const t = getStoredToken() || getApiToken();
  if(!t) return null;
  if(isTokenExpired(t)) { clearAuth(); return null; }
  let role = getRoleFromToken(t);
  if(role) return role;
  const u = getStoredUser();
  if(u?.role) return normalizeRole(u.role);
  return null;
}

export function getHomeForCurrentUser(){
  const role = getCurrentRole();
  return homeForRole(role) || '/';
}

// Extract token from various Laravel response shapes
export function extractToken(data){
  if(!data) return null;
  if(typeof data === 'string') return data;
  return data.token || data.access_token || data.accessToken || data.jwt || data.id_token || data.data?.token || data.data?.access_token || null;
}
export function extractUser(data){
  if(!data || typeof data === 'string') return null;
  return data.user || data.data?.user || data.data || null;
}
