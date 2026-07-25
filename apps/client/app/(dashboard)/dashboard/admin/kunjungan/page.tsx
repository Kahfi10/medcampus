"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import DataTable from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/auth";

const STATUS_BADGE: Record<string, any> = {
  MENUNGGU: "warning", DIPROSES: "default", SELESAI: "success", DIBATALKAN: "destructive",
};
const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu", DIPROSES: "Diproses", SELESAI: "Selesai", DIBATALKAN: "Dibatalkan",
};

export default function AdminKunjunganPage() {
  const { user, loading } = useAuth({ requiredRole: "ADMIN" });
  const toast = useToast();
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const statusParam = statusFilter !== "SEMUA" ? `&status=${statusFilter}` : "";
      const res = await apiFetch<any>(`/api/kunjungan?page=${page}&limit=${LIMIT}${statusParam}`);
      setData(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      toast.error("Gagal memuat data", err.message);
    } finally { setLoadingData(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user, page, statusFilter]);

  useEffect(() => {
    if (!search) { setFiltered(data); return; }
    setFiltered(data.filter(k =>
      k.pasien?.nama?.toLowerCase().includes(search.toLowerCase()) ||
      k.keluhan?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [data, search]);

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
  ];

  const totalPages = Math.ceil(total / LIMIT);
  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Semua Kunjungan" subtitle="Pantau semua kunjungan pasien" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {["SEMUA", "MENUNGGU", "DIPROSES", "SELESAI", "DIBATALKAN"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${statusFilter === s ? "bg-[#0066CC] text-white" : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]"}`}>
              {s === "SEMUA" ? "Semua" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Daftar Kunjungan</h2>
              <p className="text-[13px] text-[#6E6E73]">{total} total kunjungan</p>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pasien atau keluhan..."
              className="h-9 px-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 w-full sm:w-[260px]" />
          </div>
          <DataTable columns={columns} data={filtered} loading={loadingData} emptyText="Tidak ada kunjungan." />

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#F0F0F5] flex items-center justify-between">
              <span className="text-[13px] text-[#6E6E73]">Halaman {page} dari {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl bg-[#F5F5F7] text-[13px] font-medium disabled:opacity-40 hover:bg-[#E8E8ED] transition-colors">Sebelumnya</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl bg-[#F5F5F7] text-[13px] font-medium disabled:opacity-40 hover:bg-[#E8E8ED] transition-colors">Berikutnya</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
