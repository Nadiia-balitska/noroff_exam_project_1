const API_BASE = window.__API_BASE__ || 'https://v2.api.noroff.dev';
const TOKEN_KEY = 'hv.auth.token';
const USER_KEY  = 'hv.auth.user';
const EXP_KEY   = 'hv.auth.expiresAt';  

function saveAuth({ token, user, expiresAt, expires_in }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (expiresAt) localStorage.setItem(EXP_KEY, String(new Date(expiresAt).getTime()));
  else if (expires_in) localStorage.setItem(EXP_KEY, String(Date.now() + Number(expires_in) * 1000));
}

function getToken(){ return localStorage.getItem(TOKEN_KEY); }

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

async function registerRequest({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Accept':'application/json', 'Content-Type':'application/json' },
    body: JSON.stringify({ email: email.trim(), password })
  });

  const raw = await res.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch {}

  if (!res.ok) {
    const msg = data?.message || data?.errors?.[0]?.message || `Registration failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const token = data?.accessToken || data?.access_token || data?.token || data?.data?.accessToken;
  const user  = data?.user || data?.data?.user || { email };

  if (token) saveAuth({ token, user, expiresAt: data?.expiresAt, expires_in: data?.expires_in });
  return { created: true, token, user };
}

function logout(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(EXP_KEY); }

window.Auth = {
  registerRequest,
  loginRequest,
  getToken,
  logout
};
