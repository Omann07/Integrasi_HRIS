import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { calculateTotalDays } from "../utils/calculateTotalDays";

// Create Leave Request - Employee
export async function createLeaveRequest(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { leaveTypeId, startDate, endDate, reason } = req.body;
        const attachmentFile = req.file ? req.file.filename : null;

        if (!leaveTypeId || !startDate || !endDate || !reason) {
            return res.status(400).json({
                message: "leaveTypeId, startDate, endDate, dan reason wajib diisi",
            });
        }

        // Cek employee dengan schedule group
        const employee = await prisma.employee.findFirst({
            where: { userId, deletedAt: null },
            include: { 
                company: true,
                scheduleGroup: true 
            },
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee tidak ditemukan",
            });
        }

        // Validasi employee punya schedule group
        if (!employee.scheduleGroupId) {
            return res.status(400).json({
                message: "Employee belum memiliki schedule group yang ditentukan",
            });
        }

        // Validasi leave type
        const leaveType = await prisma.leaveType.findFirst({
            where: {
                id: Number(leaveTypeId),
                companyId: employee.companyId,
                deletedAt: null,
            },
        });

        if (!leaveType) {
            return res.status(404).json({
                message: "Tipe cuti tidak ditemukan atau tidak tersedia",
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validasi tanggal
        if (start > end) {
            return res.status(400).json({
                message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai",
            });
        }

        // Hitung total hari berdasarkan work schedule employee
        const totalDays = await calculateTotalDays(
            start, 
            end, 
            employee.scheduleGroupId
        );

        if (totalDays === 0) {
            return res.status(400).json({
                message: "Tidak ada hari kerja dalam rentang tanggal yang dipilih",
            });
        }

        if (totalDays > leaveType.maxDays) {
            return res.status(400).json({
                message: `Jumlah hari cuti (${totalDays}) melebihi maksimal ${leaveType.maxDays} hari untuk tipe cuti ini`,
            });
        }

        // Cek apakah ada cuti yang overlap
        const overlapping = await prisma.leaveRequest.findFirst({
            where: {
                employeeId: employee.id,
                deletedAt: null,
                status: { in: ["PENDING", "APPROVED"] },
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start },
                    },
                ],
            },
        });

        if (overlapping) {
            return res.status(409).json({
                message: "Anda sudah memiliki pengajuan cuti pada tanggal tersebut",
            });
        }

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId: employee.id,
                leaveTypeId: Number(leaveTypeId),
                startDate: start,
                endDate: end,
                totalDays,
                reason,
                attachment: attachmentFile,
                status: "PENDING",
            },
            include: {
                leaveType: true,
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        scheduleGroup: true
                    },
                },
            },
        });

        res.status(201).json({
            message: "Pengajuan cuti berhasil dibuat",
            data: leaveRequest,
        });
    } catch (err: any) {
        console.error("Error createLeaveRequest:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat membuat pengajuan cuti",
        });
    }
}

// Get Leave Requests (Employee: own requests, Admin: all company requests)
export async function getLeaveRequests(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { status, page = 1, limit = 10 } = req.query;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let whereCondition: any = { deletedAt: null };

        // Filter berdasarkan status jika ada
        if (status) {
            whereCondition.status = status;
        }

        let leaveRequests;
        let totalCount;

        if (user.role === "EMPLOYEE") {
            // Employee hanya lihat cuti sendiri
            const employee = await prisma.employee.findFirst({
                where: { userId, deletedAt: null },
            });

            if (!employee) {
                return res.status(404).json({ message: "Employee not found" });
            }

            whereCondition.employeeId = employee.id;

            totalCount = await prisma.leaveRequest.count({ where: whereCondition });

            leaveRequests = await prisma.leaveRequest.findMany({
                where: whereCondition,
                include: {
                    leaveType: true,
                    employee: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                        },
                    },
                    approver: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
        } else if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
            // Admin lihat semua cuti di company-nya
            let companyId: number | null = null;

            if (user.role === "SUPERADMIN") {
                // Superadmin lihat semua
                totalCount = await prisma.leaveRequest.count({ where: whereCondition });

                leaveRequests = await prisma.leaveRequest.findMany({
                    where: whereCondition,
                    include: {
                        leaveType: true,
                        employee: {
                            include: {
                                user: { select: { id: true, name: true, email: true } },
                                company: { select: { id: true, companyName: true } },
                            },
                        },
                        approver: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit),
                });
            } else {
                if (user.ownedCompanies.length > 0) {
                    companyId = user.ownedCompanies[0].id;
                } else if (user.companyId) {
                    companyId = user.companyId;
                }

                if (!companyId) {
                    return res.status(400).json({
                        message: "Admin tidak terhubung dengan company manapun",
                    });
                }

                whereCondition.employee = {
                    companyId,
                };

                totalCount = await prisma.leaveRequest.count({ where: whereCondition });

                leaveRequests = await prisma.leaveRequest.findMany({
                    where: whereCondition,
                    include: {
                        leaveType: true,
                        employee: {
                            include: {
                                user: { select: { id: true, name: true, email: true } },
                            },
                        },
                        approver: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit),
                });
            }
        } else {
            return res.status(403).json({ message: "Unauthorized" });
        }

        res.status(200).json({
            message: "Success",
            data: leaveRequests,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalCount / Number(limit)),
                totalItems: totalCount,
                itemsPerPage: Number(limit),
            },
        });
    } catch (err) {
        console.error("Error getLeaveRequests:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data" });
    }
}

