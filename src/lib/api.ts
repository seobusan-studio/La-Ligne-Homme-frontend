const SESSION_KEY = 'laligne_session';

export interface LoginSession {
  id: number;
  email: string;
  name: string;
  role: string;
  phone: string;
  address: string;
  accessToken: string;
  expiresAt: number;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function readSession(): LoginSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (typeof value.accessToken !== 'string' || !value.accessToken
      || typeof value.expiresAt !== 'number' || value.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return value;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(value: LoginSession, remember: boolean) {
  clearSession();
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(value));
}

/** Send credentials only to our API. Never retry a payment or mutation automatically. */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const api = new URL(import.meta.env.VITE_API_URL || window.location.origin, window.location.origin);
  const target = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
  const basePath = api.pathname.replace(/\/$/, '');
  const isOurApi = target.origin === api.origin
    && (target.pathname === basePath || target.pathname.startsWith(`${basePath}/`));
  if (!isOurApi) return fetch(input, init);

  const hadSession = !!(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY));
  const session = readSession();
  if (hadSession && !session) throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');

  const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.delete('X-User-Id');
  headers.delete('X-Admin-Id');
  headers.delete('Authorization');
  if (session) headers.set('Authorization', `Bearer ${session.accessToken}`);
  const response = await fetch(input, { ...init, headers, credentials: 'omit' });
  if (response.status === 401 && session && readSession()?.accessToken === session.accessToken) {
    clearSession();
    window.dispatchEvent(new Event('auth-expired'));
  }
  return response;
}
