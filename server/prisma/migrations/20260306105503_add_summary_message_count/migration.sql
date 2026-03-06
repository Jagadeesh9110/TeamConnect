/*
  Warnings:

  - Added the required column `message_count` to the `conversation_summaries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conversation_summaries" ADD COLUMN     "message_count" INTEGER NOT NULL;
