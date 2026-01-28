import { Request, Response } from "express";
import prisma from "../utils/prisma";

// menambahkan jadwal jam kerja perhari (baik shift maupun reguler) - admin & superadmin
export async function createWorkSchedule(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const {
            scheduleGroupId,
            dayOfWeek,
            startTime,
            breakStart,
            breakEnd,
            endTime,
        } = req.body;

        // Validasi input
        if (!scheduleGroupId || !dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({
                message:
                "scheduleGroupId, dayOfWeek, startTime, dan endTime wajib diisi",
            });
        }

        // Ambil user login dan company
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Ambil companyId admin login
        let companyId: number | null = null;
        if (user.ownedCompanies.length > 0) {
            companyId = user.ownedCompanies[0].id;
        } else if (user.companyId) {
            companyId = user.companyId;
        }

        if (!companyId) {
            return res.status(400).json({
                message: "User tidak terhubung dengan company manapun",
            });
        }

        // Pastikan scheduleGroupId valid dan milik company login
        const group = await prisma.scheduleGroup.findFirst({
            where: { id: scheduleGroupId, companyId, deletedAt: null },
        });

        if (!group) {
            return res.status(404).json({
                message:
                "Schedule group tidak ditemukan atau bukan milik company Anda",
            });
        }

        // Standardisasi dayOfWeek menjadi uppercase
        const dayOfWeekUpper = dayOfWeek.toUpperCase();

        // Cek duplikat jadwal
        const existing = await prisma.workSchedule.findFirst({
            where: {
                companyId,
                scheduleGroupId,
                dayOfWeek: dayOfWeekUpper,
                deletedAt: null,
            },
        });

        if (existing) {
            return res.status(409).json({
                message: `Jadwal untuk hari ${dayOfWeekUpper} sudah ada di shift ini`,
            });
        }

        // Buat work schedule baru
        const workSchedule = await prisma.workSchedule.create({
            data: {
                companyId,
                scheduleGroupId,
                dayOfWeek: dayOfWeekUpper,
                startTime,
                breakStart,
                breakEnd,
                endTime,
            },
        });

        res.status(201).json({
            message: "Work schedule berhasil dibuat",
            data: workSchedule,
        });
    } catch (err: any) {
        console.error("Error createWorkSchedule:", err);
        res.status(500).json({
            message:
                err.message || "Terjadi kesalahan saat membuat work schedule",
        });
    }
}

// ambil data work schedule hanya milik admin yang login
export async function getMyWorkSchedules(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Ambil companyId dari user login
        let companyId: number | null = null;
        if (user.ownedCompanies.length > 0) {
            companyId = user.ownedCompanies[0].id;
        } else if (user.companyId) {
            companyId = user.companyId;
        }

        if (!companyId) {
            return res.status(400).json({
                message: "User tidak terhubung dengan company manapun",
            });
        }

        // Ambil work schedule berdasarkan companyId
        const schedules = await prisma.workSchedule.findMany({
            where: { companyId, deletedAt: null },
            include: {
                scheduleGroup: {
                select: { id: true, nameOfShift: true },
                },
            },
            orderBy: [
                { scheduleGroupId: "asc" },
                { dayOfWeek: "asc" },
            ],
        });

        res.status(200).json({
            message: "Data work schedule berhasil diambil",
            count: schedules.length,
            data: schedules,
        });
    } catch (err) {
        console.error("Error getMyWorkSchedules:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data" });
    }
}

// ambil semua data (superadmin)
export async function getAllWorkSchedules(req: Request, res: Response) {
    try {
        const userRole = (req as any).user.role;

        if (userRole !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const schedules = await prisma.workSchedule.findMany({
            where: { deletedAt: null },
            include: {
                company: { select: { id: true, companyName: true } },
                scheduleGroup: { select: { id: true, nameOfShift: true } },
            },
            orderBy: [
                { companyId: "asc" },
                { scheduleGroupId: "asc" },
                { dayOfWeek: "asc" },
            ],
        });

        res.status(200).json({
            message: "Berhasil mengambil semua data work schedule",
            count: schedules.length,
            data: schedules,
        });
    } catch (err) {
        console.error("Error getAllWorkSchedules:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil semua data" });
    }
}

