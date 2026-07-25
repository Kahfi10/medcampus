"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardHeader from "@/components/dashboard/header";
import DataTable from "@/components/dashboard/data-table";
import Modal from "@/components/dashboard/modal";
import { apiFetch } from "@/lib/auth";

export default function PasienRekamMedisPage() {
  const { user, loading } = useAuth({ requiredRole: "PASIEN" });
  const [data, setData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<any>("/api/rekam-medis/saya")
      .then(r => setData(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [user]);

  const columns = [
    {
      key: "tanggal", label: "Tanggal",
      render: (r: any) => new Date(r.kunjungan?.tanggal || r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    },
    { key: "diagnosa", label: "Diagnosa", render: (r: any) => <span className="line-clamp-1">{r.diagnosa}</span> },
    { key: "dokter", label: "Dokter", render: (r: any) => r.dokter?.nama || "—" },
    {
      key: "aksi", label: "Detail",
      render: (r: any) => (
        <button onClick={() => setSelected(r)} className="text-[13px] text-[#0066CC] hover:underline font-medium">Lihat Detail</button>
      ),
    },
  ];

  if (loading || !user) return null;

  return (
    <>
      <DashboardHeader user={user} title="Rekam Medis Saya" subtitle="Riwayat pemeriksaan dan diagnosa" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F5]">
            <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Semua Rekam Medis</h2>
            <p className="text-[13px] text-[#6E6E73]">{data.length} total rekam medis</p>
          </div>
          <DataTable columns={columns} data={data} loading={loadingData} emptyText="Belum ada rekam medis." />
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Rekam Medis" maxWidth="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Tanggal</p>
                <p className="text-[15px] text-[#1D1D1F]">{new Date(selected.kunjungan?.tanggal || selected.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Dokter</p>
                <p className="text-[15px] text-[#1D1D1F]">{selected.dokter?.nama || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Keluhan</p>
              <p className="text-[15px] text-[#1D1D1F]">{selected.kunjungan?.keluhan || "—"}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Diagnosa</p>
              <p className="text-[15px] text-[#1D1D1F]">{selected.diagnosa}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Tindakan</p>
              <p className="text-[15px] text-[#1D1D1F]">{selected.tindakan}</p>
            </div>
            {selected.catatan && (
              <div>
                <p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-1">Catatan</p>
                <p className="text-[15px] text-[#1D1D1F]">{selected.catatan}</p>
              </div>
            )}
            {selected.resepObat?.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wide mb-2">Resep Obat</p>
                <div className="space-y-2">
                  {selected.resepObat.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between bg-[#F5F5F7] rounded-xl px-4 py-3">
                      <div>
                        <p className="text-[14px] font-medium text-[#1D1D1F]">{r.obat?.nama}</p>
                        <p className="text-[13px] text-[#6E6E73]">{r.aturanPakai}</p>
                      </div>
                      <span className="text-[14px] font-semibold text-[#1D1D1F]">{r.jumlah} {r.obat?.satuan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
