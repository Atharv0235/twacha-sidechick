import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'twacha.token';

function safeGet(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}
function safeRemove(key) {
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}

// ── Login token (kept on this phone; sent as "Authorization: Bearer ...") ─────
export const getToken = () => safeGet(TOKEN_KEY);
export const setToken = (t) => safeSet(TOKEN_KEY, t);
export const clearToken = () => safeRemove(TOKEN_KEY);

let onUnauthorized = null;
/** The app registers a function here that logs the user out when the server says the session is no longer valid. */
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/** The user's own calendar date (YYYY-MM-DD). The server may be in another time zone. */
export function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'unknown' } = {}) {
    super(message);
    this.status = status;
    this.kind = kind; // 'network' | 'timeout' | 'validation' | 'too_large' | 'auth' | 'conflict' | 'rate_limit' | 'server' | 'unknown'
  }
}

/** FastAPI sends detail as a string, or as a list of {msg} objects for field errors. */
function detailText(detail, fallback) {
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    const msgs = detail.map((d) => String(d?.msg || '').replace(/^Value error,\s*/i, '')).filter(Boolean);
    if (msgs.length) return msgs.join(' ');
  }
  return fallback;
}

// showAuthError: a 401 here means "wrong password" for this action, not "your session ended" (so do not log out).
async function request(path, { method = 'GET', body, json, timeoutMs = 20000, auth = true, showAuthError = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { 'ngrok-skip-browser-warning': 'true' };
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload = body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(json);
  }
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError('The server took too long to answer. It may be waking up; please try again in a moment.', { kind: 'timeout' });
    }
    throw new ApiError('Could not reach the server. Check your internet connection and try again.', { kind: 'network' });
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty or non-JSON body */ }

  if (!res.ok) {
    if (res.status === 413) throw new ApiError('That photo is too large. Please use a smaller one.', { status: 413, kind: 'too_large' });
    if (res.status === 401) {
      if (!auth || showAuthError) {
        throw new ApiError(detailText(data?.detail, 'Wrong email or password.'), { status: 401, kind: 'auth' });
      }
      if (onUnauthorized) onUnauthorized();
      throw new ApiError('Your session has ended. Please log in again.', { status: 401, kind: 'auth' });
    }
    if (res.status === 409) throw new ApiError(detailText(data?.detail, 'That is already in use.'), { status: 409, kind: 'conflict' });
    if (res.status === 429) throw new ApiError(detailText(data?.detail, 'Too many attempts. Please wait and try again.'), { status: 429, kind: 'rate_limit' });
    if (res.status === 404) throw new ApiError(detailText(data?.detail, 'Not found.'), { status: 404, kind: 'validation' });
    if (res.status === 422) {
      throw new ApiError(detailText(data?.detail, 'The server could not use that input.'), { status: 422, kind: 'validation' });
    }
    throw new ApiError('Something went wrong on the server. Please try again.', { status: res.status, kind: 'server' });
  }
  return data;
}

/** Wakes the server (free hosting sleeps). Resolves true when healthy. */
export async function wake(timeoutMs = 60000) {
  try {
    const h = await request('/health', { timeoutMs, auth: false });
    return h?.status === 'ok';
  } catch {
    return false;
  }
}

// ── Account ───────────────────────────────────────────────────────────────────
export const register = (body) => request('/api/auth/register', { method: 'POST', json: body, auth: false, timeoutMs: 30000 });
export const login = (email, password) => request('/api/auth/login', { method: 'POST', json: { email, password }, auth: false, timeoutMs: 30000 });
export const getMe = () => request('/api/me');
export const updateMe = (name, city) => request('/api/me', { method: 'PUT', json: { name, city: city || null } });
export const changePassword = (current_password, new_password) =>
  request('/api/auth/change-password', { method: 'POST', json: { current_password, new_password }, showAuthError: true, timeoutMs: 30000 });
export const deleteAccount = (password) => request('/api/me/delete', { method: 'POST', json: { password }, showAuthError: true, timeoutMs: 30000 });

// ── Scan, history, food log ───────────────────────────────────────────────────
export function scan(imageBlob, city) {
  const form = new FormData();
  form.append('image', imageBlob, 'photo.jpg');
  if (city) form.append('city', city);
  return request('/api/scan/', { method: 'POST', body: form, timeoutMs: 90000 });
}

export const getHistory = (limit = 60) => request(`/api/history/?limit=${limit}`);
export const getFoods = () => request('/api/foods/', { auth: false });
export const getLog = (limit = 7) => request(`/api/log/?limit=${limit}`);
export const saveLog = (foods_eaten, log_date = localDate()) =>
  request('/api/log/', { method: 'POST', json: { foods_eaten, log_date } });
export const deleteMyData = () => request('/api/data/', { method: 'DELETE' });

// ── Plan ──────────────────────────────────────────────────────────────────────
export const getPlan = () => request(`/api/plan/summary?today=${localDate()}`);
export const addPlanItem = (food, kind, target_days) =>
  request('/api/plan/', { method: 'POST', json: target_days == null ? { food, kind } : { food, kind, target_days } });
export const setPlanTarget = (id, target_days) => request(`/api/plan/${id}`, { method: 'PUT', json: { target_days } });
export const removePlanItem = (id) => request(`/api/plan/${id}`, { method: 'DELETE' });
export const checkPlanFood = (food, done, log_date = localDate()) =>
  request('/api/plan/check', { method: 'POST', json: { food, done, log_date } });

// ── Weekly summary ────────────────────────────────────────────────────────────
// tz_offset is minutes east of UTC (India = 330), so the server groups scans by the user's own calendar day.
export const getWeek = () => request(`/api/summary/week?today=${localDate()}&tz_offset=${-new Date().getTimezoneOffset()}`);
