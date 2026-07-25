// Auth utilities — client side token management

export interface AuthUser {
  id: string;
  nama: string;
  email: string;
  role: "ADMIN" | "DOKTER" | "PASIEN";
  nim?: string;
  nip?: string;
  telepon?: string;
  // MED-01 fix: add missing fields
  golDarah?: string;
  alergi?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser();
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  const hasBody = !!options?.body;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // MED-16 fix: only send Content-Type when request has a body
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Terjadi kesalahan." }));
    throw new Error(err.message || "Request gagal.");
  }

  return res.json() as Promise<T>;
}
