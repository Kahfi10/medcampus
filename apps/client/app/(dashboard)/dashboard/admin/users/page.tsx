"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import DataTable from "@/components/dashboard/data-table";
import Modal from "@/components/dashboard/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/auth";

const ROLE_BADGE: Record<string, any> = { ADMIN: "secondary", DOKTER: "success", PASIEN: "default" };

export default function AdminUsersPage() {
  const { user, loading } = useAuth({ requiredRole: "ADMIN" });
  const [data, setData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ nama: "", email: "", password: "", role: "DOKTER", nip: "", telepon: "" });

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const res = await apiFetch<any>(`/api/users?limit=100${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      setData(res.data || []);
    } catch { } finally { setLoadingData(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      await apiFetch("/api/users", { method: "POST", body: JSON.stringify(form) });
      setSuccessMsg("Akun berhasil dibuat!");
      setModalOpen(false);
      setForm({ nama: "", email: "", password: "", role: "DOKTER", nip: "", telepon: "" });
      fetchData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) { setError(err.message || "Gagal membuat akun."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus akun ${nama}?`)) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC]";

  const columns = [
    {
      key: "nama", label: "Nama",
      render: (r: any) => (
        <div>
          <p className="font-medium text-[#1D1D1F]">{r.nama}</p>
          <p className="text-[12px] text-[#6E6E73]">{r.email}</p>
        </div>
      ),
    },
    { key: "nim", label: "NIM / NIP", render: (r: any) => r.nim || r.nip || "—" },
    { key: "role", label: "Role", render: (r: any) => <Badge variant={ROLE_BADGE[r.role]}>{r.role}</Badge> },
    {
      key: "createdAt", label: "Bergabung",
      render: (r: any) => new Date(r.createdAt).toLocaleDateString("id-ID"),
    },
    {
      key: "aksi", label: "Aksi",
      render: (r: any) => r.id !== user?.id ? (
        <button onClick={() => handleDelete(r.id, r.nama)} className="text-[13px] text-[#FF3B30] hover:underline font-medium">Hapus</button>
      ) : <span className="text-[13px] text-[#6E6E73]">Akun kamu</span>,
    },
  ];

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Kelola Pengguna" subtitle="Manajemen akun admin, dokter, dan pasien" />
      <div className="flex-1 overflow-y-auto p-8">
        {successMsg && <div className="mb-4 bg-[#EDFAF3] border border-[#30B86A]/20 rounded-xl px-4 py-3 text-[14px] text-[#30B86A] font-medium">{successMsg}</div>}

        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Semua Pengguna</h2>
              <p className="text-[13px] text-[#6E6E73]">{data.length} akun terdaftar</p>
            </div>
            <div className="flex gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, email, NIM..."
                className="h-10 px-4 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 w-[220px]" />
              <Button onClick={() => setModalOpen(true)}>+ Tambah Akun</Button>
            </div>
          </div>
          <DataTable columns={columns} data={data} loading={loadingData} emptyText="Tidak ada pengguna ditemukan." />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(""); }} title="Tambah Akun Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-[#FFF0EF] border border-[#FF3B30]/20 rounded-xl px-4 py-3 text-[14px] text-[#FF3B30]">{error}</div>}
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Nama Lengkap <span className="text-[#FF3B30]">*</span></label>
            <input required className={inputClass} placeholder="Nama lengkap" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Email <span className="text-[#FF3B30]">*</span></label>
            <input required type="email" className={inputClass} placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Password <span className="text-[#FF3B30]">*</span></label>
            <input required type="password" className={inputClass} placeholder="Min. 8 karakter" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Role <span className="text-[#FF3B30]">*</span></label>
            <select className={inputClass} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="DOKTER">Dokter</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">NIP <span className="text-[#6E6E73] font-normal">(opsional)</span></label>
            <input className={inputClass} placeholder="Nomor Induk Pegawai" value={form.nip} onChange={e => setForm(f => ({ ...f, nip: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Menyimpan..." : "Buat Akun"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