export async function getMyWorkSchedulesEmployee(
    req: Request,
    res: Response
  ) {
    try {
      const userId = (req as any).user.id;
  
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { role: true, companyId: true },
      });
  
      if (!user || user.role !== "EMPLOYEE") {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      const employee = await prisma.employee.findFirst({
        where: { userId, deletedAt: null },
        select: { scheduleGroupId: true },
      });
  
      if (!employee?.scheduleGroupId) {
        return res.status(200).json({
          message: "Employee belum memiliki shift",
          data: [],
        });
      }
  
      const schedules = await prisma.workSchedule.findMany({
        where: {
          companyId: user.companyId!,
          scheduleGroupId: employee.scheduleGroupId,
          deletedAt: null,
        },
        include: {
          scheduleGroup: {
            select: { nameOfShift: true },
          },
        },
        orderBy: { dayOfWeek: "asc" },
      });
  
      res.status(200).json({
        message: "Work schedule employee berhasil diambil",
        data: schedules,
      });
    } catch (err) {
      console.error("getMyWorkSchedulesEmployee", err);
      res.status(500).json({
        message: "Terjadi kesalahan saat mengambil work schedule",
      });
    }
  }

// update work schedule - admin & superadmin
export async function updateWorkSchedule(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const {
            scheduleGroupId,
            dayOfWeek,
            startTime,
            breakStart,
            breakEnd,
            endTime,
        } = req.body;

        // Validasi ID
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID work schedule tidak valid",
            });
        }

        const workScheduleId = Number(id);

        // Ambil user login dan company
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Ambil companyId admin login
        let companyId: number | null = null;
        if (user.ownedCompanies.length > 0) {
            companyId = user.ownedCompanies[0].id;
        } else if (user.companyId) {
            companyId = user.companyId;
        }

        if (!companyId) {
            return res.status(400).json({
                message: "User tidak terhubung dengan company manapun",
            });
        }

        // Cek apakah work schedule ada dan milik company login
        const existingSchedule = await prisma.workSchedule.findFirst({
            where: {
                id: workScheduleId,
                companyId,
                deletedAt: null,
            },
        });

        if (!existingSchedule) {
            return res.status(404).json({
                message: "Work schedule tidak ditemukan atau bukan milik company Anda",
            });
        }

        // Jika dayOfWeek diubah, cek duplikat
        if (dayOfWeek && dayOfWeek !== existingSchedule.dayOfWeek) {
            const duplicate = await prisma.workSchedule.findFirst({
                where: {
                    companyId,
                    scheduleGroupId: existingSchedule.scheduleGroupId,
                    dayOfWeek,
                    deletedAt: null,
                    id: { not: workScheduleId },
                },
            });

            if (duplicate) {
                return res.status(409).json({
                    message: `Jadwal untuk hari ${dayOfWeek} sudah ada di shift ini`,
                });
            }
        }

        // Siapkan data yang akan diupdate
        const updateData: any = {};
        if (scheduleGroupId !== undefined) updateData.scheduleGroupId = scheduleGroupId;
        if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
        if (startTime !== undefined) updateData.startTime = startTime;
        if (breakStart !== undefined) updateData.breakStart = breakStart;
        if (breakEnd !== undefined) updateData.breakEnd = breakEnd;
        if (endTime !== undefined) updateData.endTime = endTime;

        // Validasi minimal ada satu field yang diupdate
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "Tidak ada data yang akan diupdate",
            });
        }

        // Update work schedule
        const updatedSchedule = await prisma.workSchedule.update({
            where: { id: workScheduleId },
            data: updateData,
            include: {
                scheduleGroup: {
                    select: { id: true, nameOfShift: true },
                },
            },
        });

        res.status(200).json({
            message: "Work schedule berhasil diupdate",
            data: updatedSchedule,
        });
    } catch (err: any) {
        console.error("Error updateWorkSchedule:", err);
        res.status(500).json({
            message:
                err.message || "Terjadi kesalahan saat mengupdate work schedule",
        });
    }
}

// delete work schedule (soft delete) - admin & superadmin
export async function deleteWorkSchedule(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        // Validasi ID
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID work schedule tidak valid",
            });
        }

        const workScheduleId = Number(id);

        // Ambil user login dan company
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Ambil companyId admin login
        let companyId: number | null = null;
        if (user.ownedCompanies.length > 0) {
            companyId = user.ownedCompanies[0].id;
        } else if (user.companyId) {
            companyId = user.companyId;
        }

        if (!companyId) {
            return res.status(400).json({
                message: "User tidak terhubung dengan company manapun",
            });
        }

        // Cek apakah work schedule ada dan milik company login
        const existingSchedule = await prisma.workSchedule.findFirst({
            where: {
                id: workScheduleId,
                companyId,
                deletedAt: null,
            },
        });

        if (!existingSchedule) {
            return res.status(404).json({
                message: "Work schedule tidak ditemukan atau bukan milik company Anda",
            });
        }

        // Soft delete work schedule
        await prisma.workSchedule.update({
            where: { id: workScheduleId },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({
            message: "Work schedule berhasil dihapus",
        });
    } catch (err: any) {
        console.error("Error deleteWorkSchedule:", err);
        res.status(500).json({
            message:
                err.message || "Terjadi kesalahan saat menghapus work schedule",
        });
    }
}