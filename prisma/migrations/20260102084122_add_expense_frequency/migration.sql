-- CreateEnum
CREATE TYPE "ExpenseFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "frequency" "ExpenseFrequency" NOT NULL DEFAULT 'MONTHLY';
