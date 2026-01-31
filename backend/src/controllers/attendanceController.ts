import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { calculateDistance, formatDistance } from "../utils/distance";
import { calculateTotalDays } from "../utils/calculateTotalDays";
import { formatDecimal } from "../utils/formatNumber";
import { parse, isBefore, isAfter } from "date-fns";

// Fungsi mengambil data absensi (sudah dibatasi berdasarkan role) include fitur search
export async function getAttendances(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filter query (optional)
        const {
            search        // single search bar untuk semua field
        } = req.query as any;

        // Ambil user untuk cek companyId jika admin
        const userData = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true }
        });

        if (!userData) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        let companyId: number | null = null;
        if (role === "ADMIN") {
            if (userData.ownedCompanies.length > 0) {
                companyId = userData.ownedCompanies[0].id;
            } else if (userData.companyId) {
                companyId = userData.companyId;
            }
        }

        // Filter
        const where: any = {
            deletedAt: null,
            employee: { deletedAt: null } // hanya employee aktif
        };

        if (role === "EMPLOYEE") {
            where.employee = { userId };
        } else if (role === "ADMIN") {
            where.employee = { companyId };
        }

        // Single search bar untuk multiple fields
        if (search) {
            const searchLower = search.toLowerCase();
            
            where.OR = [
                // Search by employee name
                { employee: { fullName: { contains: search, mode: "insensitive" } } },
                // Search by employee code
                { employee: { employeeCode: { contains: search, mode: "insensitive" } } },
                // Search by company name
                { employee: { company: { companyName: { contains: search, mode: "insensitive" } } } },
            ];

            // Search by date dalam search bar
            try {
                // Deteksi dan parse berbagai format tanggal
                let dateObj: Date | null = null;

                // Format: yyyy-mm-dd (2024-01-15)
                if (/^\d{4}-\d{2}-\d{2}$/.test(search)) {
                    dateObj = new Date(search);
                }
                // Format: dd/mm/yyyy (15/01/2024)
                else if (/^\d{2}\/\d{2}\/\d{4}$/.test(search)) {
                    const [day, month, year] = search.split('/');
                    dateObj = new Date(`${year}-${month}-${day}`);
                }
                // Format: yyyy/mm/dd (2024/01/15)
                else if (/^\d{4}\/\d{2}\/\d{2}$/.test(search)) {
                    const [year, month, day] = search.split('/');
                    dateObj = new Date(`${year}-${month}-${day}`);
                }
                // Format: dd-mm-yyyy (15-01-2024)
                else if (/^\d{2}-\d{2}-\d{4}$/.test(search)) {
                    const [day, month, year] = search.split('-');
                    dateObj = new Date(`${year}-${month}-${day}`);
                }

                // Jika berhasil parse tanggal, tambahkan ke search
                if (dateObj && !isNaN(dateObj.getTime())) {
                    where.OR.push({ date: { equals: dateObj } });
                }
            } catch (error) {
                console.log('Date parsing error:', error);
            }

            // Untuk enum fields, cek dengan equals jika cocok dengan value enum
            const workTypeValues = ['wfo', 'wfa', 'hybrid'];
            const locationStatusValues = ['inside', 'outside'];
            const attendanceStatusValues = ['ontime', 'late', 'alpha'];
            const approvalStatusValues = ['pending', 'approved', 'rejected'];

            if (workTypeValues.includes(searchLower)) {
                where.OR.push({
                    workType: searchLower.toUpperCase()
                });
            }

            if (locationStatusValues.includes(searchLower)) {
                where.OR.push({
                    locationStatus: searchLower.toUpperCase()
                });
            }

            if (attendanceStatusValues.includes(searchLower)) {
                where.OR.push({
                    attendanceStatus: searchLower.toUpperCase()
                });
            }

            if (approvalStatusValues.includes(searchLower)) {
                where.OR.push({
                    approvalStatus: searchLower.toUpperCase()
                });
            }
        }

        const [total, data] = await Promise.all([
            prisma.attendance.count({ where }),
            prisma.attendance.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            fullName: true,
                            employeeCode: true,
                            company: { select: { companyName: true } },
                            scheduleGroup: { select: { nameOfShift: true } }
                        }
                    },
                    workSchedule: {
                        select: {
                            dayOfWeek: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            })
        ]);

        // Convert UTC to WIB before returning response
        const formattedData = data.map((item) => ({
            ...item,
            date: req.formatWIB(req.fromUTCToWIB(item.date), "yyyy-MM-dd"),
            checkInTime: item.checkInTime 
                ? req.formatWIB(req.fromUTCToWIB(item.checkInTime), "HH:mm:ss") 
                : null,
            checkOutTime: item.checkOutTime 
                ? req.formatWIB(req.fromUTCToWIB(item.checkOutTime), "HH:mm:ss") 
                : null,
            createdAt: req.formatWIB(req.fromUTCToWIB(item.createdAt)),
            updatedAt: item.updatedAt 
                ? req.formatWIB(req.fromUTCToWIB(item.updatedAt)) 
                : null
        }));

        res.status(200).json({
            message: "Data absensi berhasil diambil",
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: formattedData
        });

    } catch (err: any) {
        console.error("Error getAttendances:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat mengambil data absensi"
        });
    }
}

