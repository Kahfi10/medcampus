export type Role = "ADMIN" | "DOKTER" | "PASIEN";

export interface User {
  id: string;
  nama: string;
  email: string;
  role: Role;
  nim?: string;
  nip?: string;
  telepon?: string;
  golDarah?: string;
  alergi?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  _count?: {
    kunjungan: number;
    rekamMedis: number;
  };
}
