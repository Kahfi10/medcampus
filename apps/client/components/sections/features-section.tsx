"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M14 3L4 7.5v7c0 5.8 4.3 11.2 10 12.5 5.7-1.3 10-6.7 10-12.5v-7L14 3z"
          stroke="#0066CC"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 14l3 3 5-5"
          stroke="#0066CC"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tag: "RBAC",
    title: "Kontrol Akses Berlapis",
    description:
      "Tiga peran berbeda — Admin, Dokter, dan Pasien — dengan hak akses yang divalidasi ketat di setiap endpoint API menggunakan middleware otorisasi.",
    color: "#0066CC",
    bg: "#EBF4FF",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M8 4h12a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z"
          stroke="#30B86A"
          strokeWidth="1.8"
        />
        <path
          d="M10 10h8M10 14h8M10 18h5"
          stroke="#30B86A"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    tag: "Rekam Medis",
    title: "Pencatatan Medis Terstruktur",
    description:
      "Dokter mencatat diagnosa, tindakan, catatan klinis, dan resep obat secara sistematis. Pasien hanya dapat mengakses rekam medis milik sendiri.",
    color: "#30B86A",
    bg: "#EDFAF3",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="#FF9F0A" strokeWidth="1.8" />
        <path
          d="M14 9v5l3 3"
          stroke="#FF9F0A"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tag: "Audit Trail",
    title: "Log Aktivitas Lengkap",
    description:
      "Setiap login berhasil/gagal, akses rekam medis, perubahan data sensitif, dan percobaan akses yang ditolak dicatat otomatis ke AuditLog.",
    color: "#FF9F0A",
    bg: "#FFF7EB",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M14 4C8.5 4 4 8.5 4 14s4.5 10 10 10 10-4.5 10-10S19.5 4 14 4z"
          stroke="#FF3B30"
          strokeWidth="1.8"
        />
        <path
          d="M14 9v6M14 17.5v.5"
          stroke="#FF3B30"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    tag: "Keamanan Data",
    title: "Password & Session Aman",
    description:
      "Password di-hash dengan bcrypt (salt rounds 12). JWT disimpan di httpOnly cookie. Session expire otomatis. Tidak ada credential hard-coded.",
    color: "#FF3B30",
    bg: "#FFEBEA",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M6 14h16M6 9h16M6 19h10"
          stroke="#6E6E73"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    tag: "Alur Kunjungan",
    title: "Proses Bisnis Tervalidasi",
    description:
      "Alur kunjungan bertahap: MENUNGGU → DIPROSES → SELESAI. Satu pasien hanya boleh memiliki satu kunjungan aktif per hari — dilindungi validasi server.",
    color: "#6E6E73",
    bg: "#F5F5F7",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="4" stroke="#5856D6" strokeWidth="1.8" />
        <path
          d="M9 14l3 3 7-7"
          stroke="#5856D6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tag: "Validasi Input",
    title: "Sanitasi & Parameterized Query",
    description:
      "Semua input divalidasi dengan express-validator. Query database menggunakan Prisma ORM yang mencegah SQL Injection secara default.",
    color: "#5856D6",
    bg: "#EEEEFF",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".features-headline",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".features-headline",
            start: "top 80%",
          },
        }
      );

      gsap.fromTo(
        ".feature-card",
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".features-grid",
            start: "top 80%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="fitur"
      className="section-padding bg-[#F5F5F7]"
    >
      <div className="content-wide">
        {/* Header */}
        <div className="features-headline text-center mb-16 opacity-0">
          <p className="text-sm font-semibold text-[#0066CC] tracking-widest uppercase mb-4">
            Fitur Utama
          </p>
          <h2 className="text-[clamp(32px,5vw,56px)] font-bold text-[#1D1D1F] tracking-tight leading-tight mb-4">
            Dirancang untuk keamanan
            <br />
            <span className="text-gradient-blue">yang serius.</span>
          </h2>
          <p className="text-[18px] text-[#6E6E73] max-w-[560px] mx-auto leading-relaxed">
            Setiap fitur dibangun dengan mempertimbangkan keamanan sebagai
            prioritas utama, bukan tambahan di akhir.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="feature-card opacity-0 group">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300"
                style={{ backgroundColor: f.bg }}
              >
                {f.icon}
              </div>

              {/* Tag */}
              <span
                className="inline-block text-[12px] font-semibold tracking-wide uppercase mb-2 px-2.5 py-0.5 rounded-full"
                style={{ color: f.color, backgroundColor: f.bg }}
              >
                {f.tag}
              </span>

              {/* Title */}
              <h3 className="text-[19px] font-bold text-[#1D1D1F] mb-3 leading-snug">
                {f.title}
              </h3>

              {/* Description */}
              <p className="text-[15px] text-[#6E6E73] leading-relaxed">
                {f.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
