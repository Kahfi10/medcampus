import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: ReactNode;
}

export default function StatCard({ label, value, sub, color = "#0066CC", icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-[16px] border border-[#F0F0F5] p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
      <p className="text-[28px] font-bold text-[#1D1D1F] leading-none mb-1">{value}</p>
      <p className="text-[14px] font-medium text-[#1D1D1F] mb-0.5">{label}</p>
      {sub && <p className="text-[13px] text-[#6E6E73]">{sub}</p>}
    </div>
  );
}
