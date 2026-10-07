const TOKEN_KEY = "caresync_access_token";
const REFRESH_KEY = "caresync_refresh_token";
const CLINIC_KEY = "caresync_clinic_id";
const ROLE_KEY = "caresync_role";

export type PortalRole = "patient" | "clinician" | "admin" | "staff";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getClinicId(): string | null {
  return localStorage.getItem(CLINIC_KEY);
}

export function getRole(): PortalRole | null {
  const r = localStorage.getItem(ROLE_KEY);
  if (
    r === "patient" ||
    r === "clinician" ||
    r === "admin" ||
    r === "staff"
  ) {
    return r;
  }
  return null;
}

export function setSession(
  accessToken: string,
  clinicId: string,
  role: PortalRole,
  refreshToken?: string
): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(CLINIC_KEY, clinicId);
  localStorage.setItem(ROLE_KEY, role);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(CLINIC_KEY);
  localStorage.removeItem(ROLE_KEY);
}

/** Login/register — never attach a stale bearer token. */
export async function authPublicFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}

let refreshInFlight: Promise<boolean> | null = null;

/** Try to get a new access token using the stored refresh token. */
export async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  const clinicId = getClinicId();
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(clinicId ? { "X-Clinic-Id": clinicId } : {}),
    },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!res.ok) return false;

  const data = (await res.json()) as {
    accessToken?: string;
    user?: { clinicId?: string; role?: string };
  };

  if (!data.accessToken || !data.user?.clinicId || !data.user?.role) {
    return false;
  }

  setSession(
    data.accessToken,
    data.user.clinicId,
    data.user.role as PortalRole,
    refresh
  );
  return true;
}

async function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Validate current access token with the API (used on app load). */
export async function validateSession(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  let res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const refreshed = await refreshOnce();
    if (!refreshed) return false;
    const newToken = getToken();
    if (!newToken) return false;
    res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${newToken}` },
    });
  }

  if (!res.ok) return false;

  const data = (await res.json()) as {
    auth?: { clinicId?: string; role?: string };
  };

  if (data.auth?.clinicId && data.auth?.role) {
    setSession(
      getToken()!,
      data.auth.clinicId,
      data.auth.role as PortalRole,
      getRefreshToken() ?? undefined
    );
    return true;
  }

  return false;
}

/** Authenticated API calls; refreshes once on 401, then clears session if still failing. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  retried = false
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  const clinicId = getClinicId();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (clinicId) headers.set("X-Clinic-Id", clinicId);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });

  if (res.status === 401 && !retried) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return apiFetch(path, init, true);
    }
    clearSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login?reason=session_expired";
    }
  }

  return res;
}
