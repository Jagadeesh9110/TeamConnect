-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deleted_at" TIMESTAMPTZ(3),
ADD COLUMN     "edited_at" TIMESTAMPTZ(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
