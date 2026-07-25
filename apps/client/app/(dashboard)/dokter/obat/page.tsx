"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import Modal from "@/components/dashboard/modal";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/auth";

export default function DokterObatPage() {
  const { user, loading } = useAuth({ requiredRole: "DOKTER" });
  const [data, setData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ nama: "", satuan: "", stok: 0 });

  const fetchData = async () => {
    setLoadingData(true);
    try { const res = await apiFetch<any>("/api/obat"); setData(res.data || []); }
    catch { } finally { setLoadingData(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const openEdit = (item: any) => { setEditItem(item); setForm({ nama: item.nama, satuan: item.satuan, stok: item.stok }); setError(""); setModalOpen(true); };
  const openAdd = () => { setEditItem(null); setForm({ nama: "", satuan: "", stok: 0 }); setError(""); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      if (editItem) await apiFetch(`/api/obat/${editItem.id}`, { method: "PUT", body: JSON.stringify(form) });
      else await apiFetch("/api/obat", { method: "POST", body: JSON.stringify(form) });
      setSuccessMsg("Berhasil disimpan!"); setModalOpen(false); fetchData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) { setError(err.message || "Gagal."); }
    finally { setSubmitting(false); }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC]";

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Data Obat" subtitle="Lihat dan kelola stok obat" />
      <div className="flex-1 overflow-y-auto p-8">
        {successMsg && <div className="mb-4 bg-[#EDFAF3] border border-[#30B86A]/20 rounded-xl px-4 py-3 text-[14px] text-[#30B86A] font-medium">{successMsg}</div>}
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5] flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Daftar Obat ({data.length})</h2>
            <Button onClick={openAdd}>+ Tambah Obat</Button>
          </div>
          {loadingData ? <div className="p-10 text-center text-[14px] text-[#6E6E73]">Memuat...</div> : (
            <div className="divide-y divide-[#F5F5F7]">
              {data.map((obat: any) => (
                <div key={obat.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors">
                  <div>
                    <p className="text-[15px] font-medium text-[#1D1D1F]">{obat.nama}</p>
                    <p className="text-[13px] text-[#6E6E73]">Satuan: {obat.satuan}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[15px] font-bold ${obat.stok <= 10 ? "text-[#FF3B30]" : obat.stok <= 30 ? "text-[#FF9F0A]" : "text-[#30B86A]"}`}>{obat.stok}</span>
                    <button onClick={() => openEdit(obat)} className="text-[13px] text-[#0066CC] hover:underline font-medium">Edit</button>
                  </div>
                </div>
              ))}
              {data.length === 0 && <div className="p-10 text-center text-[14px] text-[#6E6E73]">Belum ada data obat.</div>}
            </div>
          )}
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Obat" : "Tambah Obat"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-[#FFF0EF] border border-[#FF3B30]/20 rounded-xl px-4 py-3 text-[14px] text-[#FF3B30]">{error}</div>}
          <div><label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Nama Obat</label><input required className={inputClass} value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} /></div>
          <div><label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Satuan</label><input required className={inputClass} value={form.satuan} onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))} /></div>
          <div><label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Stok</label><input required type="number" min={0} className={inputClass} value={form.stok} onChange={e => setForm(f => ({ ...f, stok: Number(e.target.value) }))} /></div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "..." : "Simpan"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