// Get Leave Request by ID
export async function getLeaveRequestById(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID leave request tidak valid",
            });
        }

        const leaveRequestId = Number(id);

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: { id: leaveRequestId, deletedAt: null },
            include: {
                leaveType: true,
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        company: { select: { id: true, companyName: true } },
                    },
                },
                approver: { select: { id: true, name: true, email: true } },
            },
        });

        if (!leaveRequest) {
            return res.status(404).json({
                message: "Leave request tidak ditemukan",
            });
        }

        // Validasi akses
        if (user.role === "EMPLOYEE") {
            const employee = await prisma.employee.findFirst({
                where: { userId, deletedAt: null },
            });

            if (!employee || leaveRequest.employeeId !== employee.id) {
                return res.status(403).json({
                    message: "Anda tidak memiliki akses ke leave request ini",
                });
            }
        } else if (user.role === "ADMIN") {
            let companyId: number | null = null;
            if (user.ownedCompanies.length > 0) {
                companyId = user.ownedCompanies[0].id;
            } else if (user.companyId) {
                companyId = user.companyId;
            }

            if (!companyId || leaveRequest.employee.companyId !== companyId) {
                return res.status(403).json({
                    message: "Leave request bukan milik company Anda",
                });
            }
        }

        res.status(200).json({
            message: "Success",
            data: leaveRequest,
        });
    } catch (err) {
        console.error("Error getLeaveRequestById:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data" });
    }
}

export const updateLeaveRequest = async (req: any, res: Response) => {
    try {
      const leaveId = Number(req.params.id);
      const userId = req.user.id;
  
      const leave = await prisma.leaveRequest.findFirst({
        where: {
          id: leaveId,
          deletedAt: null,
        },
        include: {
          employee: true,
        },
      });
  
      if (!leave) {
        return res.status(404).json({ message: "Leave request not found" });
      }
  
      // Pastikan milik employee sendiri
      const employee = await prisma.employee.findFirst({
        where: { userId, deletedAt: null },
      });
  
      if (!employee || leave.employeeId !== employee.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      if (leave.status !== "PENDING") {
        return res.status(400).json({
          message: "Only pending leave requests can be updated",
        });
      }
  
      const {
        leaveTypeId,
        startDate,
        endDate,
        reason,
      } = req.body;
  
      const updateData: any = {};
  
      // 🔹 VALIDASI leaveTypeId (OPSIONAL)
      if (leaveTypeId) {
        const leaveType = await prisma.leaveType.findFirst({
          where: {
            id: Number(leaveTypeId),
            companyId: employee.companyId,
            deletedAt: null,
          },
        });
  
        if (!leaveType) {
          return res.status(400).json({
            message: "Leave type tidak valid",
          });
        }
  
        updateData.leaveTypeId = Number(leaveTypeId);
      }
  
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (reason) updateData.reason = reason;
  
      if (req.file) {
        updateData.attachment = req.file.filename;
      }
  
      const updated = await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: updateData,
      });
  
      res.json({
        message: "Leave request updated",
        data: updated,
      });
    } catch (err: any) {
      console.error("Update leave error:", err);
      res.status(500).json({
        message: "Update failed",
        error: err.message,
      });
    }
  };


