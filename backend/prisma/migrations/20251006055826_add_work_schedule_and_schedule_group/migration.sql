/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "schedule_group_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."schedule_groups" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name_of_shift" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "schedule_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_schedules" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "schedule_group_id" INTEGER NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "break_start" TEXT,
    "break_end" TEXT,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_groups_company_id_name_of_shift_key" ON "public"."schedule_groups"("company_id", "name_of_shift");

-- CreateIndex
CREATE UNIQUE INDEX "employees_nik_key" ON "public"."employees"("nik");

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_schedule_group_id_fkey" FOREIGN KEY ("schedule_group_id") REFERENCES "public"."schedule_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_groups" ADD CONSTRAINT "schedule_groups_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_schedules" ADD CONSTRAINT "work_schedules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_schedules" ADD CONSTRAINT "work_schedules_schedule_group_id_fkey" FOREIGN KEY ("schedule_group_id") REFERENCES "public"."schedule_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