// Fungsi menambahkan data absensi
export async function createAttendance(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { workType, latitude, longitude } = req.body;
        const proofFile = req.file?.filename ?? null;

        const formattedLatitude = formatDecimal(latitude);
        const formattedLongitude = formatDecimal(longitude);

        /* ==============================
           1. Ambil employee
        ============================== */
        const employee = await prisma.employee.findFirst({
            where: { userId, deletedAt: null },
            include: {
                company: true,
                scheduleGroup: {
                    include: { workSchedules: true }
                }
            }
        });

        if (!employee) {
            return res.status(404).json({ message: "Employee tidak ditemukan" });
        }

        // 2. Ambil waktu dari middleware
        const nowWIB = req.nowWIB;
        const todayDay = req.todayWIB.toUpperCase(); // "MONDAY", dst.

        // Tentukan tanggal absensi
        const dateStringWIB = req.formatWIB(nowWIB, "yyyy-MM-dd");
        
        // Buat tanggal UTC dari string tanggal WIB
        const attendanceDateUTC = new Date(`${dateStringWIB}T00:00:00.000Z`);
        
        // Untuk keperluan parsing jadwal, buat juga tanggal WIB
        const attendanceDateWIB = req.fromUTCToWIB(attendanceDateUTC);

        console.log('Debug Time Info:', {
            nowWIB: req.formatWIB(nowWIB, "yyyy-MM-dd HH:mm:ss"),
            dateStringWIB,
            attendanceDateWIB: req.formatWIB(attendanceDateWIB, "yyyy-MM-dd HH:mm:ss"),
            attendanceDateUTC: req.formatWIB(attendanceDateUTC, "yyyy-MM-dd HH:mm:ss"),
            todayDay,
            attendanceDateWIB_ISO: attendanceDateWIB.toISOString(),
            attendanceDateUTC_ISO: attendanceDateUTC.toISOString()
        });

        /* ==============================
           3. Ambil jadwal hari ini
        ============================== */
        const schedule = employee.scheduleGroup?.workSchedules.find(
            ws => ws.dayOfWeek === todayDay
        );

        if (!schedule) {
            return res.status(400).json({
                message: "Tidak ada jadwal kerja untuk hari ini"
            });
        }

        /* ==============================
           4. Cari attendance hari ini
        ============================== */
        const existing = await prisma.attendance.findFirst({
            where: {
                employeeId: employee.id,
                date: attendanceDateUTC,
                deletedAt: null
            }
        });

        /* ==============================
           5. Parse JAM KERJA (WIB)
        ============================== */
        const startTimeWIB = parse(
            schedule.startTime,
            "HH:mm",
            attendanceDateWIB
        );

        const breakStartWIB = schedule.breakStart
            ? parse(schedule.breakStart, "HH:mm", attendanceDateWIB)
            : parse(schedule.endTime, "HH:mm", attendanceDateWIB);

        /* ==============================
           6. Tentukan CHECK_IN / CHECK_OUT
        ============================== */
        let actionType: "CHECK_IN" | "CHECK_OUT";

        if (!existing) {
            actionType = "CHECK_IN";
        } else if (!existing.checkOutTime) {
            actionType = "CHECK_OUT";
        } else {
            return res.status(400).json({
                message: "Sudah melakukan absensi penuh hari ini"
            });
        }

        /* ==============================
           7. Attendance status
        ============================== */
        let attendanceStatus: "ONTIME" | "LATE" | null = null;

        if (actionType === "CHECK_IN") {
            attendanceStatus = isBefore(nowWIB, startTimeWIB)
                ? "ONTIME"
                : "LATE";
        }

        /* ==============================
           8. Lokasi (WFO)
        ============================== */
        let locationStatus: "INSIDE" | "OUTSIDE" | null = null;

        if (workType === "WFO") {
            if (!formattedLatitude || !formattedLongitude) {
                return res.status(400).json({
                    message: "Latitude & longitude wajib diisi untuk WFO"
                });
            }

            const companyLat = formatDecimal(employee.company.latitude);
            const companyLng = formatDecimal(employee.company.longitude);

            const distance = calculateDistance(
                formattedLatitude,
                formattedLongitude,
                companyLat!,
                companyLng!
            );

            locationStatus =
                distance <= employee.company.radius
                    ? "INSIDE"
                    : "OUTSIDE";
        }

        /* ==============================
           9. Simpan ke DB (UTC)
        ============================== */
        const attendance = existing
            ? await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    checkOutTime: req.toUTCFromWIB(nowWIB),
                    latitude: formattedLatitude,
                    longitude: formattedLongitude,
                    locationStatus,
                    approvalStatus: "PENDING",
                    updatedAt: new Date()
                }
            })
            : await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    workScheduleId: schedule.id,
                    date: attendanceDateUTC,
                    checkInTime: req.toUTCFromWIB(nowWIB),
                    workType,
                    latitude: formattedLatitude,
                    longitude: formattedLongitude,
                    proof: proofFile,
                    locationStatus,
                    attendanceStatus,
                    approvalStatus: "PENDING"
                }
            });

        /* ==============================
           10. Response WIB
        ============================== */
        return res.status(201).json({
            message: `Absensi ${actionType === "CHECK_IN" ? "check-in" : "check-out"} berhasil`,
            data: {
                ...attendance,
                date: req.formatWIB(attendance.date, "yyyy-MM-dd"),
                checkInTime: attendance.checkInTime
                    ? req.formatWIB(attendance.checkInTime, "HH:mm:ss")
                    : null,
                checkOutTime: attendance.checkOutTime
                    ? req.formatWIB(attendance.checkOutTime, "HH:mm:ss")
                    : null
            }
        });

    } catch (err: any) {
        console.error("Error createAttendance:", err);
        return res.status(500).json({
            message: err.message || "Terjadi kesalahan absensi"
        });
    }
}

