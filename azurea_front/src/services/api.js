// Generic API client — ready to talk to Laravel backend.
// Set VITE_API_URL in your .env (e.g. http://localhost:8000/api)
// All requests automatically attach Authorization: Bearer <token> if present.

const BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'auberge-token';

export function getApiBase(){ return BASE; }
export function getToken(){ try{ return localStorage.getItem(TOKEN_KEY); }catch{ return null; } }
export function setToken(token){ try{ localStorage.setItem(TOKEN_KEY, token); window.dispatchEvent(new Event('auberge-auth')); }catch{} }
export function clearToken(){ try{ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem('auberge-session'); window.dispatchEvent(new Event('auberge-auth')); }catch{} }

function buildHeaders(extra){
  const h = { 'Content-Type':'application/json', 'Accept':'application/json', ...(extra||{}) };
  const t = getToken();
  if(t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

async function handleRes(res){
  const text = await res.text();
  let data=null;
  try{ data = text ? JSON.parse(text) : null; }catch{ data = text; }
  if(!res.ok){
    const msg = data?.message || data?.error || data?.msg || `Erreur ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    // auto logout on 401
    if(res.status===401){ clearToken(); }
    throw err;
  }
  return data;
}

export async function apiFetch(path, { method='GET', body, headers, signal }={}){
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/')?'':'/'}${path}`;
  const opts = { method, headers: buildHeaders(headers), signal };
  if(body!==undefined){
    opts.body = typeof body==='string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  return handleRes(res);
}

export const api = {
  get:(p,o)=>apiFetch(p,{...o,method:'GET'}),
  post:(p,body,o)=>apiFetch(p,{...o,method:'POST',body}),
  put:(p,body,o)=>apiFetch(p,{...o,method:'PUT',body}),
  patch:(p,body,o)=>apiFetch(p,{...o,method:'PATCH',body}),
  del:(p,o)=>apiFetch(p,{...o,method:'DELETE'}),
};

// --- Domain helpers (empty API — plug your Laravel routes here) ---
// Adjust paths to match your backend. These are conventional defaults.
// Each helper returns parsed JSON. UI should handle empty arrays gracefully.

export const AuthAPI = {
  login: (email,password)=> api.post('/auth/login', { email, password }),
  register: (payload)=> api.post('/auth/register', payload), // {prenom,nom,email,password,password_confirmation}
  me: ()=> api.get('/auth/me'),
  forgot: (email)=> api.post('/auth/forgot-password', { email }),
  reset: (payload)=> api.post('/auth/reset-password', payload),
  logout: ()=> api.post('/auth/logout', {}),
  // alternative Laravel Sanctum/Breeze routes if you use them:
  // login: (email,password)=> api.post('/login', { email, password }),
};

export const RoomsAPI = {
  list: (params={})=>{
    const q = new URLSearchParams(params).toString();
    return api.get(`/rooms${q?'?'+q:''}`);
  },
  get: (id)=> api.get(`/rooms/${id}`),
  create: (payload)=> api.post('/rooms', payload),
  update: (id,payload)=> api.put(`/rooms/${id}`, payload),
  remove: (id)=> api.del(`/rooms/${id}`),
};
export const ReservationsAPI = {
  list: (params={})=>{ const q=new URLSearchParams(params).toString(); return api.get(`/reservations${q?'?'+q:''}`); },
  get: (id)=> api.get(`/reservations/${id}`),
  create: (payload)=> api.post('/reservations', payload),
  update: (id,payload)=> api.put(`/reservations/${id}`, payload),
  cancel: (id)=> api.post(`/reservations/${id}/cancel`, {}),
  checkin: (id)=> api.post(`/reservations/${id}/check-in`, {}),
  checkout: (id)=> api.post(`/reservations/${id}/check-out`, {}),
};
export const InvoicesAPI = {
  list: (params={})=>{ const q=new URLSearchParams(params).toString(); return api.get(`/invoices${q?'?'+q:''}`); },
  get: (id)=> api.get(`/invoices/${id}`),
  createForReservation: (reservationId)=> api.post('/invoices', { reservation_id: reservationId }),
};
export const PaymentsAPI = {
  list: (params={})=>{ const q=new URLSearchParams(params).toString(); return api.get(`/payments${q?'?'+q:''}`); },
  create: (payload)=> api.post('/payments', payload), // {invoice_id, montant}
};
export const ServicesAPI = {
  list: ()=> api.get('/services'),
  create: (p)=> api.post('/services', p),
  update: (id,p)=> api.put(`/services/${id}`, p),
  remove: (id)=> api.del(`/services/${id}`),
};
export const UsersAPI = {
  list: (params={})=>{ const q=new URLSearchParams(params).toString(); return api.get(`/users${q?'?'+q:''}`); },
  get: (id)=> api.get(`/users/${id}`),
  create: (p)=> api.post('/users', p),
  update: (id,p)=> api.put(`/users/${id}`, p),
  toggle: (id)=> api.patch(`/users/${id}/toggle`, {}),
};
export const AubergeAPI = {
  get: ()=> api.get('/auberge'),
  update: (payload)=> api.put('/auberge', payload),
};
