-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('ACTIVE', 'RESIGNED');

-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "promotion_history" TEXT,
ADD COLUMN     "status" "public"."EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';
