"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Button } from "@/components/ui/button";

const HEADLINE_WORDS = ["Rekam", "Medis", "Kampus,", "Aman", "&", "Modern."];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.4 });

      // Background gradient orbs
      tl.fromTo(
        bgRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
        0
      );

      // Word-by-word headline reveal
      tl.fromTo(
        ".hero-word",
        { opacity: 0, y: 60, rotateX: -30 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
        },
        0.2
      );

      // Subtitle
      tl.fromTo(
        subRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        0.7
      );

      // CTA buttons
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        0.9
      );

      // Trust badges
      tl.fromTo(
        ".trust-badge",
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.07,
        },
        1.1
      );

      // Floating orbs subtle animation
      gsap.to(".orb-1", {
        y: -20,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(".orb-2", {
        y: 20,
        duration: 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1,
      });
      gsap.to(".orb-3", {
        x: 15,
        y: -10,
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 2,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white pt-[52px]"
    >
      {/* Background decorative orbs */}
      <div ref={bgRef} className="absolute inset-0 overflow-hidden opacity-0 pointer-events-none">
        <div className="orb-1 absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#0066CC]/10 to-[#30B86A]/5 blur-3xl" />
        <div className="orb-2 absolute bottom-[10%] right-[8%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#30B86A]/8 to-[#0066CC]/5 blur-3xl" />
        <div className="orb-3 absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[#0066CC]/6 to-transparent blur-2xl" />
      </div>

      <div className="content-width relative z-10 text-center py-20">
        {/* Eyebrow badge */}
        <div ref={badgesRef} className="flex justify-center mb-8">
          <div className="trust-badge opacity-0 inline-flex items-center gap-2 bg-[#F5F5F7] rounded-full px-4 py-1.5 text-[15px] text-[#6E6E73] font-medium border border-[#E0E0E5]">
            Sistem Rekam Medis Klinik Kampus
          </div>
        </div>

        {/* Main headline */}
        <h1
          ref={headlineRef}
          className="text-[clamp(56px,7vw,88px)] font-bold text-[#1D1D1F] leading-[1.05] tracking-[-0.03em] mb-6"
          style={{ perspective: "1000px" }}
        >
          {HEADLINE_WORDS.map((word, i) => (
            <span
              key={i}
              className="hero-word opacity-0 inline-block mr-[0.25em]"
              style={{
                color:
                  word === "Aman" || word === "&" || word === "Modern."
                    ? "#0066CC"
                    : "#1D1D1F",
              }}
            >
              {word}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p
          ref={subRef}
          className="opacity-0 text-[18px] text-[#6E6E73] max-w-[600px] mx-auto leading-relaxed mb-10 font-normal"
        >
          Platform pengelolaan rekam medis berbasis web dengan prinsip
          SSDLC—autentikasi berlapis, RBAC ketat, dan audit trail lengkap
          untuk setiap aktivitas.
        </p>

        {/* CTA Buttons */}
        <div
          ref={ctaRef}
          className="opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Button size="xl" asChild>
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
          <Button variant="ghost" size="xl" asChild>
            <a href="#fitur" className="text-[#0066CC] hover:text-[#0077ED]">
              Pelajari Lebih Lanjut
            </a>
          </Button>
        </div>

        {/* Trust badges row */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { label: "OWASP Top 10" },
            { label: "STRIDE Modeling" },
            { label: "SAST & SCA" },
            { label: "Audit Trail" },
            { label: "Multi-Role" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="trust-badge opacity-0 flex items-center bg-[#F5F5F7] rounded-full px-4 py-2 text-[14px] text-[#6E6E73] font-medium border border-[#E0E0E5]"
            >
              {badge.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-[11px] text-[#6E6E73] tracking-widest uppercase">
          Scroll
        </span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-[#6E6E73] to-transparent" />
      </div>
    </section>
  );
}
