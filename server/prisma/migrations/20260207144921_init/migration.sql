-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token_hash" TEXT,
ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;
