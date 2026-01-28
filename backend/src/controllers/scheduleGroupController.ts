import { Request, Response } from "express";
import prisma from "../utils/prisma";

// Create Schedule Group (Shift) - hanya untuk admin dan superadmin
export async function createScheduleGroup(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id; // dari JWT
        const { nameOfShift } = req.body;

        if (!nameOfShift) {
            return res.status(400).json({ message: "Nama shift wajib diisi" });
        }

        // cek user login
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // ambil companyId dari admin login
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

        // cek apakah shift sudah ada di company yang sama - INCLUDE SOFT DELETED
        const existingShift = await prisma.scheduleGroup.findFirst({
            where: { 
                companyId, 
                nameOfShift,
            },
        });

        if (existingShift && existingShift.deletedAt === null) {
            return res.status(409).json({
                message: `Shift "${nameOfShift}" sudah ada di perusahaan ini`,
            });
        }

        // Jika ada record yang sudah di-soft delete dengan nama yang sama,
        // update record tersebut (auto-restore)
        if (existingShift && existingShift.deletedAt !== null) {
            const scheduleGroup = await prisma.scheduleGroup.update({
                where: { id: existingShift.id },
                data: {
                    deletedAt: null, // Reactivate the record
                    updatedAt: new Date(),
                },
            });

            return res.status(201).json({
                message: "Shift berhasil dibuat (reactivated)",
                data: scheduleGroup,
            });
        }

        // buat shift baru jika tidak ada record sama sekali
        const scheduleGroup = await prisma.scheduleGroup.create({
            data: {
                companyId,
                nameOfShift,
            },
        });

        res.status(201).json({
            message: "Shift berhasil dibuat",
            data: scheduleGroup,
        });
    } catch (err: any) {
        console.error("Error createScheduleGroup:", err);
        
        // Handle unique constraint error
        if (err.code === 'P2002') {
            return res.status(409).json({
                message: `Shift "${req.body.nameOfShift}" sudah ada di perusahaan ini`,
            });
        }
        
        res.status(500).json({ 
            message: err.message || "Terjadi kesalahan saat membuat shift" 
        });
    }
}

// GET shift untuk employee
export async function getMyScheduleGroupsEmployee(
    req: Request,
    res: Response
  ) {
    try {
      const userId = (req as any).user.id;
  
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          role: true,
          companyId: true,
        },
      });
  
      if (!user || user.role !== "EMPLOYEE") {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      if (!user.companyId) {
        return res.status(400).json({
          message: "Employee tidak terhubung dengan company",
        });
      }
  
      const shifts = await prisma.scheduleGroup.findMany({
        where: {
          companyId: user.companyId,
          deletedAt: null,
        },
        select: {
          id: true,
          nameOfShift: true,
          company: {
            select: {
              companyName: true,
            },
          },
        },
        orderBy: { id: "asc" },
      });
  
      res.status(200).json({
        message: "Data shift berhasil diambil",
        data: shifts,
      });
    } catch (err) {
      console.error("Error getMyScheduleGroupsEmployee:", err);
      res.status(500).json({
        message: "Terjadi kesalahan saat mengambil data shift",
      });
    }
  }
  

// melihat schedule group (shift) milik sendiri - admin & superadmin
export async function getMyScheduleGroups(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // ambil companyId dari user login
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

        const scheduleGroups = await prisma.scheduleGroup.findMany({
            where: { companyId, deletedAt: null },
            include: {
                company: { select: { id: true, companyName: true } },
                workSchedules: true,
            },
            orderBy: { id: "asc" },
        });

        res.status(200).json({
            message: "Data shift berhasil diambil",
            count: scheduleGroups.length,
            data: scheduleGroups,
        });
    } catch (err) {
        console.error("Error getMyScheduleGroups:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data shift" });
    }
}