// Fungsi update data attendance hanya untuk admin/superadmin
export async function updateAttendance(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const attendanceId = Number(req.params.id);

        // 1. Validasi role
        if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // 2. Ambil data user login
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Tentukan companyId user login
        let companyId: number | null = null;
        if (user.ownedCompanies.length > 0) {
            companyId = user.ownedCompanies[0].id;
        } else if (user.companyId) {
            companyId = user.companyId;
        }

        // 3. Ambil data attendance yang akan diupdate
        const existing = await prisma.attendance.findFirst({
            where: { id: attendanceId, deletedAt: null },
            include: {
                employee: { include: { company: true } },
            },
        });

        if (!existing) {
            return res.status(404).json({ message: "Data absensi tidak ditemukan" });
        }

        // 4. Validasi akses berdasarkan role
        if (userRole === "ADMIN" && existing.employee.companyId !== companyId) {
            return res.status(403).json({
                message: "Anda tidak memiliki akses untuk mengedit absensi dari company lain",
            });
        }

        // 5. Ambil data dari body
        const {
            checkInTime,
            checkOutTime,
            attendanceStatus,
            approvalStatus,
            workType,
            locationStatus,
            latitude,
            longitude,
        } = req.body;

        const proofFile = req.file ? req.file.filename : undefined;

        // Format latitude & longitude (maks 8 digit desimal)
        const formattedLatitude = formatDecimal(latitude);
        const formattedLongitude = formatDecimal(longitude);

        // 6. Konversi waktu check-in/out (WIB → UTC)
        let checkInTimeUTC = existing.checkInTime;
        let checkOutTimeUTC = existing.checkOutTime;

        const dateStringWIB = req.formatWIB(req.fromUTCToWIB(existing.date), "yyyy-MM-dd");

        if (checkInTime) {
            const wibToUtc = req.toUTCFromWIB(new Date(`${dateStringWIB}T${checkInTime}:00`));
            checkInTimeUTC = wibToUtc;
        }

        if (checkOutTime) {
            const wibToUtc = req.toUTCFromWIB(new Date(`${dateStringWIB}T${checkOutTime}:00`));
            checkOutTimeUTC = wibToUtc;
        }

        // 7. Update data attendance
        const updatedAttendance = await prisma.attendance.update({
            where: { id: attendanceId },
            data: {
                checkInTime: checkInTimeUTC,
                checkOutTime: checkOutTimeUTC,
                attendanceStatus: attendanceStatus?.toUpperCase(),
                approvalStatus: approvalStatus?.toUpperCase(),
                workType: workType?.toUpperCase(),
                locationStatus: locationStatus?.toUpperCase(),
                latitude: formattedLatitude ?? existing.latitude,
                longitude: formattedLongitude ?? existing.longitude,
                proof: proofFile || existing.proof,
                updatedAt: new Date(),
            },
        });

        // 8. Format output agar tetap WIB saat ditampilkan
        const responseData = {
            ...updatedAttendance,
            date: req.formatWIB(updatedAttendance.date, "yyyy-MM-dd"),
            checkInTime: updatedAttendance.checkInTime
                ? req.formatWIB(updatedAttendance.checkInTime, "HH:mm:ss")
                : null,
            checkOutTime: updatedAttendance.checkOutTime
                ? req.formatWIB(updatedAttendance.checkOutTime, "HH:mm:ss")
                : null,
            createdAt: req.formatWIB(updatedAttendance.createdAt),
            updatedAt: req.formatWIB(updatedAttendance.updatedAt),
        };

        res.status(200).json({
            message: "Data absensi berhasil diperbarui",
            data: responseData,
        });
    } catch (err: any) {
        console.error("Error updateAttendance:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat memperbarui absensi",
        });
    }
}

