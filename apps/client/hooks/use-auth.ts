"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, getToken, clearAuth, AuthUser, apiFetch } from "@/lib/auth";

interface UseAuthOptions {
  requiredRole?: "ADMIN" | "DOKTER" | "PASIEN";
}

export function useAuth(options?: UseAuthOptions) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: AuthUser }>("/api/auth/me");
      const serverUser = res.data;
      localStorage.setItem("user", JSON.stringify(serverUser));
      setUser(serverUser);
      return serverUser;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    async function verify() {
      const token = getToken();
      const cached = getUser();

      // CRIT-04 fix: always call setLoading(false) regardless of path
      if (!token || !cached) {
        clearAuth();
        setLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const res = await apiFetch<{ data: AuthUser }>("/api/auth/me");
        const serverUser = res.data;

        localStorage.setItem("user", JSON.stringify(serverUser));
        setUser(serverUser);

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
        // CRIT-05 partial fix: attempt token refresh before clearing
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          try {
            const refreshRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/refresh`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
              }
            );
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              localStorage.setItem("accessToken", data.data.accessToken);
              localStorage.setItem("refreshToken", data.data.refreshToken);
              // Retry verify
              await verify();
              return;
            }
          } catch {
            // Refresh also failed
          }
        }
        clearAuth();
        setLoading(false);
        router.replace("/login");
        return;
      }

      setLoading(false);
    }

    verify();
  }, []);

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Silently fail — clear locally regardless
    }
    clearAuth();
    router.replace("/login");
  };

  return { user, loading, logout, refreshUser };
}
