import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const SALT_ROUNDS = 12;

  // ─── Admin ────────────────────────────────────────────────────────────────
  const adminExists = await prisma.user.findUnique({ where: { email: "admin@medcampus.id" } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        nama: "Administrator",
        email: "admin@medcampus.id",
        password: await bcrypt.hash("Admin@123", SALT_ROUNDS),
        role: "ADMIN",
        nip: "ADM001",
      },
    });
    console.log("✓ Admin created  → admin@medcampus.id / Admin@123");
  } else {
    console.log("✓ Admin already exists");
  }

  // ─── Dokter ───────────────────────────────────────────────────────────────
  const dokterExists = await prisma.user.findUnique({ where: { email: "dokter@medcampus.id" } });
  if (!dokterExists) {
    await prisma.user.create({
      data: {
        nama: "dr. Budi Santoso",
        email: "dokter@medcampus.id",
        password: await bcrypt.hash("Dokter@123", SALT_ROUNDS),
        role: "DOKTER",
        nip: "DKT001",
        telepon: "081234567890",
      },
    });
    console.log("✓ Dokter created → dokter@medcampus.id / Dokter@123");
  } else {
    console.log("✓ Dokter already exists");
  }

  // ─── Pasien ───────────────────────────────────────────────────────────────
  const pasienExists = await prisma.user.findUnique({ where: { email: "pasien@medcampus.id" } });
  if (!pasienExists) {
    await prisma.user.create({
      data: {
        nama: "Ahmad Kahfi",
        email: "pasien@medcampus.id",
        password: await bcrypt.hash("Pasien@123", SALT_ROUNDS),
        role: "PASIEN",
        nim: "105841100121",
        telepon: "082345678901",
        golDarah: "O",
        alergi: "Penisilin",
      },
    });
    console.log("✓ Pasien created → pasien@medcampus.id / Pasien@123");
  } else {
    console.log("✓ Pasien already exists");
  }

  // ─── Data Obat ────────────────────────────────────────────────────────────
  const obatCount = await prisma.obat.count();
  if (obatCount === 0) {
    await prisma.obat.createMany({
      data: [
        { nama: "Paracetamol 500mg", satuan: "tablet", stok: 500 },
        { nama: "Amoxicillin 500mg", satuan: "kapsul", stok: 200 },
        { nama: "Ibuprofen 400mg", satuan: "tablet", stok: 300 },
        { nama: "Antasida Doen", satuan: "tablet", stok: 150 },
        { nama: "Cetirizine 10mg", satuan: "tablet", stok: 100 },
        { nama: "Vitamin C 500mg", satuan: "tablet", stok: 400 },
        { nama: "ORS / Oralit", satuan: "sachet", stok: 80 },
        { nama: "Omeprazole 20mg", satuan: "kapsul", stok: 120 },
        { nama: "Salep Betametason", satuan: "tube", stok: 30 },
        { nama: "Rivanol 1‰", satuan: "botol", stok: 25 },
      ],
    });
    console.log("✓ 10 data obat ditambahkan");
  } else {
    console.log(`✓ Obat already exists (${obatCount} item)`);
  }

  console.log("\nSeed selesai!");
  console.log("─────────────────────────────────────");
  console.log("Akun login:");
  console.log("  ADMIN  → admin@medcampus.id   / Admin@123");
  console.log("  DOKTER → dokter@medcampus.id  / Dokter@123");
  console.log("  PASIEN → pasien@medcampus.id  / Pasien@123");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
