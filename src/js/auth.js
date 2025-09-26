import { ENV } from '../config/env.js';

const { API_BASE, TOKEN_KEY, USER_KEY, EXP_KEY } = ENV;

function saveAuth({ token, user, expiresAt, expires_in }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user)  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (expiresAt) localStorage.setItem(EXP_KEY, String(new Date(expiresAt).getTime()));
  else if (expires_in) localStorage.setItem(EXP_KEY, String(Date.now() + Number(expires_in) * 1000));
}

export function getToken(){ return localStorage.getItem(TOKEN_KEY); }

function nameFromEmail(email) {
  const base = (email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return base.length >= 3 ? base : `user_${Math.random().toString(36).slice(2,8)}`;
}


async function loginRequest({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Accept':'application/json', 'Content-Type':'application/json' },
    body: JSON.stringify({ email: email.trim(), password })
  });

  const raw = await res.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch {}

  if (!res.ok) {
    const msg = data?.message || data?.errors?.[0]?.message || `Login failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const token = data?.accessToken || data?.access_token || data?.token || data?.data?.accessToken;
  if (!token) throw new Error('API did not return a token.');

  const user = data?.user || data?.data?.user || { email };
  saveAuth({ token, user, expiresAt: data?.expiresAt, expires_in: data?.expires_in });
  return { token, user };
}

export async function registerRequest({ email, password, }) {
const payload = {
    name: nameFromEmail(email),        
    email: email.trim(),
    password
  };

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Accept':'application/json','Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  const raw = await res.text(); 
  let data = {}; 
  
  try { data = raw ? JSON.parse(raw) : {}; } 
  catch { console.log("bad parsing")}

  if (!res.ok) throw new Error(data?.message || data?.errors?.[0]?.message || `Registration failed (HTTP ${res.status})`);

  const token = data?.accessToken || data?.access_token || data?.token || data?.data?.accessToken;
  const user  = data?.user || data?.data?.user || { email };


  if (token) saveAuth({ token, user, expiresAt: data?.expiresAt, expires_in: data?.expires_in });
  return { created: true, token, user };
}

export function logout(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(EXP_KEY); }


window.Auth = { registerRequest, loginRequest, getToken, logout };
