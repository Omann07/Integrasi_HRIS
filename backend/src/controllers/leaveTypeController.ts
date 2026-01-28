import { Request, Response } from "express";
import prisma from "../utils/prisma";

// Create Leave Type - Admin & Superadmin
export async function createLeaveType(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { name, maxDays, description, isPaid } = req.body;

        if (!name || !maxDays) {
            return res.status(400).json({
                message: "Name dan maxDays wajib diisi",
            });
        }

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

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

        // Cek duplikat nama leave type - INCLUDE SOFT DELETED RECORDS
        const existing = await prisma.leaveType.findFirst({
            where: { 
                companyId, 
                name,
                // Hapus deletedAt: null untuk mencari semua record
            },
        });

        if (existing && existing.deletedAt === null) {
            return res.status(409).json({
                message: `Tipe cuti "${name}" sudah ada di perusahaan ini`,
            });
        }

        // Jika ada record yang sudah di-soft delete dengan nama yang sama,
        // update record tersebut (auto-restore)
        if (existing && existing.deletedAt !== null) {
            const leaveType = await prisma.leaveType.update({
                where: { id: existing.id },
                data: {
                    maxDays: Number(maxDays),
                    description,
                    isPaid: isPaid !== undefined ? Boolean(isPaid) : true,
                    deletedAt: null, // Reactivate the record
                    updatedAt: new Date(),
                },
            });

            return res.status(201).json({
                message: "Tipe cuti berhasil dibuat (reactivated)",
                data: leaveType,
            });
        }

        // Buat baru jika tidak ada record sama sekali
        const leaveType = await prisma.leaveType.create({
            data: {
                companyId,
                name,
                maxDays: Number(maxDays),
                description,
                isPaid: isPaid !== undefined ? Boolean(isPaid) : true,
            },
        });

        res.status(201).json({
            message: "Tipe cuti berhasil dibuat",
            data: leaveType,
        });
    } catch (err: any) {
        console.error("Error createLeaveType:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat membuat tipe cuti",
        });
    }
}

// Get Leave Types (by company)
export async function getLeaveTypes(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let companyId: number | null = null;
        if (user.role === "SUPERADMIN") {
            // Superadmin bisa lihat semua
            const leaveTypes = await prisma.leaveType.findMany({
                where: { deletedAt: null },
                include: {
                    company: { select: { id: true, companyName: true } },
                },
                orderBy: { companyId: "asc" },
            });

            return res.status(200).json({
                message: "Success",
                count: leaveTypes.length,
                data: leaveTypes,
            });
        }

        // Admin & Employee
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

        const leaveTypes = await prisma.leaveType.findMany({
            where: { companyId, deletedAt: null },
            orderBy: { name: "asc" },
        });

        res.status(200).json({
            message: "Success",
            count: leaveTypes.length,
            data: leaveTypes,
        });
    } catch (err) {
        console.error("Error getLeaveTypes:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data" });
    }
}

// Update Leave Type
export async function updateLeaveType(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { name, maxDays, description, isPaid } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID leave type tidak valid",
            });
        }

        const leaveTypeId = Number(id);

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

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

        const existingLeaveType = await prisma.leaveType.findFirst({
            where: { id: leaveTypeId, companyId, deletedAt: null },
        });

        if (!existingLeaveType) {
            return res.status(404).json({
                message: "Leave type tidak ditemukan atau bukan milik company Anda",
            });
        }

        // Cek duplikat nama
        if (name && name !== existingLeaveType.name) {
            const duplicate = await prisma.leaveType.findFirst({
                where: {
                    companyId,
                    name,
                    deletedAt: null,
                    id: { not: leaveTypeId },
                },
            });

            if (duplicate) {
                return res.status(409).json({
                    message: `Tipe cuti "${name}" sudah ada di perusahaan ini`,
                });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (maxDays !== undefined) updateData.maxDays = Number(maxDays);
        if (description !== undefined) updateData.description = description;
        if (isPaid !== undefined) updateData.isPaid = Boolean(isPaid);

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "Tidak ada data yang akan diupdate",
            });
        }

        const updatedLeaveType = await prisma.leaveType.update({
            where: { id: leaveTypeId },
            data: updateData,
        });

        res.status(200).json({
            message: "Leave type berhasil diupdate",
            data: updatedLeaveType,
        });
    } catch (err: any) {
        console.error("Error updateLeaveType:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat mengupdate leave type",
        });
    }
}

// Delete Leave Type
export async function deleteLeaveType(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID leave type tidak valid",
            });
        }

        const leaveTypeId = Number(id);

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

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

        const existingLeaveType = await prisma.leaveType.findFirst({
            where: { id: leaveTypeId, companyId, deletedAt: null },
        });

        if (!existingLeaveType) {
            return res.status(404).json({
                message: "Leave type tidak ditemukan atau bukan milik company Anda",
            });
        }

        // Cek apakah ada leave request yang menggunakan leave type ini
        const hasLeaveRequests = await prisma.leaveRequest.findFirst({
            where: { leaveTypeId, deletedAt: null },
        });

        if (hasLeaveRequests) {
            return res.status(400).json({
                message: "Tidak dapat menghapus leave type karena masih ada pengajuan cuti yang menggunakannya",
            });
        }

        await prisma.leaveType.update({
            where: { id: leaveTypeId },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({
            message: "Leave type berhasil dihapus",
        });
    } catch (err: any) {
        console.error("Error deleteLeaveType:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat menghapus leave type",
        });
    }
}