// Fungsi menampilkan detail attendance berdasarkan id
export async function getAttendanceById(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;
        const attendanceId = Number(req.params.id);

        if (!attendanceId) {
            return res.status(400).json({ message: "Attendance ID tidak valid" });
        }

        // Ambil user
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: {
                company: true,
                ownedCompanies: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        let companyId: number | null = null;
        if (role === "ADMIN") {
            if (user.ownedCompanies.length > 0) {
                companyId = user.ownedCompanies[0].id;
            } else if (user.companyId) {
                companyId = user.companyId;
            }
        }

        // Ambil data attendance
        const attendance = await prisma.attendance.findFirst({
            where: {
                id: attendanceId,
                deletedAt: null
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        userId: true,
                        fullName: true,
                        employeeCode: true,
                        companyId: true,
                        company: {
                            select: {
                                companyName: true,
                                latitude: true,
                                longitude: true,
                                radius: true
                            }
                        },
                        scheduleGroup: { select: { nameOfShift: true } }
                    }
                },
                workSchedule: {
                    select: {
                        dayOfWeek: true,
                        startTime: true,
                        breakStart: true,
                        endTime: true
                    }
                }
            }
        });

        if (!attendance) {
            return res.status(404).json({ message: "Data absensi tidak ditemukan" });
        }

        // Validasi akses
        if (role === "EMPLOYEE" && attendance.employee.userId !== userId) {
            return res.status(403).json({ message: "Anda tidak memiliki akses ke data ini" });
        }

        if (role === "ADMIN" && attendance.employee.companyId !== companyId) {
            return res.status(403).json({
                message: "Anda tidak memiliki akses ke absensi dari perusahaan lain"
            });
        }

        // Hitung distance jika tipe kerja WFO & ada lat long pada absensi
        let distanceFromOffice: number | null = null;

        if (
            attendance.workType === "WFO" &&
            attendance.latitude &&
            attendance.longitude &&
            attendance.employee.company.latitude &&
            attendance.employee.company.longitude
        ) {
            distanceFromOffice = formatDistance (
                calculateDistance(
                    Number(attendance.latitude),
                    Number(attendance.longitude),
                    Number(attendance.employee.company.latitude),
                    Number(attendance.employee.company.longitude)
                )
            );
        }

        // Format WIB
        const result = {
            ...attendance,
            date: req.formatWIB(req.fromUTCToWIB(attendance.date), "yyyy-MM-dd"),
            checkInTime: attendance.checkInTime
                ? req.formatWIB(req.fromUTCToWIB(attendance.checkInTime), "HH:mm:ss")
                : null,
            checkOutTime: attendance.checkOutTime
                ? req.formatWIB(req.fromUTCToWIB(attendance.checkOutTime), "HH:mm:ss")
                : null,
            createdAt: req.formatWIB(req.fromUTCToWIB(attendance.createdAt)),
            updatedAt: attendance.updatedAt
                ? req.formatWIB(req.fromUTCToWIB(attendance.updatedAt))
                : null,

            hasProof: !!attendance.proof,
            isLate: attendance.attendanceStatus === "LATE",

            distanceFromOffice
        };

        res.status(200).json({
            message: "Detail absensi berhasil diambil",
            data: result
        });

    } catch (err: any) {
        console.error("Error getAttendanceById:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat mengambil detail absensi"
        });
    }
}

