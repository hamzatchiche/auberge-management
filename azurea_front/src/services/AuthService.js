import { api } from "./api";
export const AuthAPI={
     register: (payload) =>
        api.post('/auth/register', payload),

    login: (payload) =>
        api.post('/auth/login', payload),

    me: () =>
        api.get('/me'),

    logout: () =>
        api.post('/auth/logout', {}),

    forgot: (email) =>
        api.post('/auth/forgot-password', { email }),

    reset: (payload) =>
        api.post('/auth/reset-password', payload),
}