export interface RekamMedis {
  id: string;
  kunjunganId: string;
  dokterId: string;
  diagnosa: string;
  tindakan: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
  dokter?: { id: string; nama: string };
  kunjungan?: { id: string; tanggal: string; keluhan: string; pasien?: { nama: string } };
  resepObat?: ResepObat[];
}

export interface ResepObat {
  id: string;
  rekamMedisId: string;
  obatId: string;
  jumlah: number;
  aturanPakai: string;
  obat?: { id: string; nama: string; satuan: string };
}

export interface CreateRekamMedisRequest {
  kunjunganId: string;
  diagnosa: string;
  tindakan: string;
  catatan?: string;
  resepObat?: { obatId: string; jumlah: number; aturanPakai: string }[];
}