// Fungsi menghapus data attendance, hanya bisa dilakukan ketika status approval masih PENDING (kecuali superadmin)
export async function deleteAttendance(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const userId = user.id;
        const role = user.role;

        const attendanceId = Number(req.params.id);

        if (isNaN(attendanceId)) {
            return res.status(400).json({ message: "ID tidak valid" });
        }

        // Ambil data attendance
        const attendance = await prisma.attendance.findFirst({
            where: { id: attendanceId, deletedAt: null },
            include: {
                employee: {
                    include: {
                        company: true
                    }
                }
            }
        });

        if (!attendance) {
            return res.status(404).json({ message: "Data absensi tidak ditemukan" });
        }

        // EMPLOYEE hanya bisa hapus absensinya sendiri
        if (role === "EMPLOYEE") {
            if (attendance.employee.userId !== userId) {
                return res.status(403).json({ message: "Tidak boleh menghapus absensi milik orang lain" });
            }

            if (attendance.approvalStatus !== "PENDING") {
                return res.status(400).json({
                    message: "Absensi sudah diproses dan tidak dapat dihapus"
                });
            }
        }

        // ADMIN hanya boleh hapus untuk company miliknya
        if (role === "ADMIN") {
            // ambil companyId
            const currentUser = await prisma.user.findFirst({
                where: { id: userId, deletedAt: null },
                include: { ownedCompanies: true }
            });

            let adminCompanyId: number | null = null;
            if (currentUser) {
                if (currentUser.ownedCompanies && currentUser.ownedCompanies.length > 0) {
                    adminCompanyId = currentUser.ownedCompanies[0].id;
                } else if ((currentUser as any).companyId) {
                    adminCompanyId = (currentUser as any).companyId;
                }
            }

            if (!adminCompanyId || attendance.employee.companyId !== adminCompanyId) {
                return res.status(403).json({ message: "Tidak dapat menghapus absensi employee perusahaan lain" });
            }

            if (attendance.approvalStatus !== "PENDING") {
                return res.status(400).json({
                    message: "Absensi sudah diproses dan tidak dapat dihapus"
                });
            }
        }

        // Soft delete
        await prisma.attendance.update({
            where: { id: attendanceId },
            data: {
                deletedAt: new Date()
            }
        });

        return res.status(200).json({
            message: "Absensi berhasil dihapus (soft delete)"
        });

    } catch (err: any) {
        console.error("Error deleteAttendance:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat menghapus absensi"
        });
    }
}

