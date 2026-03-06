-- CreateTable
CREATE TABLE "conversation_summaries" (
    "summary_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_summaries_pkey" PRIMARY KEY ("summary_id")
);

-- CreateIndex
CREATE INDEX "conversation_summaries_conversation_id_idx" ON "conversation_summaries"("conversation_id");

-- AddForeignKey
ALTER TABLE "conversation_summaries" ADD CONSTRAINT "conversation_summaries_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;
