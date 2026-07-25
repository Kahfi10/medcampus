"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, getToken, clearAuth, AuthUser, apiFetch } from "@/lib/auth";

interface UseAuthOptions {
  requiredRole?: "ADMIN" | "DOKTER" | "PASIEN";
  redirectTo?: string;
}

export function useAuth(options?: UseAuthOptions) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      const token = getToken();
      const cached = getUser();

      if (!token || !cached) {
        clearAuth();
        router.replace("/login");
        return;
      }

      try {
        // Verify token is still valid with server
        const res = await apiFetch<{ data: AuthUser }>("/api/auth/me");
        const serverUser = res.data;

        // Update local cache
        localStorage.setItem("user", JSON.stringify(serverUser));
        setUser(serverUser);

        // Role guard
        if (options?.requiredRole && serverUser.role !== options.requiredRole) {
          const redirectMap: Record<string, string> = {
            ADMIN: "/dashboard/admin",
            DOKTER: "/dashboard/dokter",
            PASIEN: "/dashboard/pasien",
          };
          router.replace(redirectMap[serverUser.role] || "/login");
          return;
        }
      } catch {
        clearAuth();
        router.replace("/login");
        return;
      } finally {
        setLoading(false);
      }
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

  return { user, loading, logout };
}
