-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'DOKTER', 'PASIEN') NOT NULL DEFAULT 'PASIEN',
    `nim` VARCHAR(20) NULL,
    `nip` VARCHAR(20) NULL,
    `telepon` VARCHAR(20) NULL,
    `golDarah` VARCHAR(3) NULL,
    `alergi` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kunjungan` (
    `id` VARCHAR(191) NOT NULL,
    `pasienId` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `keluhan` TEXT NOT NULL,
    `status` ENUM('MENUNGGU', 'DIPROSES', 'SELESAI', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Kunjungan_pasienId_idx`(`pasienId`),
    INDEX `Kunjungan_status_idx`(`status`),
    INDEX `Kunjungan_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RekamMedis` (
    `id` VARCHAR(191) NOT NULL,
    `kunjunganId` VARCHAR(191) NOT NULL,
    `dokterId` VARCHAR(191) NOT NULL,
    `diagnosa` TEXT NOT NULL,
    `tindakan` TEXT NOT NULL,
    `catatan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RekamMedis_kunjunganId_key`(`kunjunganId`),
    INDEX `RekamMedis_dokterId_idx`(`dokterId`),
    INDEX `RekamMedis_kunjunganId_idx`(`kunjunganId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Obat` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `satuan` VARCHAR(30) NOT NULL,
    `stok` INTEGER NOT NULL DEFAULT 0,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Obat_nama_idx`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResepObat` (
    `id` VARCHAR(191) NOT NULL,
    `rekamMedisId` VARCHAR(191) NOT NULL,
    `obatId` VARCHAR(191) NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `aturanPakai` VARCHAR(200) NOT NULL,

    INDEX `ResepObat_rekamMedisId_idx`(`rekamMedisId`),
    INDEX `ResepObat_obatId_idx`(`obatId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `aksi` VARCHAR(60) NOT NULL,
    `detail` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_aksi_idx`(`aksi`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Kunjungan` ADD CONSTRAINT `Kunjungan_pasienId_fkey` FOREIGN KEY (`pasienId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RekamMedis` ADD CONSTRAINT `RekamMedis_kunjunganId_fkey` FOREIGN KEY (`kunjunganId`) REFERENCES `Kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RekamMedis` ADD CONSTRAINT `RekamMedis_dokterId_fkey` FOREIGN KEY (`dokterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResepObat` ADD CONSTRAINT `ResepObat_rekamMedisId_fkey` FOREIGN KEY (`rekamMedisId`) REFERENCES `RekamMedis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResepObat` ADD CONSTRAINT `ResepObat_obatId_fkey` FOREIGN KEY (`obatId`) REFERENCES `Obat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
