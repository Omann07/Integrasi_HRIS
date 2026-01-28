/*
  Warnings:

  - A unique constraint covering the columns `[company_id,nik]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."employees_nik_key";

-- CreateIndex
CREATE UNIQUE INDEX "employees_company_id_nik_key" ON "public"."employees"("company_id", "nik");
