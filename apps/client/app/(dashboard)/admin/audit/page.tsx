"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import DataTable from "@/components/dashboard/data-table";
import { apiFetch } from "@/lib/auth";

const AKSI_COLOR: Record<string, string> = {
  LOGIN_SUCCESS: "#30B86A", LOGIN_FAILED: "#FF3B30", LOGOUT: "#6E6E73",
  ACCESS_DENIED: "#FF3B30", REKAM_MEDIS_ACCESSED: "#0066CC",
  REKAM_MEDIS_CREATED: "#30B86A", KUNJUNGAN_CREATED: "#0066CC",
  USER_CREATED: "#5856D6", USER_DELETED: "#FF3B30", REGISTER: "#30B86A",
};

export default function AdminAuditPage() {
  const { user, loading } = useAuth({ requiredRole: "ADMIN" });
  const [data, setData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterAksi, setFilterAksi] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const res = await apiFetch<any>(`/api/audit-log?page=${page}&limit=${LIMIT}${filterAksi ? `&aksi=${filterAksi}` : ""}`);
      setData(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch { } finally { setLoadingData(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user, page, filterAksi]);

  const columns = [
    {
      key: "createdAt", label: "Waktu",
      render: (r: any) => (
        <span className="text-[13px] font-mono text-[#6E6E73]">
          {new Date(r.createdAt).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      key: "user", label: "Pengguna",
      render: (r: any) => r.user ? (
        <div>
          <p className="font-medium text-[#1D1D1F] text-[14px]">{r.user.nama}</p>
          <p className="text-[12px] text-[#6E6E73]">{r.user.role}</p>
        </div>
      ) : <span className="text-[13px] text-[#6E6E73]">Anonymous</span>,
    },
    {
      key: "aksi", label: "Aksi",
      render: (r: any) => (
        <span className="inline-block text-[12px] font-mono font-semibold px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: `${AKSI_COLOR[r.aksi] || "#6E6E73"}15`, color: AKSI_COLOR[r.aksi] || "#6E6E73" }}>
          {r.aksi}
        </span>
      ),
    },
    {
      key: "detail", label: "Detail",
      render: (r: any) => <span className="text-[13px] text-[#6E6E73] line-clamp-1">{r.detail || "—"}</span>,
    },
    {
      key: "ipAddress", label: "IP",
      render: (r: any) => <span className="text-[13px] font-mono text-[#6E6E73]">{r.ipAddress || "—"}</span>,
    },
  ];

  const totalPages = Math.ceil(total / LIMIT);

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Audit Log" subtitle="Rekam jejak semua aktivitas sistem" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Semua Log Aktivitas</h2>
              <p className="text-[13px] text-[#6E6E73]">{total} total log</p>
            </div>
            <select value={filterAksi} onChange={e => { setFilterAksi(e.target.value); setPage(1); }}
              className="h-10 px-4 rounded-xl border border-[#D8D8DC] bg-[#F5F5F7] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30">
              <option value="">Semua Aksi</option>
              {["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "ACCESS_DENIED", "REKAM_MEDIS_ACCESSED", "REKAM_MEDIS_CREATED", "KUNJUNGAN_CREATED", "USER_CREATED", "USER_DELETED", "REGISTER"].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <DataTable columns={columns} data={data} loading={loadingData} emptyText="Tidak ada log." />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#F0F0F5] flex items-center justify-between">
              <span className="text-[13px] text-[#6E6E73]">Halaman {page} dari {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl bg-[#F5F5F7] text-[13px] font-medium text-[#1D1D1F] disabled:opacity-40 hover:bg-[#E8E8ED] transition-colors">
                  Sebelumnya
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl bg-[#F5F5F7] text-[13px] font-medium text-[#1D1D1F] disabled:opacity-40 hover:bg-[#E8E8ED] transition-colors">
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
