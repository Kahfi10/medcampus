"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import DataTable from "@/components/dashboard/data-table";
import Modal from "@/components/dashboard/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function DokterRekamMedisInner() {
  const { user, loading } = useAuth({ requiredRole: "DOKTER" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const kunjunganId = searchParams.get("kunjunganId");
  const pasienName = searchParams.get("pasien");

  const [data, setData] = useState<any[]>([]);
  const [obatList, setObatList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(!!kunjunganId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const [form, setForm] = useState({
    kunjunganId: kunjunganId || "",
    diagnosa: "",
    tindakan: "",
    catatan: "",
    resepObat: [] as { obatId: string; jumlah: number; aturanPakai: string }[],
  });

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [rekamRes, obatRes] = await Promise.all([
        apiFetch<any>("/api/rekam-medis?limit=50"),
        apiFetch<any>("/api/obat"),
      ]);
      setData(rekamRes.data || []);
      setObatList(obatRes.data || []);
    } catch { } finally { setLoadingData(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const addResep = () => setForm(f => ({ ...f, resepObat: [...f.resepObat, { obatId: "", jumlah: 1, aturanPakai: "" }] }));
  const removeResep = (i: number) => setForm(f => ({ ...f, resepObat: f.resepObat.filter((_, idx) => idx !== i) }));
  const updateResep = (i: number, field: string, value: any) =>
    setForm(f => ({ ...f, resepObat: f.resepObat.map((r, idx) => idx === i ? { ...r, [field]: value } : r) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      await apiFetch("/api/rekam-medis", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          resepObat: form.resepObat.filter(r => r.obatId),
        }),
      });
      setSuccessMsg("Rekam medis berhasil disimpan!");
      setModalOpen(false);
      setForm({ kunjunganId: "", diagnosa: "", tindakan: "", catatan: "", resepObat: [] });
      fetchData();
      if (kunjunganId) router.push("/dashboard/dokter/kunjungan");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan rekam medis.");
    } finally { setSubmitting(false); }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC]";
  const textareaClass = "w-full px-4 py-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC]";

  const columns = [
    {
      key: "pasien", label: "Pasien",
      render: (r: any) => r.kunjungan?.pasien?.nama || "—",
    },
    {
      key: "tanggal", label: "Tanggal",
      render: (r: any) => new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    },
    { key: "diagnosa", label: "Diagnosa", render: (r: any) => <span className="line-clamp-1">{r.diagnosa}</span> },
    {
      key: "aksi", label: "Detail",
      render: (r: any) => <button onClick={() => setSelected(r)} className="text-[13px] text-[#0066CC] hover:underline font-medium">Lihat</button>,
    },
  ];

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Rekam Medis" subtitle="Input dan riwayat rekam medis" />
      <div className="flex-1 overflow-y-auto p-8">
        {successMsg && <div className="mb-4 bg-[#EDFAF3] border border-[#30B86A]/20 rounded-xl px-4 py-3 text-[14px] text-[#30B86A] font-medium">{successMsg}</div>}

        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5] flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Riwayat Rekam Medis</h2>
              <p className="text-[13px] text-[#6E6E73]">{data.length} rekam medis</p>
            </div>
            <Button onClick={() => { setForm(f => ({ ...f, kunjunganId: "" })); setModalOpen(true); }}>+ Input Rekam Medis</Button>
          </div>
          <DataTable columns={columns} data={data} loading={loadingData} emptyText="Belum ada rekam medis." />
        </div>
      </div>

      {/* Input Form Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(""); }} title={kunjunganId ? `Input Rekam Medis — ${pasienName || "Pasien"}` : "Input Rekam Medis"} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-[#FFF0EF] border border-[#FF3B30]/20 rounded-xl px-4 py-3 text-[14px] text-[#FF3B30]">{error}</div>}

          {!kunjunganId && (
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">ID Kunjungan</label>
              <input required className={inputClass} placeholder="Masukkan ID kunjungan" value={form.kunjunganId}
                onChange={e => setForm(f => ({ ...f, kunjunganId: e.target.value }))} />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Diagnosa <span className="text-[#FF3B30]">*</span></label>
            <textarea required rows={2} className={textareaClass} placeholder="Diagnosa penyakit..." value={form.diagnosa}
              onChange={e => setForm(f => ({ ...f, diagnosa: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Tindakan <span className="text-[#FF3B30]">*</span></label>
            <textarea required rows={2} className={textareaClass} placeholder="Tindakan medis yang diberikan..." value={form.tindakan}
              onChange={e => setForm(f => ({ ...f, tindakan: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Catatan <span className="text-[#6E6E73] font-normal">(opsional)</span></label>
            <textarea rows={2} className={textareaClass} placeholder="Catatan tambahan..." value={form.catatan}
              onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
          </div>

          {/* Resep Obat */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-[#1D1D1F]">Resep Obat <span className="text-[#6E6E73] font-normal">(opsional)</span></label>
              <button type="button" onClick={addResep} className="text-[13px] text-[#0066CC] font-medium hover:text-[#0077ED]">+ Tambah Obat</button>
            </div>
            {form.resepObat.map((r, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select value={r.obatId} onChange={e => updateResep(i, "obatId", e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30">
                  <option value="">Pilih obat</option>
                  {obatList.map((o: any) => <option key={o.id} value={o.id}>{o.nama} ({o.satuan})</option>)}
                </select>
                <input type="number" min={1} value={r.jumlah} onChange={e => updateResep(i, "jumlah", Number(e.target.value))}
                  className="w-20 h-10 px-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30" placeholder="Jml" />
                <input value={r.aturanPakai} onChange={e => updateResep(i, "aturanPakai", e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30" placeholder="Aturan pakai" />
                <button type="button" onClick={() => removeResep(i)} className="w-10 h-10 rounded-xl bg-[#FFF0EF] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan Rekam Medis"}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Rekam Medis" maxWidth="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Pasien</p><p className="text-[15px] text-[#1D1D1F]">{selected.kunjungan?.pasien?.nama || "—"}</p></div>
              <div><p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Tanggal</p><p className="text-[15px] text-[#1D1D1F]">{new Date(selected.createdAt).toLocaleDateString("id-ID")}</p></div>
            </div>
            <div><p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Diagnosa</p><p className="text-[15px] text-[#1D1D1F]">{selected.diagnosa}</p></div>
            <div><p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Tindakan</p><p className="text-[15px] text-[#1D1D1F]">{selected.tindakan}</p></div>
            {selected.catatan && <div><p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Catatan</p><p className="text-[15px] text-[#1D1D1F]">{selected.catatan}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
}

// Exported page wraps inner component in Suspense (required for useSearchParams in Next.js 14)
export default function DokterRekamMedisPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full rounded-[16px]" />
      </div>
    }>
      <DokterRekamMedisInner />
    </Suspense>
  );
}
