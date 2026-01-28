-- CreateEnum
CREATE TYPE "public"."WorkType" AS ENUM ('WFO', 'WFA', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."LocationStatus" AS ENUM ('INSIDE', 'OUTSIDE');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('ONTIME', 'LATE', 'ALPHA');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."attendances" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "work_schedule_id" INTEGER,
    "date" DATE NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "work_type" "public"."WorkType" NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "proof" VARCHAR(255),
    "location_status" "public"."LocationStatus",
    "attendance_status" "public"."AttendanceStatus",
    "approval_status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employee_id_date_key" ON "public"."attendances"("employee_id", "date");

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_work_schedule_id_fkey" FOREIGN KEY ("work_schedule_id") REFERENCES "public"."work_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