// Approve/Reject Leave Request - Admin only
export async function updateLeaveRequestStatus(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID leave request tidak valid",
            });
        }

        if (!status || !["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                message: "Status harus APPROVED atau REJECTED",
            });
        }

        if (status === "REJECTED" && !rejectionReason) {
            return res.status(400).json({
                message: "Rejection reason wajib diisi untuk penolakan",
            });
        }

        const leaveRequestId = Number(id);

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: { id: leaveRequestId, deletedAt: null },
            include: {
                employee: { include: { company: true } },
            },
        });

        if (!leaveRequest) {
            return res.status(404).json({
                message: "Leave request tidak ditemukan",
            });
        }

        if (leaveRequest.status !== "PENDING") {
            return res.status(400).json({
                message: `Leave request sudah ${leaveRequest.status}`,
            });
        }

        // Validasi company
        if (user.role === "ADMIN") {
            let companyId: number | null = null;
            if (user.ownedCompanies.length > 0) {
                companyId = user.ownedCompanies[0].id;
            } else if (user.companyId) {
                companyId = user.companyId;
            }

            if (!companyId || leaveRequest.employee.companyId !== companyId) {
                return res.status(403).json({
                    message: "Leave request bukan milik company Anda",
                });
            }
        }

        const updatedLeaveRequest = await prisma.leaveRequest.update({
            where: { id: leaveRequestId },
            data: {
                status,
                approvedBy: userId,
                approvedAt: new Date(),
                rejectionReason: status === "REJECTED" ? rejectionReason : null,
            },
            include: {
                leaveType: true,
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
                approver: { select: { id: true, name: true, email: true } },
            },
        });

        res.status(200).json({
            message: `Leave request berhasil ${status === "APPROVED" ? "disetujui" : "ditolak"}`,
            data: updatedLeaveRequest,
        });
    } catch (err: any) {
        console.error("Error updateLeaveRequestStatus:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat mengupdate status",
        });
    }
}

// Cancel Leave Request - Employee only (hanya yang PENDING)
export async function cancelLeaveRequest(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID leave request tidak valid",
            });
        }

        const leaveRequestId = Number(id);

        const employee = await prisma.employee.findFirst({
            where: { userId, deletedAt: null },
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee tidak ditemukan",
            });
        }

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                id: leaveRequestId,
                employeeId: employee.id,
                deletedAt: null,
            },
        });

        if (!leaveRequest) {
            return res.status(404).json({
                message: "Leave request tidak ditemukan",
            });
        }

        if (leaveRequest.status !== "PENDING") {
            return res.status(400).json({
                message: `Tidak dapat membatalkan leave request yang sudah ${leaveRequest.status}`,
            });
        }

        const cancelledLeaveRequest = await prisma.leaveRequest.update({
            where: { id: leaveRequestId },
            data: { status: "CANCELLED" },
            include: {
                leaveType: true,
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        res.status(200).json({
            message: "Leave request berhasil dibatalkan",
            data: cancelledLeaveRequest,
        });
    } catch (err: any) {
        console.error("Error cancelLeaveRequest:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat membatalkan leave request",
        });
    }
}

// Delete Leave Request - Admin only
export async function deleteLeaveRequest(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "ID leave request tidak valid",
            });
        }

        const leaveRequestId = Number(id);

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: { id: leaveRequestId, deletedAt: null },
            include: {
                employee: { include: { company: true } },
            },
        });

        if (!leaveRequest) {
            return res.status(404).json({
                message: "Leave request tidak ditemukan",
            });
        }

        // Validasi company untuk ADMIN
        if (user.role === "ADMIN") {
            let companyId: number | null = null;
            if (user.ownedCompanies.length > 0) {
                companyId = user.ownedCompanies[0].id;
            } else if (user.companyId) {
                companyId = user.companyId;
            }

            if (!companyId || leaveRequest.employee.companyId !== companyId) {
                return res.status(403).json({
                    message: "Leave request bukan milik company Anda",
                });
            }
        }

        // Soft delete
        await prisma.leaveRequest.update({
            where: { id: leaveRequestId },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({
            message: "Leave request berhasil dihapus",
        });
    } catch (err: any) {
        console.error("Error deleteLeaveRequest:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat menghapus leave request",
        });
    }
}