// ambil semua data schedule group khusus superadmin
export async function getAllScheduleGroups(req: Request, res: Response) {
    try {
        const userRole = (req as any).user.role;

        if (userRole !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const scheduleGroups = await prisma.scheduleGroup.findMany({
        where: { deletedAt: null },
            include: {
                company: { select: { id: true, companyName: true } },
                workSchedules: true,
            },
            orderBy: [
                { companyId: "asc" },
                { id: "asc" },
            ],
        });

        res.status(200).json({
            message: "Berhasil mengambil semua data shift (semua perusahaan)",
            count: scheduleGroups.length,
            data: scheduleGroups,
        });
    } catch (err) {
        console.error("Error getAllScheduleGroups:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil semua data shift" });
    }
}

// Update Schedule Group (Shift) - admin & superadmin
export async function updateScheduleGroup(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { nameOfShift } = req.body;

        // Validasi ID
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID schedule group tidak valid",
            });
        }

        const scheduleGroupId = Number(id);

        // Validasi input
        if (!nameOfShift) {
            return res.status(400).json({
                message: "Nama shift wajib diisi",
            });
        }

        // Cek user login
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Ambil companyId dari admin login
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

        // Cek apakah schedule group ada dan milik company login
        const existingScheduleGroup = await prisma.scheduleGroup.findFirst({
            where: {
                id: scheduleGroupId,
                companyId,
                deletedAt: null,
            },
        });

        if (!existingScheduleGroup) {
            return res.status(404).json({
                message: "Schedule group tidak ditemukan atau bukan milik company Anda",
            });
        }

        // Cek duplikat nama shift (kecuali diri sendiri)
        const duplicate = await prisma.scheduleGroup.findFirst({
            where: {
                companyId,
                nameOfShift,
                deletedAt: null,
                id: { not: scheduleGroupId },
            },
        });

        if (duplicate) {
            return res.status(409).json({
                message: `Shift "${nameOfShift}" sudah ada di perusahaan ini`,
            });
        }

        // Update schedule group
        const updatedScheduleGroup = await prisma.scheduleGroup.update({
            where: { id: scheduleGroupId },
            data: { nameOfShift },
            include: {
                company: { select: { id: true, companyName: true } },
                workSchedules: {
                    where: { deletedAt: null },
                },
            },
        });

        res.status(200).json({
            message: "Shift berhasil diupdate",
            data: updatedScheduleGroup,
        });
    } catch (err: any) {
        console.error("Error updateScheduleGroup:", err);
        res.status(500).json({
            message:
                err.message || "Terjadi kesalahan saat mengupdate shift",
        });
    }
}

// delete schedule group (soft delete) - admin & superadmin
export async function deleteScheduleGroup(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        // Validasi ID
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID schedule group tidak valid",
            });
        }

        const scheduleGroupId = Number(id);

        // Cek user login
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Ambil companyId dari admin login
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

        // Cek apakah schedule group ada dan milik company login
        const existingScheduleGroup = await prisma.scheduleGroup.findFirst({
            where: {
                id: scheduleGroupId,
                companyId,
                deletedAt: null,
            },
        });

        if (!existingScheduleGroup) {
            return res.status(404).json({
                message: "Schedule group tidak ditemukan atau bukan milik company Anda",
            });
        }

        // Cek apakah ada employee yang masih menggunakan schedule group ini
        const employeesUsingSchedule = await prisma.employee.findFirst({
            where: {
                scheduleGroupId,
                deletedAt: null,
            },
        });

        if (employeesUsingSchedule) {
            return res.status(400).json({
                message: "Tidak dapat menghapus shift karena masih ada employee yang menggunakannya",
            });
        }

        // Cek apakah ada work schedule yang terkait
        const relatedWorkSchedules = await prisma.workSchedule.findFirst({
            where: {
                scheduleGroupId,
                deletedAt: null,
            },
        });

        if (relatedWorkSchedules) {
            return res.status(400).json({
                message: "Tidak dapat menghapus shift karena masih ada jadwal kerja yang terkait. Hapus jadwal kerja terlebih dahulu",
            });
        }

        // Soft delete schedule group
        await prisma.scheduleGroup.update({
            where: { id: scheduleGroupId },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({
            message: "Shift berhasil dihapus",
        });
    } catch (err: any) {
        console.error("Error deleteScheduleGroup:", err);
        res.status(500).json({
            message:
                err.message || "Terjadi kesalahan saat menghapus shift",
        });
    }
}