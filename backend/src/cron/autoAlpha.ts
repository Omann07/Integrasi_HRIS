import cron from "node-cron";
import prisma from "../utils/prisma";
import { fromUTCToWIB, formatWIB } from "../utils/timezone";

// CRON berjalan setiap hari jam 21:00 WIB (timezone windows laptop lokal)
cron.schedule(
    "0 21 * * *", // 21:00 setiap hari
    async () => {
        console.log("[AUTO ALPHA] Scheduled Job START (21:00 WIB)");

        try {
            // Ambil waktu WIB
            const nowUTC = new Date();
            const nowWIB = fromUTCToWIB(nowUTC);

            const todayStr = formatWIB(nowWIB, "yyyy-MM-dd");
            const todayDateUTC = new Date(`${todayStr}T00:00:00.000Z`);

            // Tentukan nama hari WIB (uppercase)
            const todayDayName = formatWIB(nowWIB, "EEEE").toUpperCase();

            // Ambil semua employee beserta schedule
            const employees = await prisma.employee.findMany({
                where: { deletedAt: null },
                include: {
                    scheduleGroup: {
                        include: {
                            workSchedules: {
                                where: { deletedAt: null }
                            }
                        }
                    }
                }
            });

            for (const emp of employees) {
                const schedules = emp.scheduleGroup?.workSchedules || [];

                // Skip jika employee libur
                const hasWorkToday = schedules.some(ws => ws.dayOfWeek === todayDayName);
                if (!hasWorkToday) continue;

                // Skip jika employee sedang cuti hari ini
                const leaveToday = await prisma.leaveRequest.findFirst({
                    where: {
                        employeeId: emp.id,
                        deletedAt: null,
                        status: "APPROVED",
                        startDate: { lte: todayDateUTC },
                        endDate: { gte: todayDateUTC }
                    }
                });

                if (leaveToday) continue;

                // Cek attendance hari ini
                const attendance = await prisma.attendance.findFirst({
                    where: {
                        employeeId: emp.id,
                        deletedAt: null,
                        date: todayDateUTC
                    }
                });

                // Jika ada attendance (baik check-in / check-out) = skip
                if (attendance) continue;

                // Buat auto alpha
                await prisma.attendance.create({
                    data: {
                        employeeId: emp.id,
                        date: todayDateUTC,
                        attendanceStatus: "ALPHA",
                        workType: "ABSENT"
                    }
                });

                console.log(`[AUTO ALPHA] Created for employee id ${emp.id}`);
            }

            console.log("[AUTO ALPHA] Job COMPLETE");

        } catch (err) {
            console.error("[AUTO ALPHA] ERROR:", err);
        }
    },
    {
        timezone: "Asia/Jakarta" // memastikan tetap jam 21:00 WIB walau server UTC
    }
);
