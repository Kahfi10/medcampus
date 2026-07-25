"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const SECURITY_PILLS = [
  "OWASP Top 10",
  "STRIDE Modeling",
  "SAST — Semgrep",
  "SCA — npm audit",
  "Secure Coding",
  "JWT + httpOnly",
  "bcrypt Hashing",
  "Rate Limiting",
  "Helmet.js",
  "Prisma ORM",
  "CORS Whitelist",
  "Audit Trail",
];

const THREATS = [
  { id: "A01", label: "Broken Access Control", severity: "critical" },
  { id: "A02", label: "Cryptographic Failures", severity: "high" },
  { id: "A03", label: "Injection (SQLi, XSS)", severity: "critical" },
  { id: "A07", label: "Auth Failures", severity: "high" },
  { id: "A05", label: "Security Misconfig", severity: "medium" },
  { id: "A09", label: "Logging Failures", severity: "medium" },
];

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#FF3B30",
  high: "#FF9F0A",
  medium: "#30B86A",
};

export default function SecuritySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".security-headline",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: ".security-headline", start: "top 80%" },
        }
      );

      gsap.fromTo(
        ".security-pill",
        { opacity: 0, scale: 0.85 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.2)",
          stagger: 0.05,
          scrollTrigger: { trigger: ".pills-row", start: "top 80%" },
        }
      );

      gsap.fromTo(
        ".owasp-row",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".owasp-list", start: "top 80%" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="keamanan"
      className="section-padding bg-[#1D1D1F] overflow-hidden relative"
    >
      {/* Subtle grid bg */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="content-wide relative z-10">
        {/* Headline */}
        <div className="security-headline opacity-0 text-center mb-16">
          <p className="text-[15px] font-semibold text-[#30B86A] tracking-widest uppercase mb-4">
            DevSecOps
          </p>
          <h2 className="text-[clamp(32px,5vw,64px)] font-bold text-white tracking-tight leading-tight mb-5">
            Keamanan bukan fitur.
            <br />
            <span className="text-[#6E6E73]">Ini adalah fondasi.</span>
          </h2>
          <p className="text-[18px] text-[#6E6E73] max-w-[520px] mx-auto leading-relaxed">
            MedCampus menerapkan seluruh siklus Secure Software Development
            Lifecycle — dari analisis ancaman hingga pemindaian kode otomatis.
          </p>
        </div>

        {/* Security pills */}
        <div className="pills-row flex flex-wrap justify-center gap-3 mb-16">
          {SECURITY_PILLS.map((pill) => (
            <span
              key={pill}
              className="security-pill opacity-0 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/80 font-medium backdrop-blur-sm hover:border-white/20 hover:bg-white/10 transition-colors cursor-default"
            >
              {pill}
            </span>
          ))}
        </div>

        {/* OWASP Top 10 analysis table */}
        <div className="max-w-[700px] mx-auto">
          <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-4 text-center">
            Analisis OWASP Top 10
          </p>
          <div className="owasp-list rounded-[18px] border border-white/10 bg-white/[0.04] overflow-hidden divide-y divide-white/[0.06]">
            {THREATS.map((t) => (
              <div
                key={t.id}
                className="owasp-row opacity-0 flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[14px] font-mono text-[#6E6E73] w-10 flex-shrink-0">
                    {t.id}
                  </span>
                  <span className="text-[15px] text-white/90 font-medium">
                    {t.label}
                  </span>
                </div>
                <span
                  className="text-[14px] font-semibold capitalize whitespace-nowrap flex-shrink-0"
                  style={{ color: SEVERITY_COLOR[t.severity] }}
                >
                  {t.severity}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-[14px] text-[#6E6E73] mt-4">
            +4 kategori OWASP lainnya dianalisis dalam laporan lengkap
          </p>
        </div>
      </div>
    </section>
  );
}
