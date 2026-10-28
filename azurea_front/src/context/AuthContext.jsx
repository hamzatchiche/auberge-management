import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getRoleFromToken, isTokenExpired, normalizeRole, homeForRole } from '../utils/jwt';
import { api, AuthAPI } from '../services/api';
import { getStoredToken, getStoredUser, saveAuth, clearAuth, extractToken, extractUser } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
  const [token, setTokenState] = useState(()=> getStoredToken());
  const [user, setUserState] = useState(()=> getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncFromStorage = useCallback(()=>{
    const t = getStoredToken();
    const u = getStoredUser();
    if(t && isTokenExpired(t)){
      clearAuth();
      setTokenState(null);
      setUserState(null);
      return;
    }
    setTokenState(t);
    setUserState(u);
  },[]);

  useEffect(()=>{
    syncFromStorage();
    const h = ()=> syncFromStorage();
    window.addEventListener('auberge-auth', h);
    window.addEventListener('storage', h);
    return ()=>{ window.removeEventListener('auberge-auth', h); window.removeEventListener('storage', h); }
  },[syncFromStorage]);

  const role = useMemo(()=>{
    if(token){
      const r = getRoleFromToken(token);
      if(r) return r;
    }
    if(user?.role) return normalizeRole(user.role);
    return null;
  },[token,user]);

  const isAuthenticated = Boolean(token && !isTokenExpired(token));

  const login = useCallback(async ({ email, password })=>{
    setLoading(true); setError('');
    try{
      // Try backend first
      let data;
      try{ data = await AuthAPI.login(email,password); }catch(e){
        // Re-throw to show error instead of silently falling back to demo
        throw e;
      }
      const t = extractToken(data);
      const u = extractUser(data);
      if(!t) throw new Error(data?.message || 'Token manquant dans la réponse du serveur.');
      saveAuth({ token: t, user: u || undefined });
      // Try to enrich user via /auth/me if backend provides it
      try{
        const me = await AuthAPI.me();
        const meUser = extractUser(me) || me;
        if(meUser && typeof meUser === 'object'){
          saveAuth({ token: t, user: meUser });
        }
      }catch{}
      syncFromStorage();
      return { token: t, user: u };
    }catch(e){
      setError(e.message || 'Identifiants invalides.');
      throw e;
    }finally{ setLoading(false); }
  },[syncFromStorage]);

  const register = useCallback(async (payload)=>{
    setLoading(true); setError('');
    try{
      const data = await AuthAPI.register(payload);
      const t = extractToken(data);
      const u = extractUser(data);
      // Some backends don't return token on register — just succeed
      if(t){
        saveAuth({ token: t, user: u || undefined });
        syncFromStorage();
      }
      return data;
    }catch(e){ setError(e.message||'Inscription impossible.'); throw e; }finally{ setLoading(false); }
  },[syncFromStorage]);

  const logout = useCallback(async ()=>{
    try{ await AuthAPI.logout(); }catch{}
    clearAuth();
    syncFromStorage();
  },[syncFromStorage]);

  const refreshMe = useCallback(async ()=>{
    if(!token) return null;
    try{
      const me = await AuthAPI.me();
      const meUser = extractUser(me) || me;
      if(meUser && typeof meUser === 'object'){
        saveAuth({ token, user: meUser });
        syncFromStorage();
        return meUser;
      }
    }catch(e){
      if(e?.status===401) { clearAuth(); syncFromStorage(); }
    }
    return null;
  },[token,syncFromStorage]);

  const value = useMemo(()=>({
    token, user, role, isAuthenticated, loading, error,
    login, register, logout, refreshMe,
    home: role ? homeForRole(role) : '/',
  }),[token,user,role,isAuthenticated,loading,error,login,register,logout,refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  const ctx = useContext(AuthContext);
  if(!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
