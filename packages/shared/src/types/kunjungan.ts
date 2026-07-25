export type StatusKunjungan = "MENUNGGU" | "DIPROSES" | "SELESAI" | "DIBATALKAN";

export interface Kunjungan {
  id: string;
  pasienId: string;
  tanggal: string;
  keluhan: string;
  status: StatusKunjungan;
  createdAt: string;
  updatedAt: string;
  pasien?: {
    id: string;
    nama: string;
    nim?: string;
    email: string;
  };
}

export interface CreateKunjunganRequest {
  tanggal: string;
  keluhan: string;
}

export interface UpdateKunjunganStatusRequest {
  status: StatusKunjungan;
}
