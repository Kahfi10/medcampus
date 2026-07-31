"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, setUser, clearAuth, AuthUser, apiFetch } from "@/lib/auth";

interface UseAuthOptions {
  requiredRole?: "ADMIN" | "DOKTER" | "PASIEN";
}

export function useAuth(options?: UseAuthOptions) {
  const router = useRouter();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      // Stage 2: /api/auth/me sekarang pakai httpOnly cookie otomatis
      const res = await apiFetch<{ data: AuthUser }>("/api/auth/me");
      const serverUser = res.data;
      setUser(serverUser);       // simpan profile (non-sensitive) di localStorage
      setUserState(serverUser);
      return serverUser;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    async function verify() {
      // Stage 2: cek user di localStorage dulu (cache)
      // Token ada di httpOnly cookie — tidak perlu cek localStorage
      const cached = getUser();

      // Jika tidak ada cache, langsung verify ke server
      // Server akan cek httpOnly cookie otomatis
      try {
        const res = await apiFetch<{ data: AuthUser }>("/api/auth/me");
        const serverUser = res.data;
        setUser(serverUser);
        setUserState(serverUser);

        // Role guard
        if (options?.requiredRole && serverUser.role !== options.requiredRole) {
          const redirectMap: Record<string, string> = {
            ADMIN: "/dashboard/admin",
            DOKTER: "/dashboard/dokter",
            PASIEN: "/dashboard/pasien",
          };
          setLoading(false);
          router.replace(redirectMap[serverUser.role] || "/login");
          return;
        }
      } catch {
        // httpOnly cookie tidak ada atau expired
        // Stage 2: coba refresh via refresh token cookie
        try {
          const refreshRes = await apiFetch<{ data: { accessToken: string } }>(
            "/api/auth/refresh",
            { method: "POST" }
            // Stage 2: refresh token ada di httpOnly cookie, dikirim otomatis
          );

          if (refreshRes.data) {
            // Retry /me setelah refresh berhasil
            const retryRes = await apiFetch<{ data: AuthUser }>("/api/auth/me");
            setUser(retryRes.data);
            setUserState(retryRes.data);
          }
        } catch {
          clearAuth();
          setLoading(false);
          router.replace("/login");
          return;
        }
      }

      setLoading(false);
    }

    verify();
  }, []);

  const logout = async () => {
    try {
      // Stage 2: server akan clear httpOnly cookies + revoke token di DB
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Silently fail
    }
    clearAuth();
    router.replace("/login");
  };

  const logoutAll = async () => {
    try {
      await apiFetch("/api/auth/logout-all", { method: "POST" });
    } catch {
      // Silently fail
    }
    clearAuth();
    router.replace("/login");
  };

  return { user, loading, logout, logoutAll, refreshUser };
}
