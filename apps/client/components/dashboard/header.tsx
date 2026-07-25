"use client";

import { AuthUser } from "@/lib/auth";

const ROLE_LABEL = { ADMIN: "Administrator", DOKTER: "Dokter", PASIEN: "Pasien" };

interface DashboardHeaderProps {
  user: AuthUser;
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ user, title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="h-[60px] bg-white border-b border-[#F0F0F5] px-8 flex items-center justify-between flex-shrink-0">
      {/* Page title */}
      <div>
        <h1 className="text-[17px] font-semibold text-[#1D1D1F] leading-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#6E6E73]">{subtitle}</p>}
      </div>

      {/* Right — user chip */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-[13px] font-medium text-[#1D1D1F]">{user.nama}</p>
          <p className="text-[12px] text-[#6E6E73]">{ROLE_LABEL[user.role]}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#0066CC] flex items-center justify-center flex-shrink-0">
          <span className="text-[13px] font-bold text-white">
            {user.nama.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
