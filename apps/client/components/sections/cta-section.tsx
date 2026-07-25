"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cta-content",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: ".cta-content", start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding bg-[#F5F5F7]">
      <div className="content-width">
        <div className="cta-content opacity-0 rounded-[28px] bg-[#1D1D1F] px-8 py-16 md:px-16 md:py-20 text-center relative overflow-hidden">
          {/* Background glows */}
          <div className="absolute top-[-40%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#0066CC]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-40%] right-[20%] w-[400px] h-[400px] rounded-full bg-[#30B86A]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p className="text-sm font-semibold text-[#30B86A] tracking-widest uppercase mb-5">
              Mulai Sekarang
            </p>
            <h2 className="text-[clamp(28px,5vw,56px)] font-bold text-white tracking-tight leading-tight mb-5">
              Siap mengamankan
              <br />
              rekam medis klinik kampus?
            </h2>
            <p className="text-[18px] text-white/60 max-w-[460px] mx-auto mb-10 leading-relaxed">
              Masuk ke MedCampus dan kelola data medis dengan standar keamanan
              DevSecOps yang terverifikasi.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="dark" size="xl" asChild>
                <Link href="/login">
                  Masuk Sekarang
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="ml-1"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/register">Buat Akun Pasien</Link>
              </Button>
            </div>

            {/* Trust note */}
            <p className="mt-8 text-[13px] text-white/30">
              Data tidak dipublikasikan ke server produksi publik •{" "}
              <span className="text-white/50">Lingkungan pengujian aman</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
