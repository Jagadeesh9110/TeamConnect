-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_user_id_fkey";

-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "role" "participant_role" NOT NULL DEFAULT 'MEMBER';

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
