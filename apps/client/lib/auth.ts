/**
 * Stage 2: Auth utilities — cookie-based authentication
 * Token sekarang disimpan di httpOnly cookies oleh server.
 * Client hanya menyimpan user profile (non-sensitive) di localStorage.
 */

export interface AuthUser {
  id: string;
  nama: string;
  email: string;
  role: "ADMIN" | "DOKTER" | "PASIEN";
  nim?: string;
  nip?: string;
  telepon?: string;
  golDarah?: string;
  alergi?: string;
}

// Stage 2: TIDAK lagi simpan token di localStorage
// Token ada di httpOnly cookie yang dikelola browser otomatis
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

export function setUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  // Hanya hapus user profile dari localStorage
  // Token (httpOnly cookie) akan di-clear oleh server via Set-Cookie
  localStorage.removeItem("user");
}

export function isAuthenticated(): boolean {
  return !!getUser();
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Stage 2: apiFetch dengan credentials: "include"
 * Browser otomatis kirim httpOnly cookies ke server
 * Tidak perlu lagi tambah Authorization header secara manual
 */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const hasBody = !!options?.body;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // Stage 2: kirim httpOnly cookies otomatis
    headers: {
      // Stage 1: hanya kirim Content-Type kalau ada body
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Terjadi kesalahan." }));
    throw new Error(err.message || "Request gagal.");
  }

  return res.json() as Promise<T>;
}
