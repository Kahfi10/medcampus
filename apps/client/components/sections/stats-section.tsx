"use client";

import { useEffect, useRef } from "react";
import { gsap, countUp } from "@/lib/gsap";

const STATS = [
  {
    value: 3,
    suffix: "",
    label: "Peran Sistem",
    sub: "Admin, Dokter, Pasien",
    color: "#0066CC",
  },
  {
    value: 25,
    suffix: "+",
    label: "API Endpoint",
    sub: "Terdokumentasi di Swagger",
    color: "#30B86A",
  },
  {
    value: 10,
    suffix: "+",
    label: "Ancaman STRIDE",
    sub: "Teridentifikasi & dimitigasi",
    color: "#FF9F0A",
  },
  {
    value: 100,
    suffix: "%",
    label: "Aktivitas Tercatat",
    sub: "Audit trail otomatis",
    color: "#5856D6",
  },
];

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const statRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stats-headline",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: ".stats-headline", start: "top 80%" },
        }
      );

      gsap.fromTo(
        ".stat-card",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".stats-grid", start: "top 80%" },
        }
      );

      // Counter animation for each stat
      statRefs.current.forEach((el, i) => {
        if (!el) return;
        countUp(el, STATS[i].value, {
          suffix: STATS[i].suffix,
          duration: 2,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="statistik"
      className="section-padding bg-white"
    >
      <div className="content-wide">
        {/* Headline */}
        <div className="stats-headline opacity-0 text-center mb-16">
          <p className="text-sm font-semibold text-[#0066CC] tracking-widest uppercase mb-4">
            Dalam Angka
          </p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-bold text-[#1D1D1F] tracking-tight mb-4">
            Dibangun dengan standar yang terukur.
          </h2>
          <p className="text-[18px] text-[#6E6E73] max-w-[480px] mx-auto">
            Setiap komponen diuji, dianalisis, dan didokumentasikan.
          </p>
        </div>

        {/* Stats grid */}
        <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-card opacity-0 text-center p-8 rounded-[18px] bg-[#F5F5F7] group hover:bg-white hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              {/* Value */}
              <div className="mb-2">
                <span
                  ref={(el) => { statRefs.current[i] = el; }}
                  className="text-[clamp(48px,6vw,72px)] font-bold tracking-tight leading-none"
                  style={{ color: stat.color }}
                >
                  0
                </span>
              </div>

              {/* Label */}
              <p className="text-[17px] font-semibold text-[#1D1D1F] mb-1">
                {stat.label}
              </p>

              {/* Sublabel */}
              <p className="text-[13px] text-[#6E6E73]">{stat.sub}</p>

              {/* Bottom accent line */}
              <div
                className="mt-4 h-0.5 w-8 rounded-full mx-auto transition-all duration-300 group-hover:w-16"
                style={{ backgroundColor: stat.color }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
