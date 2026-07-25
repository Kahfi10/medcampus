"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import DataTable from "@/components/dashboard/data-table";
import Modal from "@/components/dashboard/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/auth";

const STATUS_BADGE: Record<string, any> = {
  MENUNGGU: "warning", DIPROSES: "default", SELESAI: "success", DIBATALKAN: "destructive",
};
const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu", DIPROSES: "Diproses", SELESAI: "Selesai", DIBATALKAN: "Dibatalkan",
};

export default function PasienKunjunganPage() {
  const { user, loading } = useAuth({ requiredRole: "PASIEN" });
  const toast = useToast();
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tanggal: "", keluhan: "" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const res = await apiFetch<any>("/api/kunjungan/saya");
      setData(res.data || []);
    } catch (err: any) {
      toast.error("Gagal memuat data", err.message);
    } finally { setLoadingData(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  useEffect(() => {
    let result = data;
    if (statusFilter !== "SEMUA") result = result.filter(k => k.status === statusFilter);
    if (search) result = result.filter(k => k.keluhan.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [data, statusFilter, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/kunjungan", {
        method: "POST",
        body: JSON.stringify({ tanggal: form.tanggal, keluhan: form.keluhan }),
      });
      toast.success("Kunjungan berhasil dibuat!", "Kunjungan kamu sedang menunggu konfirmasi dokter.");
      setModalOpen(false);
      setForm({ tanggal: "", keluhan: "" });
      fetchData();
    } catch (err: any) {
      toast.error("Gagal membuat kunjungan", err.message);
    } finally { setSubmitting(false); }
  };

  const handleBatalkan = async (id: string) => {
    try {
      await apiFetch(`/api/kunjungan/${id}`, { method: "DELETE" });
      toast.success("Kunjungan dibatalkan");
      fetchData();
    } catch (err: any) {
      toast.error("Gagal membatalkan", err.message);
    }
  };

  const columns = [
    {
      key: "tanggal", label: "Tanggal",
      render: (r: any) => new Date(r.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    },
    { key: "keluhan", label: "Keluhan", render: (r: any) => <span className="line-clamp-2">{r.keluhan}</span> },
    {
      key: "status", label: "Status",
      render: (r: any) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
    {
      key: "aksi", label: "Aksi",
      render: (r: any) => r.status === "MENUNGGU" ? (
        <button onClick={() => handleBatalkan(r.id)} className="text-[13px] text-[#FF3B30] hover:underline font-medium">Batalkan</button>
      ) : <span className="text-[13px] text-[#6E6E73]">—</span>,
    },
  ];

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Kunjungan Saya" subtitle="Riwayat dan daftar kunjungan ke klinik" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-[#F0F0F5] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Semua Kunjungan</h2>
              <p className="text-[13px] text-[#6E6E73]">{filtered.length} dari {data.length} kunjungan</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari keluhan..."
                className="h-9 px-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 w-[180px]"
              />
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30"
              >
                <option value="SEMUA">Semua Status</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <Button size="sm" onClick={() => setModalOpen(true)}>+ Buat Kunjungan</Button>
            </div>
          </div>
          <DataTable columns={columns} data={filtered} loading={loadingData} emptyText="Belum ada kunjungan." />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Buat Kunjungan Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Tanggal Kunjungan</label>
            <input type="date" required min={new Date().toISOString().split("T")[0]} value={form.tanggal}
              onChange={e => setForm({ ...form, tanggal: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC]" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Keluhan</label>
            <textarea required rows={4} placeholder="Deskripsikan keluhan kamu..." value={form.keluhan}
              onChange={e => setForm({ ...form, keluhan: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC]" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Menyimpan..." : "Buat Kunjungan"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