// Fungsi untuk menampilkan data di dashboard admin
export async function getAdminDashboard(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;

        if (role !== "ADMIN" && role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Ambil company admin
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Tentukan companyId admin
        let companyId: number | null = null;
        if (user.ownedCompanies.length > 0) {
            companyId = user.ownedCompanies[0].id;
        } else if (user.companyId) {
            companyId = user.companyId;
        }

        if (!companyId) {
            return res.status(400).json({
                message: "Admin tidak memiliki akses ke perusahaan manapun"
            });
        }

        // 1. Total employees
        const employees = await prisma.employee.findMany({
            where: { companyId, deletedAt: null },
            include: {
                scheduleGroup: {
                    include: { workSchedules: true }
                }
            }
        });
        const totalEmployees = employees.length;

        // 2. Waktu hari ini (UTC date)
        const nowWIB = req.nowWIB;
        const todayString = req.formatWIB(nowWIB, "yyyy-MM-dd");
        const todayUTC = new Date(`${todayString}T00:00:00.000Z`);
        const todayDay = req.todayWIB.toUpperCase(); // contoh: "MONDAY"

        // 3. Attendance hari ini
        const todaysAttendance = await prisma.attendance.findMany({
            where: {
                date: todayUTC,
                deletedAt: null,
                employee: { companyId }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeCode: true
                    }
                }
            }
        });

        // untuk cetak card entry
        const employeeDataEntry = todaysAttendance.map(a => ({
            fullName: a.employee.fullName,
            employeeCode: a.employee.employeeCode,
            status: a.attendanceStatus,
            checkInTime: a.checkInTime
                ? req.formatWIB(a.checkInTime, "HH:mm")
                : null
        }));

        // 4. Hitung ontime & late
        const onTime = todaysAttendance.filter(a => a.attendanceStatus === "ONTIME").length;
        const late = todaysAttendance.filter(a => a.attendanceStatus === "LATE").length;

        // 5. Leave hari ini
        const todaysLeaves = await prisma.leaveRequest.findMany({
            where: {
                deletedAt: null,
                status: "APPROVED",
                startDate: { lte: todayUTC },
                endDate: { gte: todayUTC },
                employee: { companyId }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeCode: true
                    }
                }
            }
        });

        const leave = todaysLeaves.length;

        // 6. Hitung Alpha berdasarkan schedule perusahaan
        const attendedIds = new Set(todaysAttendance.map(a => a.employeeId));
        const leaveIds = new Set(todaysLeaves.map(l => l.employeeId));

        const alphaEmployees = employees.filter(emp => {
            // harus punya jadwal kerja hari ini
            const hasWorkToday =
                emp.scheduleGroup?.workSchedules?.some(
                    ws => ws.dayOfWeek.toUpperCase() === todayDay
                );

            if (!hasWorkToday) return false;       // hari libur = bukan alpha
            if (attendedIds.has(emp.id)) return false; // sudah absen = bukan alpha
            if (leaveIds.has(emp.id)) return false;    // sedang leave = bukan alpha

            return true; // sisanya = alpha
        });

        const alpha = alphaEmployees.length;

        // 7. Response
        res.status(200).json({
            message: "Dashboard admin berhasil diambil",
            summary: {
                totalEmployees,
                onTime,
                late,
                leave,
                alpha
            },
            lists: {
                employeeDataEntry,    // untuk card Entry
                onTime: todaysAttendance
                    .filter(a => a.attendanceStatus === "ONTIME")
                    .slice(0, 5),
                late: todaysAttendance
                    .filter(a => a.attendanceStatus === "LATE")
                    .slice(0, 5),
                leave: todaysLeaves.slice(0, 5),
                alpha: alphaEmployees.slice(0, 5)
            }
        });

    } catch (err: any) {
        console.error("Error getAdminDashboard:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat mengambil dashboard admin"
        });
    }
}

