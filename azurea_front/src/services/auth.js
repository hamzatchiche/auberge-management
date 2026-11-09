// src/services/auth.js

import {
    getToken as getApiToken,
    setToken as setApiToken,
    clearToken as clearApiToken
} from './api';

import {
    getRoleFromToken,
    isTokenExpired,
    normalizeRole,
    parseJwt,
    homeForRole
} from '../utils/jwt';

export const TOKEN_KEY = 'token';
export const SESSION_KEY = 'auberge-session';

export {
    getRoleFromToken,
    isTokenExpired,
    normalizeRole,
    parseJwt,
    homeForRole
};

export function getStoredToken() {
    return getApiToken();
}

export function getStoredUser() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveAuth({ token, user }) {
    let t = token;

    if (t && typeof t === 'object') {
        t = t.token || t.access_token || t.accessToken || t.jwt || null;
    }

    if (typeof t === 'string' && t) {
        setApiToken(t);
    }

    let u = user;

    if (!u && token && typeof token === 'object') {
        u = token.user || token.data?.user || token.data || null;
    }

    if (!u && t) {
        const payload = parseJwt(t);

        if (payload) {
            u = {
                id: payload.sub || payload.id || payload.user_id || null,
                email: payload.email || null,
                prenom: payload.prenom || payload.firstname || null,
                nom: payload.nom || payload.lastname || null,
                role: getRoleFromToken(t) || payload.role || null,
            };
        }
    }

    if (u) {
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(u));
        } catch {}
    }

    window.dispatchEvent(new Event('auberge-auth'));

    return {
        token: t,
        user: u,
        role: u?.role
            ? normalizeRole(u.role)
            : (t ? getRoleFromToken(t) : null)
    };
}

export function clearAuth() {
    clearApiToken();

    try {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('pending-booking');
    } catch {}

    window.dispatchEvent(new Event('auberge-auth'));
}

export function isAuthenticated() {
    const token = getStoredToken();

    if (!token) return false;

    if (isTokenExpired(token)) {
        clearAuth();
        return false;
    }

    return true;
}

export function getCurrentRole() {
    const token = getStoredToken();

    if (!token || isTokenExpired(token)) {
        if (token) clearAuth();
        return null;
    }

    const role = getRoleFromToken(token);

    if (role) return role;

    const user = getStoredUser();

    return user?.role ? normalizeRole(user.role) : null;
}

export function getHomeForCurrentUser() {
    return homeForRole(getCurrentRole()) || '/';
}