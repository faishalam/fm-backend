-- AlterTable
ALTER TABLE "FinancialProfile" ALTER COLUMN "salaryMonthly" DROP NOT NULL,
ALTER COLUMN "currentSavings" DROP NOT NULL,
ALTER COLUMN "currentSavings" DROP DEFAULT,
ALTER COLUMN "targetAmount" DROP NOT NULL,
ALTER COLUMN "targetAmount" DROP DEFAULT;