// Fungsi untuk menampilkan data di dashboard employee
export async function getEmployeeDashboard(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;

        if (role !== "EMPLOYEE") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // 1. Ambil data employee + schedule group
        const employee = await prisma.employee.findFirst({
            where: { userId, deletedAt: null },
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

        if (!employee) {
            return res.status(404).json({ message: "Employee tidak ditemukan" });
        }

        const schedule = employee.scheduleGroup?.workSchedules || [];
        const workDaysUpper = schedule.map(s => s.dayOfWeek.toUpperCase());

        // 2. Tentukan bulan berjalan
        const nowWIB = req.nowWIB;
        const month = Number(req.query.month) || nowWIB.getMonth() + 1;
        const year = Number(req.query.year) || nowWIB.getFullYear();

        const startOfMonthUTC = new Date(Date.UTC(year, month - 1, 1));

        // END DATE = Hari ini (jika bulan ini) atau akhir bulan (jika bulan lain)
        let endDateUTC: Date;

        // jika bulan yang dipilih adalah bulan sekarang
        if (month === nowWIB.getMonth() + 1 && year === nowWIB.getFullYear()) {
            const todayWIBString = req.formatWIB(nowWIB, "yyyy-MM-dd");
            endDateUTC = new Date(`${todayWIBString}T00:00:00.000Z`);
        } else {
            // bulan yang dipilih bukan bulan sekarang = end of selected month
            endDateUTC = new Date(Date.UTC(year, month, 0)); 
        }

        // Helper: Hitung hari kerja (weekday berdasarkan work schedule)
        function countWorkingDays(startUTC: Date, endUTC: Date): number {
            let count = 0;
            const cur = new Date(startUTC);

            while (cur <= endUTC) {
                const curWIB = req.fromUTCToWIB(cur);
                const dayName = req.formatWIB(curWIB, "EEEE").toUpperCase();

                if (workDaysUpper.includes(dayName)) {
                    count++;
                }
                cur.setUTCDate(cur.getUTCDate() + 1);
            }
            return count;
        }

        // 3. Total hari kerja sampai hari ini
        const totalWorkingDays = countWorkingDays(startOfMonthUTC, endDateUTC);

        // 4. Ambil attendance bulan berjalan
        const attendances = await prisma.attendance.findMany({
            where: {
                employeeId: employee.id,
                deletedAt: null,
                date: {
                    gte: startOfMonthUTC,
                    lte: endDateUTC
                }
            }
        });

        let onTime = 0;
        let late = 0;
        let alpha = 0;

        attendances.forEach(a => {
            if (a.attendanceStatus === "ONTIME") onTime++;
            else if (a.attendanceStatus === "LATE") late++;
            else if (a.attendanceStatus === "ALPHA") alpha++;
        });

        const totalPresent = onTime + late;

        // 5. Ambil leave request bulan ini (APPROVED)
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                employeeId: employee.id,
                deletedAt: null,
                status: "APPROVED",
                OR: [
                    { startDate: { gte: startOfMonthUTC, lte: endDateUTC } },
                    { endDate: { gte: startOfMonthUTC, lte: endDateUTC } },
                    {
                        startDate: { lte: startOfMonthUTC },
                        endDate: { gte: endDateUTC }
                    }
                ]
            },
            include: {
                employee: true
            }
        });

        // 6. Hitung hanya leave yang SUDAH TERJADI
        async function countLeaveDaysUntilToday(): Promise<number> {
            let total = 0;

            for (const lv of leaves) {
                const lvStart = new Date(lv.startDate);
                const lvEnd = new Date(lv.endDate);

                // batas maksimal leave dihitung sampai hari ini
                const effectiveEnd = lvEnd < endDateUTC ? lvEnd : endDateUTC;

                // pakai helper calculateTotalDays (hari kerja saja)
                const days = await calculateTotalDays(
                    lvStart,
                    effectiveEnd,
                    employee!.scheduleGroupId!
                );

                total += days;
            }

            return total;
        }

        const totalLeaveDays = await countLeaveDaysUntilToday();

        // 7. Hitung alpha
        const calculatedAlpha = totalWorkingDays - totalPresent - totalLeaveDays;
        if (calculatedAlpha > alpha) {
            alpha = calculatedAlpha; 
        }
        
        if (alpha < 0) alpha = 0;

        // 8. Hitung total jam kerja
        let totalSecondsWorked = 0;

        attendances.forEach(a => {
            if (a.checkInTime && a.checkOutTime) {
                const inWIB = req.fromUTCToWIB(a.checkInTime).getTime();
                const outWIB = req.fromUTCToWIB(a.checkOutTime).getTime();

                if (outWIB > inWIB) {
                    totalSecondsWorked += (outWIB - inWIB) / 1000;
                }
            }
        });

        const hours = Math.floor(totalSecondsWorked / 3600);
        const minutes = Math.floor((totalSecondsWorked % 3600) / 60);

        // 9. Grafik harian
        const workHoursDaily: any[] = [];

        attendances.forEach(a => {
            if (a.checkInTime && a.checkOutTime) {
                const inWIB = req.fromUTCToWIB(a.checkInTime).getTime();
                const outWIB = req.fromUTCToWIB(a.checkOutTime).getTime();

                const workedHours = ((outWIB - inWIB) / 1000) / 3600;

                workHoursDaily.push({
                    date: req.formatWIB(req.fromUTCToWIB(a.date), "dd MMM"),
                    hours: Number(workedHours.toFixed(2))
                });
            }
        });

        // Response
        res.status(200).json({
            message: "Dashboard employee berhasil diambil",
            summary: {
                totalWorkHours: `${hours}h ${minutes}m`,
                onTime,
                late,
                leave: totalLeaveDays,
                alpha
            },
            charts: {
                workHoursDaily
            }
        });

    } catch (err: any) {
        console.error("Error getEmployeeDashboard:", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan saat mengambil dashboard employee"
        });
    }
}

