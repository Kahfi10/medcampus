"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import DataTable from "@/components/dashboard/data-table";
import Modal from "@/components/dashboard/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/auth";

const STATUS_BADGE: Record<string, any> = {
  MENUNGGU: "warning", DIPROSES: "default", SELESAI: "success", DIBATALKAN: "destructive",
};
const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu", DIPROSES: "Diproses", SELESAI: "Selesai", DIBATALKAN: "Dibatalkan",
};

export default function DokterKunjunganPage() {
  const { user, loading } = useAuth({ requiredRole: "DOKTER" });
  const [data, setData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState("MENUNGGU");
  const [updating, setUpdating] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const res = await apiFetch<any>(`/api/kunjungan?status=${filter}&limit=50`);
      setData(res.data || []);
    } catch { } finally { setLoadingData(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user, filter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await apiFetch(`/api/kunjungan/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setSuccessMsg(`Status berhasil diubah ke ${STATUS_LABEL[status]}`);
      fetchData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally { setUpdating(null); }
  };

  const columns = [
    {
      key: "pasien", label: "Pasien",
      render: (r: any) => (
        <div>
          <p className="font-medium text-[#1D1D1F]">{r.pasien?.nama}</p>
          <p className="text-[12px] text-[#6E6E73]">{r.pasien?.nim || r.pasien?.email}</p>
        </div>
      ),
    },
    {
      key: "tanggal", label: "Tanggal",
      render: (r: any) => new Date(r.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    },
    { key: "keluhan", label: "Keluhan", render: (r: any) => <span className="line-clamp-2 text-[13px]">{r.keluhan}</span> },
    {
      key: "status", label: "Status",
      render: (r: any) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
    {
      key: "aksi", label: "Aksi",
      render: (r: any) => (
        <div className="flex gap-2">
          {r.status === "MENUNGGU" && (
            <button
              onClick={() => handleUpdateStatus(r.id, "DIPROSES")}
              disabled={updating === r.id}
              className="text-[13px] font-medium text-white bg-[#0066CC] hover:bg-[#0077ED] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {updating === r.id ? "..." : "Proses"}
            </button>
          )}
          {r.status === "DIPROSES" && (
            <a
              href={`/dashboard/dokter/rekam-medis?kunjunganId=${r.id}&pasien=${encodeURIComponent(r.pasien?.nama || "")}`}
              className="text-[13px] font-medium text-white bg-[#30B86A] hover:bg-[#28A35C] px-3 py-1.5 rounded-lg transition-colors"
            >
              Input Rekam Medis
            </a>
          )}
          {r.status === "SELESAI" && <span className="text-[13px] text-[#6E6E73]">Selesai</span>}
        </div>
      ),
    },
  ];

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Antrian Kunjungan" subtitle="Kelola kunjungan pasien" />
      <div className="flex-1 overflow-y-auto p-8">
        {successMsg && (
          <div className="mb-4 bg-[#EDFAF3] border border-[#30B86A]/20 rounded-xl px-4 py-3 text-[14px] text-[#30B86A] font-medium">{successMsg}</div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {["MENUNGGU", "DIPROSES", "SELESAI"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${filter === s ? "bg-[#0066CC] text-white" : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]"}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5]">
            <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Kunjungan — {STATUS_LABEL[filter]}</h2>
            <p className="text-[13px] text-[#6E6E73]">{data.length} kunjungan ditemukan</p>
          </div>
          <DataTable columns={columns} data={data} loading={loadingData} emptyText={`Tidak ada kunjungan dengan status ${STATUS_LABEL[filter]}.`} />
        </div>
      </div>
    </>
  );
}
