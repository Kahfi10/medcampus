"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { apiFetch, clearAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function PasienProfilPage() {
  const { user, loading } = useAuth({ requiredRole: "PASIEN" });
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nama: "", telepon: "", nim: "", golDarah: "", alergi: "" });
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    if (user) setForm({ nama: user.nama, telepon: user.telepon || "", nim: user.nim || "", golDarah: "", alergi: "" });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      const res = await apiFetch<any>(`/api/users/${user!.id}`, { method: "PUT", body: JSON.stringify(form) });
      localStorage.setItem("user", JSON.stringify({ ...user, ...res.data }));
      setSuccessMsg("Profil berhasil diperbarui!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) { setError(err.message || "Gagal menyimpan."); }
    finally { setSubmitting(false); }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(""); 
    if (pwForm.newPassword !== pwForm.confirm) { setPwError("Konfirmasi password tidak cocok."); return; }
    if (pwForm.newPassword.length < 8) { setPwError("Password minimal 8 karakter."); return; }
    // Note: password change would require a dedicated endpoint
    setPwSuccess("Fitur ganti password akan segera tersedia."); 
    setTimeout(() => setPwSuccess(""), 3000);
  };

  const inputClass = "w-full h-11 px-4 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC]";

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Profil Saya" subtitle="Kelola data dan informasi akun" />
      <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
        {successMsg && <div className="mb-4 bg-[#EDFAF3] border border-[#30B86A]/20 rounded-xl px-4 py-3 text-[14px] text-[#30B86A] font-medium">{successMsg}</div>}

        {/* Avatar */}
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] p-6 mb-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#0066CC] flex items-center justify-center flex-shrink-0">
              <span className="text-[28px] font-bold text-white">{user.nama.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-[18px] font-bold text-[#1D1D1F]">{user.nama}</p>
              <p className="text-[14px] text-[#6E6E73]">{user.email}</p>
              <span className="inline-block mt-1 text-[12px] font-semibold text-[#0066CC] bg-[#EBF4FF] px-2.5 py-0.5 rounded-full">PASIEN</span>
            </div>
          </div>
        </div>

        {/* Edit profil */}
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] p-6 mb-5">
          <h2 className="text-[16px] font-semibold text-[#1D1D1F] mb-5">Informasi Pribadi</h2>
          {error && <div className="mb-4 bg-[#FFF0EF] border border-[#FF3B30]/20 rounded-xl px-4 py-3 text-[14px] text-[#FF3B30]">{error}</div>}
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Nama Lengkap</label><input required className={inputClass} value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} /></div>
            <div><label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">NIM</label><input className={inputClass} value={form.nim} onChange={e => setForm(f => ({ ...f, nim: e.target.value }))} /></div>
            <div><label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">No. Telepon</label><input className={inputClass} type="tel" value={form.telepon} onChange={e => setForm(f => ({ ...f, telepon: e.target.value }))} /></div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Golongan Darah</label>
              <select className={inputClass} value={form.golDarah} onChange={e => setForm(f => ({ ...f, golDarah: e.target.value }))}>
                <option value="">Pilih golongan darah</option>
                {["A", "B", "AB", "O"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Alergi</label><textarea rows={2} className="w-full px-4 py-3 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30" placeholder="Tuliskan alergi jika ada..." value={form.alergi} onChange={e => setForm(f => ({ ...f, alergi: e.target.value }))} /></div>
            <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan Perubahan"}</Button>
          </form>
        </div>

        {/* Keamanan akun */}
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] p-6">
          <h2 className="text-[16px] font-semibold text-[#1D1D1F] mb-5">Keamanan Akun</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-[#F0F0F5]">
              <div><p className="text-[14px] font-medium text-[#1D1D1F]">Email</p><p className="text-[13px] text-[#6E6E73]">{user.email}</p></div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div><p className="text-[14px] font-medium text-[#1D1D1F]">Password</p><p className="text-[13px] text-[#6E6E73]">Terakhir diubah: —</p></div>
              <button className="text-[13px] text-[#0066CC] font-medium hover:text-[#0077ED]">Ganti Password</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
