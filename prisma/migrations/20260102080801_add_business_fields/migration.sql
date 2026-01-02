-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PHP',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tax_id" TEXT;
