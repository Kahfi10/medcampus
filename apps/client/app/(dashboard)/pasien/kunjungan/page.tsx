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

export default function PasienKunjunganPage() {
  const { user, loading } = useAuth({ requiredRole: "PASIEN" });
  const [data, setData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tanggal: "", keluhan: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const res = await apiFetch<any>("/api/kunjungan/saya");
      setData(res.data || []);
    } catch { } finally { setLoadingData(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      await apiFetch("/api/kunjungan", {
        method: "POST",
        body: JSON.stringify({ tanggal: form.tanggal, keluhan: form.keluhan }),
      });
      setSuccessMsg("Kunjungan berhasil dibuat!");
      setModalOpen(false);
      setForm({ tanggal: "", keluhan: "" });
      fetchData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal membuat kunjungan.");
    } finally { setSubmitting(false); }
  };

  const handleBatalkan = async (id: string) => {
    if (!confirm("Batalkan kunjungan ini?")) return;
    try {
      await apiFetch(`/api/kunjungan/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) { alert(err.message); }
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
      <div className="flex-1 overflow-y-auto p-8">
        {successMsg && (
          <div className="mb-4 bg-[#EDFAF3] border border-[#30B86A]/20 rounded-xl px-4 py-3 text-[14px] text-[#30B86A] font-medium">{successMsg}</div>
        )}
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5] flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Semua Kunjungan</h2>
              <p className="text-[13px] text-[#6E6E73]">{data.length} total kunjungan</p>
            </div>
            <Button onClick={() => setModalOpen(true)}>+ Buat Kunjungan</Button>
          </div>
          <DataTable columns={columns} data={data} loading={loadingData} emptyText="Belum ada kunjungan." />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Buat Kunjungan Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-[#FFF0EF] border border-[#FF3B30]/20 rounded-xl px-4 py-3 text-[14px] text-[#FF3B30]">{error}</div>}
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
