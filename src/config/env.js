const isVite = typeof import.meta !== 'undefined' && import.meta.env;

const API_BASE = isVite
  ? (import.meta.env.VITE_API_BASE ?? 'https://v2.api.noroff.dev')
  : (window.__API_BASE__ ?? 'https://v2.api.noroff.dev');

const PREFIX = isVite
  ? (import.meta.env.VITE_STORAGE_PREFIX ?? 'hv')
  : (window.__STORAGE_PREFIX__ ?? 'hv');

const TOKEN_TAIL = isVite ? (import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'auth.token') : (window.__AUTH_TOKEN_KEY__ ?? 'auth.token');
const USER_TAIL  = isVite ? (import.meta.env.VITE_AUTH_USER_KEY  ?? 'auth.user')  : (window.__AUTH_USER_KEY__  ?? 'auth.user');
const EXP_TAIL   = isVite ? (import.meta.env.VITE_AUTH_EXP_KEY   ?? 'auth.expiresAt') : (window.__AUTH_EXP_KEY__   ?? 'auth.expiresAt');

export const ENV = {
  API_BASE,
  TOKEN_KEY: `${PREFIX}.${TOKEN_TAIL}`,
  USER_KEY:  `${PREFIX}.${USER_TAIL}`,
  EXP_KEY:   `${PREFIX}.${EXP_TAIL}`,
};
