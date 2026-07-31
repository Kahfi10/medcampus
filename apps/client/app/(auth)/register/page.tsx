"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/auth";

export default function RegisterPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    konfirmasi: "",
    nim: "",
    telepon: "",
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".register-card",
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power2.out", delay: 0.1 }
      );
      gsap.fromTo(
        ".register-field",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08, delay: 0.3 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.konfirmasi) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    // MED-06: match server-side complexity rule
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError("Password harus mengandung huruf besar, huruf kecil, dan angka.");
      return;
    }

    setIsLoading(true);
    try {
      // Stage 2: apiFetch dengan credentials: "include" — server set httpOnly cookie
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nama: form.nama,
          email: form.email,
          password: form.password,
          nim: form.nim || undefined,
          telepon: form.telepon || undefined,
        }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-4 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[15px] text-[#1D1D1F] placeholder:text-[#6E6E73] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] transition-all";

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-4">
        <div className="w-full max-w-[400px] bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#EDFAF3] flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 16l5 5 11-11" stroke="#30B86A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-[#1D1D1F] mb-2">Akun Berhasil Dibuat!</h2>
          <p className="text-[15px] text-[#6E6E73] mb-6">
            Akun pasien kamu sudah siap. Silakan masuk untuk mulai menggunakan MedCampus.
          </p>
          <Button size="lg" className="w-full" asChild>
            <Link href="/login">Masuk Sekarang</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-4 py-12"
    >
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#30B86A]/8 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0066CC]/6 blur-3xl" />
      </div>

      <div className="register-card opacity-0 w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-[#0066CC] flex items-center justify-center shadow-md group-hover:bg-[#0077ED] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v14M3 10h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-bold text-[20px] text-[#1D1D1F] tracking-tight">MedCampus</span>
          </Link>
          <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight mb-1">Daftar Akun</h1>
          <p className="text-[15px] text-[#6E6E73]">Buat akun pasien MedCampus</p>
        </div>

        <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-[#FFF0EF] border border-[#FF3B30]/20 rounded-xl px-4 py-3 text-[14px] text-[#FF3B30] flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#FF3B30" strokeWidth="1.5" />
                  <path d="M8 5v3M8 10.5v.5" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {/* Nama */}
            <div className="register-field opacity-0">
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Nama Lengkap <span className="text-[#FF3B30]">*</span></label>
              <input type="text" required placeholder="Nama lengkap kamu" value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })} className={inputClass} />
            </div>

            {/* Email */}
            <div className="register-field opacity-0">
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Email <span className="text-[#FF3B30]">*</span></label>
              <input type="email" required placeholder="nama@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>

            {/* NIM */}
            <div className="register-field opacity-0">
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                NIM <span className="text-[#6E6E73] font-normal">(opsional)</span>
              </label>
              <input type="text" placeholder="Nomor Induk Mahasiswa" value={form.nim}
                onChange={(e) => setForm({ ...form, nim: e.target.value })} className={inputClass} />
            </div>

            {/* Telepon */}
            <div className="register-field opacity-0">
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                No. Telepon <span className="text-[#6E6E73] font-normal">(opsional)</span>
              </label>
              <input type="tel" placeholder="08xxxxxxxxxx" value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })} className={inputClass} />
            </div>

            {/* Password */}
            <div className="register-field opacity-0">
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Password <span className="text-[#FF3B30]">*</span></label>
              <input type="password" required placeholder="Min. 8 karakter" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
              <p className="text-[12px] text-[#6E6E73] mt-1">Harus mengandung huruf besar, huruf kecil, dan angka</p>
            </div>

            {/* Konfirmasi Password */}
            <div className="register-field opacity-0">
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">Konfirmasi Password <span className="text-[#FF3B30]">*</span></label>
              <input type="password" required placeholder="Ulangi password" value={form.konfirmasi}
                onChange={(e) => setForm({ ...form, konfirmasi: e.target.value })} className={inputClass} />
            </div>

            {/* Submit */}
            <div className="register-field opacity-0 pt-2">
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Mendaftarkan...
                  </span>
                ) : "Buat Akun"}
              </Button>
            </div>
          </form>

          <p className="text-center text-[14px] text-[#6E6E73] mt-5">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#0066CC] font-semibold hover:text-[#0077ED] transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>

        <p className="text-center mt-5">
          <Link href="/" className="text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors flex items-center justify-center gap-1">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  );
}
