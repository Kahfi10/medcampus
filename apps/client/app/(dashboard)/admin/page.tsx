"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import StatCard from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/auth";

interface Stats {
  totalUsers: number;
  totalDokter: number;
  totalPasien: number;
  totalKunjungan: number;
  kunjunganMenunggu: number;
  totalObat: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth({ requiredRole: "ADMIN" });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchStats() {
      try {
        const [usersRes, kunjunganRes, obatRes] = await Promise.all([
          apiFetch<{ data: { role: string }[] }>("/api/users?limit=1000"),
          apiFetch<{ data: { status: string }[] }>("/api/kunjungan?limit=1000"),
          apiFetch<{ data: unknown[] }>("/api/obat"),
        ]);

        const users = (usersRes as any).data || [];
        const kunjungan = (kunjunganRes as any).data || [];
        const obat = (obatRes as any).data || [];

        setStats({
          totalUsers: users.length,
          totalDokter: users.filter((u: any) => u.role === "DOKTER").length,
          totalPasien: users.filter((u: any) => u.role === "PASIEN").length,
          totalKunjungan: kunjungan.length,
          kunjunganMenunggu: kunjungan.filter((k: any) => k.status === "MENUNGGU").length,
          totalObat: obat.length,
        });
      } catch {
        // Stats optional — fail silently
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, [user]);

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader
        user={user}
        title="Dashboard Admin"
        subtitle={`Selamat datang, ${user.nama}`}
      />
      <div className="flex-1 overflow-y-auto p-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Pengguna"
            value={loadingStats ? "—" : stats?.totalUsers ?? 0}
            sub={`${stats?.totalDokter ?? 0} dokter · ${stats?.totalPasien ?? 0} pasien`}
            color="#5856D6"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="Total Kunjungan"
            value={loadingStats ? "—" : stats?.totalKunjungan ?? 0}
            sub={`${stats?.kunjunganMenunggu ?? 0} menunggu`}
            color="#0066CC"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 2v4M13 2v4M2 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="Data Obat"
            value={loadingStats ? "—" : stats?.totalObat ?? 0}
            sub="Terdaftar di sistem"
            color="#30B86A"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 6V4.5A1.5 1.5 0 018.5 3h3A1.5 1.5 0 0113 4.5V6" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10v4M8 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          />
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] p-6">
          <h2 className="text-[16px] font-semibold text-[#1D1D1F] mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Tambah Dokter", href: "/dashboard/admin/users", color: "#5856D6" },
              { label: "Kelola Obat", href: "/dashboard/admin/obat", color: "#30B86A" },
              { label: "Lihat Kunjungan", href: "/dashboard/admin/users", color: "#0066CC" },
              { label: "Audit Log", href: "/dashboard/admin/audit", color: "#FF9F0A" },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="flex items-center justify-center px-4 py-3 rounded-xl border border-[#F0F0F5] text-[14px] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors text-center"
              >
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
