const API_BASE = window.__API_BASE__ || 'https://v2.api.noroff.dev';
const TOKEN_KEY = 'hv.auth.token';
const USER_KEY  = 'hv.auth.user';
const EXP_KEY   = 'hv.auth.expiresAt';

function saveAuth({ token, user, expiresAt, expires_in }) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (expiresAt) {
    localStorage.setItem(EXP_KEY, String(new Date(expiresAt).getTime()));
  } else if (expires_in) {
    localStorage.setItem(EXP_KEY, String(Date.now() + Number(expires_in) * 1000));
  }
}

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getUser()  { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
function logout()   { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(EXP_KEY); }

function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  const exp = localStorage.getItem(EXP_KEY);
  return exp ? Date.now() < Number(exp) : true;
}

async function loginRequest({ email, password }) {
  const url = `${API_BASE}/auth/login`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email.trim(), password })
  });

  const raw = await res.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.errors?.[0]?.message ||
      `Login failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const token =
    data?.accessToken ||
    data?.access_token ||
    data?.token ||
    data?.data?.accessToken;

  if (!token) {
    throw new Error('API did not return a token. Check Swagger for the correct field name (accessToken/token).');
  }

  const user = data?.user || data?.data?.user || { email };

  saveAuth({
    token,
    user,
    expiresAt: data?.expiresAt,
    expires_in: data?.expires_in
  });

  return { token, user };
}

async function authFetch(input, init = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    logout();
  }
  return res;
}

window.Auth = {
  API_BASE,
  loginRequest,
  authFetch,
  getToken,
  getUser,
  isAuthenticated,
  logout
};
