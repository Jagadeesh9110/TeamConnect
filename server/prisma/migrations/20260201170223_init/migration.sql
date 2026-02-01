/*
  Warnings:

  - The values [NORMAL_USER] on the enum `participant_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "participant_role_new" AS ENUM ('ADMIN', 'MEMBER');
ALTER TYPE "participant_role" RENAME TO "participant_role_old";
ALTER TYPE "participant_role_new" RENAME TO "participant_role";
DROP TYPE "public"."participant_role_old";
COMMIT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