export async function createAttendanceByAdmin(req: Request, res: Response) {
    try {
      const {
        employeeId,
        date,
        checkInTime,
        checkOutTime,
        workType,
        attendanceStatus
      } = req.body;
  
      // 1. Validasi Employee
      const employee = await prisma.employee.findUnique({
        where: { id: Number(employeeId) },
        include: { company: true }
      });
  
      if (!employee) {
        return res.status(404).json({ message: "Employee tidak ditemukan" });
      }
  
      // 2. KONVERSI TANGGAL (FIX ERROR DISINI)
      // Pastikan jika string kosong dari frontend, diubah menjadi null
      const dateUTC = date ? new Date(date) : new Date();
      
      const checkInUTC = (checkInTime && checkInTime !== "" && checkInTime !== "Invalid Date") 
        ? new Date(checkInTime) 
        : null;
        
      const checkOutUTC = (checkOutTime && checkOutTime !== "" && checkOutTime !== "Invalid Date") 
        ? new Date(checkOutTime) 
        : null;
  
      // Tambahan: Validasi jika objek Date yang dihasilkan tidak valid
      if (isNaN(dateUTC.getTime())) {
        return res.status(400).json({ message: "Format tanggal tidak valid" });
      }
  
      // ... (Logika penentuan finalStatus tetap sama seperti kode lama Anda)
      let finalStatus = attendanceStatus || "ONTIME";
  
      // 10. Save Attendance ke Prisma
      const attendance = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: dateUTC,
          checkInTime: checkInUTC, // Sekarang aman, bisa bernilai null
          checkOutTime: checkOutUTC, // Sekarang aman, bisa bernilai null
          workType: workType?.toUpperCase() || "WFO",
          latitude: null, // Admin input biasanya manual tanpa koordinat
          longitude: null,
          locationStatus: null,
          attendanceStatus: finalStatus,
          approvalStatus: "APPROVED"
        }
      });
  
      return res.status(201).json({
        message: "Attendance berhasil ditambahkan oleh admin",
        data: attendance
      });
  
    } catch (error: any) {
      console.error("createAttendanceByAdmin ERROR:", error);
      return res.status(500).json({ message: error.message });
    }
  }