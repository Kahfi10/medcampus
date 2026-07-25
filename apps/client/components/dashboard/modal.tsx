"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backdropRef.current || !panelRef.current) return;
    if (open) {
      document.body.style.overflow = "hidden";
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo(panelRef.current, { opacity: 0, y: 20, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.out" });
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>
      <div ref={panelRef} className={`bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0F5]">
          <h3 className="text-[17px] font-semibold text-[#1D1D1F]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
