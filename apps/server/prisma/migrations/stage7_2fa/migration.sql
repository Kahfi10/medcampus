-- Stage 7: 2FA fields on User table
ALTER TABLE `User`
  ADD COLUMN `twoFactorSecret` VARCHAR(100) NULL,
  ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT FALSE;
