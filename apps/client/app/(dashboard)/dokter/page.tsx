"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import StatCard from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

const STATUS_BADGE: Record<string, "default" | "warning" | "success" | "destructive" | "secondary"> = {
  MENUNGGU: "warning",
  DIPROSES: "default",
  SELESAI: "success",
  DIBATALKAN: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export default function DokterDashboard() {
  const { user, loading } = useAuth({ requiredRole: "DOKTER" });
  const [kunjungan, setKunjungan] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<any>("/api/kunjungan?limit=10&status=MENUNGGU")
      .then((res) => setKunjungan(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [user]);

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader
        user={user}
        title="Dashboard Dokter"
        subtitle={`Selamat datang, dr. ${user.nama}`}
      />
      <div className="flex-1 overflow-y-auto p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard
            label="Antrian Menunggu"
            value={kunjungan.length}
            sub="Kunjungan hari ini"
            color="#FF9F0A"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 2v4M13 2v4M2 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="Akses Cepat"
            value="Rekam Medis"
            sub="Input diagnosa & resep"
            color="#30B86A"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 2h12a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 8h6M7 11h6M7 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          />
        </div>

        {/* Antrian kunjungan */}
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5] flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Antrian Kunjungan</h2>
            <a href="/dashboard/dokter/kunjungan" className="text-[14px] text-[#0066CC] hover:text-[#0077ED] font-medium">
              Lihat semua
            </a>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-[14px] text-[#6E6E73]">Memuat data...</div>
          ) : kunjungan.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[15px] text-[#6E6E73]">Tidak ada antrian saat ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F5]">
              {kunjungan.map((k: any) => (
                <div key={k.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors">
                  <div>
                    <p className="text-[15px] font-medium text-[#1D1D1F]">{k.pasien?.nama}</p>
                    <p className="text-[13px] text-[#6E6E73] mt-0.5 line-clamp-1">{k.keluhan}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#6E6E73]">
                      {new Date(k.tanggal).toLocaleDateString("id-ID")}
                    </span>
                    <Badge variant={STATUS_BADGE[k.status] || "secondary"}>
                      {STATUS_LABEL[k.status] || k.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
