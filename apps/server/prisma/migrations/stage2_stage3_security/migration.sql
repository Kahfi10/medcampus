-- Stage 2: RefreshToken table for token blacklist & rotation tracking
CREATE TABLE `RefreshToken` (
  `id`        VARCHAR(191) NOT NULL,
  `jti`       VARCHAR(36)  NOT NULL,
  `userId`    VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(64)  NOT NULL,
  `expiresAt` DATETIME(3)  NOT NULL,
  `revokedAt` DATETIME(3)  NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `RefreshToken_jti_key` (`jti`),
  INDEX `RefreshToken_userId_idx` (`userId`),
  INDEX `RefreshToken_jti_idx` (`jti`),
  INDEX `RefreshToken_expiresAt_idx` (`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key to User
ALTER TABLE `RefreshToken`
  ADD CONSTRAINT `RefreshToken_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stage 3: Account lockout fields on User table
ALTER TABLE `User`
  ADD COLUMN `failedLoginAttempts` INT NOT NULL DEFAULT 0,
  ADD COLUMN `lockedUntil` DATETIME(3) NULL;
