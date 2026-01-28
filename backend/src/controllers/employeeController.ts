import { Request, Response } from "express";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const JWT_SECRET = process.env.JWT_SECRET as string;


// Helper: Generate Employee Code - FIXED VERSION
async function generateEmployeeCode(companyId: number, date: Date, tx?: any) {
    const prismaClient = tx || prisma;
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const datePart = `${day}${month}${year}`;

    // ✅ Cari employee code terakhir untuk hari ini (termasuk soft-deleted)
    const lastEmployee = await prismaClient.employee.findFirst({
        where: {
            companyId,
            employeeCode: {
                startsWith: `EMP-C${companyId}-${datePart}`
            }
        },
        orderBy: {
            employeeCode: 'desc'
        }
    });

    let sequence = 1;
    if (lastEmployee) {
        // Extract sequence dari employee code terakhir
        const lastCode = lastEmployee.employeeCode;
        const lastSequence = lastCode.slice(-4); // Ambil 4 digit terakhir
        sequence = parseInt(lastSequence, 10) + 1;
    }

    const sequenceStr = String(sequence).padStart(4, "0");
    return `EMP-C${companyId}-${datePart}${sequenceStr}`;
}

// Create Employee
export async function createEmployee(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const {
            name,
            email,
            password,
            fullName,
            nik,
            gender,
            mobileNumber,
            address,
            position,
            department,
            hireDate,
            dateOfBirth,       
            promotionHistory,
            scheduleGroupId,
        } = req.body;

        const photoFile = req.file ? req.file.filename : null;

        // Validasi input required
        if (!name || !email || !password || !fullName || !nik) {
            return res.status(400).json({ 
                message: "Name, email, password, fullName, dan nik wajib diisi" 
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
                message: "User is not linked with any company" 
            });
        }

        // Cek email sudah ada atau belum pada company yang sama - INCLUDE SOFT DELETED
        const existingUser = await prisma.user.findFirst({
            where: { 
                email: email.trim().toLowerCase(),
                companyId: companyId,
            },
        });

        // Cek nik sudah ada atau belum pada company yang sama - INCLUDE SOFT DELETED
        const existingEmployeeWithNIK = await prisma.employee.findFirst({
            where: { 
                nik: nik.trim(),
                companyId: companyId,
            },
        });

        // Handle existing active data
        if (existingUser && existingUser.deletedAt === null) {
            return res.status(409).json({ 
                message: "Email sudah terdaftar" 
            });
        }

        if (existingEmployeeWithNIK && existingEmployeeWithNIK.deletedAt === null) {
            return res.status(409).json({ 
                message: "NIK sudah terdaftar untuk employee lain" 
            });
        }

        // Validasi scheduleGroupId jika diisi
        if (scheduleGroupId) {
            const scheduleGroup = await prisma.scheduleGroup.findFirst({
                where: { 
                    id: Number(scheduleGroupId), 
                    companyId,
                    deletedAt: null 
                }
            });

            if (!scheduleGroup) {
                return res.status(404).json({ 
                    message: "Schedule Group tidak ditemukan atau bukan milik company Anda" 
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Jika ada data soft deleted, restore mereka
        if ((existingUser && existingUser.deletedAt !== null) || (existingEmployeeWithNIK && existingEmployeeWithNIK.deletedAt !== null)) {
            const result = await prisma.$transaction(async (tx) => {
                let userToUse;
                let employeeToUse;

                // Restore atau create user
                if (existingUser && existingUser.deletedAt !== null) {
                    userToUse = await tx.user.update({
                        where: { id: existingUser.id },
                        data: {
                            name,
                            email,
                            password: hashedPassword,
                            role: "EMPLOYEE",
                            companyId,
                            deletedAt: null,
                            updatedAt: new Date(),
                        },
                    });
                } else {
                    userToUse = await tx.user.create({
                        data: {
                            name,
                            email,
                            password: hashedPassword,
                            role: "EMPLOYEE",
                            companyId,
                        },
                    });
                }

                // Restore atau create employee
                if (existingEmployeeWithNIK && existingEmployeeWithNIK.deletedAt !== null) {
                    // Generate employee code baru dalam transaction
                    const employeeCode = await generateEmployeeCode(companyId!, new Date(), tx);
                    
                    employeeToUse = await tx.employee.update({
                        where: { id: existingEmployeeWithNIK.id },
                        data: {
                            userId: userToUse.id,
                            companyId,
                            employeeCode,
                            fullName,
                            nik,
                            gender,
                            mobileNumber,
                            address,
                            position,
                            department,
                            hireDate: new Date(hireDate),
                            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                            promotionHistory: promotionHistory || null,
                            scheduleGroupId: scheduleGroupId ? Number(scheduleGroupId) : null,
                            status: "ACTIVE",
                            photo: photoFile,
                            deletedAt: null,
                            updatedAt: new Date(),
                        },
                    });
                } else {
                    // Generate employee code baru dalam transaction
                    const employeeCode = await generateEmployeeCode(companyId!, new Date(), tx);
                    
                    employeeToUse = await tx.employee.create({
                        data: {
                            userId: userToUse.id,
                            companyId,
                            employeeCode,
                            fullName,
                            nik,
                            gender,
                            mobileNumber,
                            address,
                            position,
                            department,
                            hireDate: new Date(hireDate),
                            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                            promotionHistory: promotionHistory || null,
                            scheduleGroupId: scheduleGroupId ? Number(scheduleGroupId) : null,
                            status: "ACTIVE",
                            photo: photoFile,
                        },
                    });
                }

                return { newUser: userToUse, employee: employeeToUse };
            });

            return res.status(201).json({ 
                message: "Employee created successfully (auto-restored)", 
                data: result 
            });
        }

        // Create new employee (no existing soft deleted data found)
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: "EMPLOYEE",
                    companyId,
                },
            });

            // Generate employee code baru dalam transaction
            const employeeCode = await generateEmployeeCode(companyId!, new Date(), tx);

            const employee = await tx.employee.create({
                data: {
                    userId: newUser.id,
                    companyId,
                    employeeCode,
                    fullName,
                    nik,
                    gender,
                    mobileNumber,
                    address,
                    position,
                    department,
                    hireDate: new Date(hireDate),
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                    promotionHistory: promotionHistory || null,
                    scheduleGroupId: scheduleGroupId ? Number(scheduleGroupId) : null,
                    status: "ACTIVE",
                    photo: photoFile,
                },
            });

            return { newUser, employee };
        });

        res.status(201).json({ 
            message: "Employee created successfully", 
            data: result 
        });
    } catch (err: any) {
        console.error("Error createEmployee:", err);
        
        // Handle unique constraint error dari database
        if (err.code === 'P2002') {
            const target = err.meta?.target;
            if (target && target.includes('email')) {
                return res.status(409).json({ 
                    message: "Email sudah terdaftar" 
                });
            }
            if (target && target.includes('nik')) {
                return res.status(409).json({ 
                    message: "NIK sudah terdaftar untuk employee lain" 
                });
            }
            if (target && target.includes('employee_code')) {
                return res.status(409).json({ 
                    message: "Employee code conflict. Please try again." 
                });
            }
        }
        
        res.status(500).json({ 
            message: err.message || "Error creating employee" 
        });
    }
}

// Get Employee Profile
export async function getEmployeeProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const employee = await prisma.employee.findFirst({
            where: { userId, deletedAt: null },
            include: {
                company: true,
                user: { select: { id: true, name: true, email: true, role: true } },
                scheduleGroup: { // include scheduleGroup
                    include: {
                        workSchedules: {
                            where: { deletedAt: null },
                            orderBy: { dayOfWeek: 'asc' }
                        }
                    }
                }
            },
        });

        if (!employee) {
        return res.status(404).json({ 
            status: false, 
            message: "Employee not found" 
        });
        }

        return res.status(200).json({ status: true, employee });
    } catch (err) {
        console.error("Error getEmployeeProfile:", err);
        res.status(500).json({ message: "Error fetching profile" });
    }
}

// Get Employees (admin / superadmin only)
export async function getEmployees(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        
        // Get query parameters untuk filter & pagination
        const {
            page = 1,
            limit = 10,
            search = "",
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Base where condition
        let whereCondition: any = { deletedAt: null };
        
        // Filter berdasarkan role
        // superadmin bisa lihat semua data employee dari semua company
        if (user.role === "ADMIN") {
            let adminCompanyId: number | null = null;
            if (user.ownedCompanies.length > 0) {
                adminCompanyId = user.ownedCompanies[0].id;
            } else if (user.companyId) {
                adminCompanyId = user.companyId;
            }
            if (!adminCompanyId) {
                return res.status(400).json({ 
                    message: "Admin tidak terkait dengan perusahaan manapun" 
                });
            }
            whereCondition.companyId = adminCompanyId;
        }

        // Kolom-kolom untuk pencarian
        if (search) {
            whereCondition.OR = [
                // Data utama tabel employee
                { fullName: { contains: search, mode: 'insensitive' } },
                { employeeCode: { contains: search, mode: 'insensitive' } },
                { position: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
                
                // Data company (untuk multi-company superadmin)
                { company: { companyName: { contains: search, mode: 'insensitive' } } },
                
                // Data user (email untuk kontak)
                { user: { email: { contains: search, mode: 'insensitive' } } },

                // Data schedule group
                { scheduleGroup: { nameOfShift: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // Validasi sort field
        const allowedSortFields = ['createdAt', 'updatedAt', 'fullName', 'employeeCode', 'hireDate', 'position'];
        const finalSortBy = allowedSortFields.includes(sortBy as string) 
            ? sortBy as string 
            : 'createdAt';

        // Hitung total data
        const totalEmployees = await prisma.employee.count({
            where: whereCondition
        });

        // Get data dengan pagination
        const employees = await prisma.employee.findMany({
            where: whereCondition,
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        logo: true
                    }
                },
                user: { 
                    select: { 
                        id: true, 
                        name: true, 
                        email: true, 
                        role: true 
                    } 
                },
                scheduleGroup: { // include scheduleGroup
                    select: {
                        id: true,
                        nameOfShift: true
                    }
                },
            },
            orderBy: { [finalSortBy]: sortOrder },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
        });

        res.status(200).json({ 
            message: "Success", 
            data: employees,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalEmployees / Number(limit)),
                totalItems: totalEmployees,
                itemsPerPage: Number(limit),
                hasNextPage: Number(page) < Math.ceil(totalEmployees / Number(limit)),
                hasPrevPage: Number(page) > 1
            }
        });
    } catch (err) {
        console.error("Error getEmployees:", err);
        res.status(500).json({ message: "Error fetching employees" });
    }
}

// Get Employee By ID
export async function getEmployeeById(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const employeeId = Number(req.params.id);

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let employee;

        if (user.role === "SUPERADMIN") {
            employee = await prisma.employee.findFirst({
                where: { id: employeeId, deletedAt: null },
                include: {
                    company: true,
                    user: { select: { id: true, name: true, email: true, role: true } },
                    scheduleGroup: { // include scheduleGroup dengan workSchedules
                        include: {
                            workSchedules: {
                                where: { deletedAt: null },
                                orderBy: { dayOfWeek: 'asc' }
                            }
                        }
                    }
                },
            });
        } else if (user.role === "ADMIN") {
            let companyId: number | null = null;
            if (user.ownedCompanies.length > 0) {
                companyId = user.ownedCompanies[0].id;
            } else if (user.companyId) {
                companyId = user.companyId;
            }

            if (!companyId) {
                return res.status(400).json({ 
                message: "Admin tidak terkait dengan perusahaan manapun" 
                });
            }

            employee = await prisma.employee.findFirst({
                where: { id: employeeId, companyId, deletedAt: null },
                include: {
                    company: true,
                    user: { select: { id: true, name: true, email: true, role: true } },
                    scheduleGroup: { // include scheduleGroup dengan workSchedules
                        include: {
                            workSchedules: {
                                where: { deletedAt: null },
                                orderBy: { dayOfWeek: 'asc' }
                            }
                        }
                    }
                },
            });
        } else {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ message: "Success", data: employee });
    } catch (err) {
        console.error("Error getEmployeeById:", err);
        res.status(500).json({ message: "Error fetching employee" });
    }
}

// Update Employee
export async function updateEmployee(req: Request, res: Response) {
    const { id } = req.params; // id bisa dari params (untuk admin/superadmin) atau dari token
    const data = req.body;
    const file = req.file;

    try {
        const currentUser = (req as any).user;

        // Tentukan employeeId yang akan diupdate
        let employeeIdToUpdate: number;

        // Jika user adalah ADMIN atau SUPERADMIN dan ada id di params, gunakan params id
        if ((currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN") && id) {
            employeeIdToUpdate = Number(id);
        } 
        // Jika user adalah EMPLOYEE, gunakan employee id dari token (ignore params id)
        else if (currentUser.role === "EMPLOYEE") {
            // Cari employee berdasarkan userId dari token
            const employeeFromToken = await prisma.employee.findFirst({
                where: { 
                    userId: currentUser.id,
                    deletedAt: null 
                }
            });

            if (!employeeFromToken) {
                return res.status(404).json({ message: "Employee profile not found" });
            }

            employeeIdToUpdate = employeeFromToken.id;
        } else {
            return res.status(403).json({ message: "Unauthorized role" });
        }

        // Dapatkan data employee yang akan diupdate
        const employee = await prisma.employee.findUnique({
            where: { id: employeeIdToUpdate },
            include: { user: true, company: true },
        });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        if (employee.deletedAt) {
            return res.status(410).json({ message: "Employee has been deleted" });
        }

        // Validasi companyId untuk ADMIN (SUPERADMIN bisa bypass)
        if (currentUser.role === "ADMIN") {
            // Dapatkan data user lengkap untuk admin
            const adminUser = await prisma.user.findFirst({
                where: { id: currentUser.id, deletedAt: null },
                include: { company: true, ownedCompanies: true },
            });

            if (!adminUser) {
                return res.status(404).json({ message: "Admin user not found" });
            }

            let adminCompanyId: number | null = null;
            
            // Cari companyId dari ownedCompanies atau companyId langsung
            if (adminUser.ownedCompanies.length > 0) {
                adminCompanyId = adminUser.ownedCompanies[0].id;
            } else if (adminUser.companyId) {
                adminCompanyId = adminUser.companyId;
            }

            if (!adminCompanyId) {
                return res.status(400).json({ 
                    message: "Admin tidak terkait dengan perusahaan manapun" 
                });
            }

            console.log('Admin Company ID:', adminCompanyId);
            console.log('Employee Company ID:', employee.companyId);
            
            // Validasi companyId
            if (employee.companyId !== adminCompanyId) {
                return res.status(403).json({ 
                    message: "Forbidden: You can only update employees from your own company" 
                });
            }
        }

        // Validasi untuk EMPLOYEE: hanya bisa update profil sendiri
        if (currentUser.role === "EMPLOYEE") {
            if (currentUser.id !== employee.userId) {
                return res.status(403).json({ 
                    message: "Forbidden: You can only update your own profile" 
                });
            }
        }

        // Validasi scheduleGroupId jika diisi (hanya untuk ADMIN/SUPERADMIN)
        if (data.scheduleGroupId && (currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN")) {
            const scheduleGroup = await prisma.scheduleGroup.findFirst({
                where: { 
                    id: Number(data.scheduleGroupId),
                    companyId: employee.companyId,
                    deletedAt: null 
                },
            });

            if (!scheduleGroup) {
                return res.status(400).json({ 
                    message: "Schedule group tidak ditemukan atau tidak sesuai dengan company" 
                });
            }
        }

        let updateUserData: any = {};
        let updateEmployeeData: any = {};

        // ADMIN / SUPERADMIN - bisa update semua field
        if (currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN") {
            if (data.name || data.email) {
                updateUserData = {
                    ...(data.name && { name: data.name }),
                    ...(data.email && { email: data.email }),
                };
            }

            updateEmployeeData = {
                ...(data.fullName && { fullName: data.fullName }),
                ...(data.nik && { nik: data.nik }),
                ...(data.gender && { gender: data.gender }),
                ...(data.mobileNumber && { mobileNumber: data.mobileNumber }),
                ...(data.address && { address: data.address }),
                ...(data.position && { position: data.position }),
                ...(data.department && { department: data.department }),
                ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
                ...(data.status && { status: data.status }),
                ...(data.promotionHistory && { promotionHistory: data.promotionHistory }),
                ...(data.scheduleGroupId && { scheduleGroupId: Number(data.scheduleGroupId) }),
                ...(file && { photo: file.filename }),
            };

            // Handle null scheduleGroupId (untuk menghapus relasi)
            if (data.scheduleGroupId === '' || data.scheduleGroupId === null) {
                updateEmployeeData.scheduleGroupId = null;
            }
        } 
        
        // EMPLOYEE - hanya bisa update field tertentu
        else if (currentUser.role === "EMPLOYEE") {
            updateEmployeeData = {
                ...(data.fullName && { fullName: data.fullName }),
                ...(data.mobileNumber && { mobileNumber: data.mobileNumber }),
                ...(data.address && { address: data.address }),
                ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
                ...(file && { photo: file.filename }),
            };

            // Validasi: employee tidak boleh update field tertentu
            const forbiddenFields = [
                'name', 'email', 'nik', 'gender', 'position', 
                'department', 'status', 'promotionHistory', 'scheduleGroupId'
            ];
            
            const attemptedForbiddenUpdate = forbiddenFields.some(field => data[field] !== undefined);
            if (attemptedForbiddenUpdate) {
                return res.status(403).json({ 
                    message: "Forbidden: You cannot update these fields" 
                });
            }
        }

        if (Object.keys(updateUserData).length === 0 && 
            Object.keys(updateEmployeeData).length === 0) {
            return res.status(400).json({ message: "No data to update" });
        }

        const updated = await prisma.$transaction(async (tx) => {
            if (Object.keys(updateUserData).length > 0) {
                if (updateUserData.email) {
                    const existingEmail = await tx.user.findFirst({
                        where: { 
                            email: updateUserData.email, 
                            id: { not: employee.userId },
                            deletedAt: null 
                        },
                    });
                    
                    if (existingEmail) {
                        throw new Error("Email already exists");
                    }
                }

                await tx.user.update({
                    where: { id: employee.userId },
                    data: updateUserData,
                });
            }

            const updatedEmployee = await tx.employee.update({
                where: { id: employee.id },
                data: updateEmployeeData,
                include: { 
                    user: { select: { id: true, name: true, email: true, role: true } },
                    company: true,
                    scheduleGroup: {
                        select: {
                            id: true,
                            nameOfShift: true
                        }
                    }
                },
            });

            return updatedEmployee;
        });

        res.status(200).json({ 
            message: "Employee updated successfully", 
            employee: updated 
        });
    } catch (err: any) {
        console.error("Error updateEmployee:", err);
        
        if (err.message === "Email already exists") {
            return res.status(409).json({ message: "Email already exists" });
        }
        
        res.status(500).json({ message: "Error updating employee" });
    }
}

// Soft Delete Employee
export async function deleteEmployee(req: Request, res: Response) {
    const { id } = req.params;

    try {
        const currentUser = (req as any).user;

        if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: Number(id) },
            include: { user: true, company: true },
        });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        if (employee.deletedAt) {
            return res.status(410).json({ message: "Employee already deleted" });
        }

        // Validasi companyId untuk ADMIN (SUPERADMIN bisa bypass)
        if (currentUser.role === "ADMIN") {
            // Dapatkan data user lengkap untuk admin
            const adminUser = await prisma.user.findFirst({
                where: { id: currentUser.id, deletedAt: null },
                include: { company: true, ownedCompanies: true },
            });

            if (!adminUser) {
                return res.status(404).json({ message: "Admin user not found" });
            }

            let adminCompanyId: number | null = null;
            
            // Cari companyId dari ownedCompanies atau companyId langsung
            if (adminUser.ownedCompanies.length > 0) {
                adminCompanyId = adminUser.ownedCompanies[0].id;
            } else if (adminUser.companyId) {
                adminCompanyId = adminUser.companyId;
            }

            if (!adminCompanyId) {
                return res.status(400).json({ 
                    message: "Admin tidak terkait dengan perusahaan manapun" 
                });
            }

            console.log('Admin Company ID:', adminCompanyId);
            console.log('Employee Company ID:', employee.companyId);
            
            // Validasi companyId
            if (employee.companyId !== adminCompanyId) {
                return res.status(403).json({ 
                    message: "Forbidden: You can only delete employees from your own company" 
                });
            }
        }

        if (currentUser.id === employee.userId) {
            return res.status(400).json({ 
                message: "You cannot delete your own account" 
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.employee.update({
                where: { id: employee.id },
                data: { deletedAt: new Date() },
            });

            await tx.user.update({
                where: { id: employee.userId },
                data: { deletedAt: new Date() },
            });
        });

        res.status(200).json({ 
            message: "Employee deleted successfully (soft delete)",
            deletedAt: new Date()
        });
    } catch (err) {
        console.error("Error deleteEmployee:", err);
        res.status(500).json({ message: "Error deleting employee" });
    }
}

// Restore Employee (Undo Soft Delete)
export async function restoreEmployee(req: Request, res: Response) {
    const { id } = req.params;

    try {
        const currentUser = (req as any).user;

        if (currentUser.role !== "SUPERADMIN") {
            return res.status(403).json({ 
                message: "Unauthorized. Only SUPERADMIN can restore employees" 
            });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: Number(id) },
            include: { user: true },
        });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        if (!employee.deletedAt) {
            return res.status(400).json({ message: "Employee is not deleted" });
        }

        await prisma.$transaction(async (tx) => {
        await tx.employee.update({
            where: { id: employee.id },
            data: { deletedAt: null },
        });

        await tx.user.update({
            where: { id: employee.userId },
            data: { deletedAt: null },
        });
        });

        res.status(200).json({ 
            message: "Employee restored successfully",
            restoredAt: new Date()
        });
    } catch (err) {
        console.error("Error restoreEmployee:", err);
        res.status(500).json({ message: "Error restoring employee" });
    }
}

// Get Deleted Employees (Soft Deleted)
export async function getDeletedEmployees(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user) {
        return res.status(404).json({ message: "User not found" });
        }

        let employees;
        if (user.role === "SUPERADMIN") {
            employees = await prisma.employee.findMany({
                where: { deletedAt: { not: null } },
                include: {
                    company: true,
                    user: { select: { id: true, name: true, email: true, role: true } },
                    scheduleGroup: { // include scheduleGroup
                        select: {
                            id: true,
                            nameOfShift: true
                        }
                    }
                },
                orderBy: { deletedAt: "desc" },
            });
        } else if (user.role === "ADMIN") {
            let companyId: number | null = null;
            if (user.ownedCompanies.length > 0) {
                companyId = user.ownedCompanies[0].id;
            } else if (user.companyId) {
                companyId = user.companyId;
            }

            if (!companyId) {
                return res.status(400).json({ 
                message: "Admin tidak terkait dengan perusahaan manapun" 
                });
            }

            employees = await prisma.employee.findMany({
                where: { 
                    companyId, 
                    deletedAt: { not: null }
                },
                include: {
                    company: true,
                    user: { select: { id: true, name: true, email: true, role: true } },
                    scheduleGroup: { // include scheduleGroup
                        select: {
                            id: true,
                            nameOfShift: true
                        }
                    }
                },
                orderBy: { deletedAt: "desc" },
            });
        } else {
        return res.status(403).json({ message: "Unauthorized" });
        }

        res.status(200).json({ 
        message: "Success", 
        count: employees.length,
        data: employees 
        });
    } catch (err) {
        console.error("Error getDeletedEmployees:", err);
        res.status(500).json({ message: "Error fetching deleted employees" });
    }
}

// export data employee ke file csv
export async function exportEmployeesCsv(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        // cek role user
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let employees;
        let fileName = "employees.csv";

        if (user.role === "SUPERADMIN") {
            // superadmin >> semua employees
            employees = await prisma.employee.findMany({
                where: { deletedAt: null },
                include: { 
                    company: true, 
                    user: { select: { email: true } },
                    scheduleGroup: { // include scheduleGroup
                        select: {
                            id: true,
                            nameOfShift: true
                        }
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            fileName = "employees-all.csv";
        } else if (user.role === "ADMIN") {
            // cari companyId admin
            let companyId: number | null = null;
            let companyName: string | null = null;

            if (user.ownedCompanies.length > 0) {
                companyId = user.ownedCompanies[0].id;
                companyName = user.ownedCompanies[0].companyName;
            } else if (user.companyId && user.company) {
                companyId = user.companyId;
                companyName = user.company.companyName;
            }

            if (!companyId) {
                return res.status(400).json({ message: "Admin tidak terkait dengan perusahaan manapun" });
            }

            employees = await prisma.employee.findMany({
                where: { companyId, deletedAt: null },
                include: { 
                    company: true, 
                    user: { select: { email: true } },
                    scheduleGroup: { // include scheduleGroup
                        select: {
                            id: true,
                            nameOfShift: true
                        }
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            // generate nama file dengan nama company
            const safeCompanyName = companyName?.toLowerCase().replace(/\s+/g, "-") || "company";
            fileName = `employees-${safeCompanyName}.csv`;

        } else {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (!employees || employees.length === 0) {
            return res.status(404).json({ message: "No employees found" });
        }

        // mapping kolom sesuai schema
        const fields = [
            { label: "Employee Code", value: "employeeCode" },
            { label: "Full Name", value: "fullName" },
            { label: "Email", value: "user.email" },
            { label: "Date of Birth", value: (row: any) => row.dateOfBirth ? row.dateOfBirth.toISOString().split("T")[0] : "" },
            { label: "NIK", value: "nik" },
            { label: "Gender", value: "gender" },
            { label: "Mobile Number", value: "mobileNumber" },
            { label: "Address", value: "address" },
            { label: "Position", value: "position" },
            { label: "Department", value: "department" },
            { label: "Photo", value: "photo" },
            { label: "Hire Date", value: (row: any) => row.hireDate.toISOString().split("T")[0] },
            { label: "Status", value: "status" },
            { label: "Promotion History", value: "promotionHistory" },
            { label: "Schedule Group ID", value: (row: any) => row.scheduleGroup?.id || "" },
            { label: "Schedule Group Name", value: (row: any) => row.scheduleGroup?.nameOfShift || "" },
            { label: "Company ID", value: "company.id" },
            { label: "Company Name", value: "company.companyName" },
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(employees);

        // set header agar langsung download file CSV
        res.header("Content-Type", "text/csv");
        res.attachment(fileName);
        return res.send(csv);
    } catch (err) {
        console.error("Error exportEmployees:", err);
        res.status(500).json({ message: "Error exporting employees" });
    }
}

// import data employee dari file csv
export async function importEmployeesCsv(req: Request, res: Response) {
    let filePath: string | null = null;
    
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: { company: true, ownedCompanies: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // cari companyId
        let companyId: number | null = null;
        if (user.ownedCompanies.length > 0) {
            companyId = user.ownedCompanies[0].id;
        } else if (user.companyId) {
            companyId = user.companyId;
        }

        if (!companyId) {
            return res.status(400).json({ message: "User is not linked with any company" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "File CSV wajib diupload" });
        }

        filePath = req.file.path;
        const employeesData: any[] = [];

        // baca CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath!)
                .pipe(csv())
                .on("data", (row) => {
                    employeesData.push(row);
                })
                .on("end", resolve)
                .on("error", reject);
        });

        console.log("Data dari CSV:", employeesData);
        console.log("Jumlah data:", employeesData.length);

        if (employeesData.length === 0) {
            return res.status(400).json({ message: "File CSV kosong atau format tidak sesuai" });
        }

        const results = {
            created: [] as any[],
            restored: [] as any[],
            skipped: [] as any[],
            errors: [] as any[]
        };

        let processedCount = 0;

        for (const row of employeesData) {
            processedCount++;
            console.log(`Processing row ${processedCount}:`, row);

            const {
                name,
                email,
                password,
                fullName,
                nik,
                gender,
                mobileNumber,
                address,
                position,
                department,
                hireDate,
                dateOfBirth,
                promotionHistory,
                scheduleGroupId,
            } = row;

            // Validasi field required
            if (!name || !email || !fullName || !nik) {
                console.log(`Skipping row ${processedCount}: Missing required fields`, {
                    name, email, fullName, nik
                });
                results.skipped.push({
                    row: processedCount,
                    data: row,
                    reason: "Missing required fields (name, email, fullName, nik)"
                });
                continue;
            }

            try {
                // Validasi scheduleGroupId jika diisi
                if (scheduleGroupId) {
                    const scheduleGroup = await prisma.scheduleGroup.findFirst({
                        where: { 
                            id: Number(scheduleGroupId), 
                            companyId,
                            deletedAt: null 
                        }
                    });

                    if (!scheduleGroup) {
                        console.log(`Skipping row ${processedCount}: Schedule Group ID ${scheduleGroupId} tidak ditemukan`);
                        results.skipped.push({
                            row: processedCount,
                            data: row,
                            reason: `Schedule Group ID ${scheduleGroupId} tidak ditemukan`
                        });
                        continue;
                    }
                }

                // Cek existing data - INCLUDE SOFT DELETED
                const existingUser = await prisma.user.findFirst({
                    where: { 
                        email: email.trim().toLowerCase(),
                        companyId: companyId,
                    },
                });

                const existingEmployee = await prisma.employee.findFirst({
                    where: { 
                        nik: nik.trim(),
                        companyId: companyId,
                    },
                });

                // Skip jika kedua data (user dan employee) sudah aktif dan terhubung dengan benar
                if (existingUser && existingUser.deletedAt === null && 
                    existingEmployee && existingEmployee.deletedAt === null &&
                    existingUser.id === existingEmployee.userId) {
                    console.log(`Skipping row ${processedCount}: Data already exists and active - ${email}`);
                    results.skipped.push({
                        row: processedCount,
                        data: row,
                        reason: `Data already exists and active - ${email}`
                    });
                    continue;
                }

                // Handle existing active data conflicts
                if (existingUser && existingUser.deletedAt === null && existingEmployee && existingEmployee.deletedAt === null) {
                    if (existingUser.id !== existingEmployee.userId) {
                        console.log(`Skipping row ${processedCount}: Data conflict - User and Employee records don't match`);
                        results.skipped.push({
                            row: processedCount,
                            data: row,
                            reason: "Data conflict - User and Employee records don't match"
                        });
                        continue;
                    }
                }

                if (existingUser && existingUser.deletedAt === null && (!existingEmployee || existingEmployee.deletedAt !== null)) {
                    console.log(`Skipping row ${processedCount}: Email already exists - ${email}`);
                    results.skipped.push({
                        row: processedCount,
                        data: row,
                        reason: `Email already exists - ${email}`
                    });
                    continue;
                }

                if (existingEmployee && existingEmployee.deletedAt === null && (!existingUser || existingUser.deletedAt !== null)) {
                    console.log(`Skipping row ${processedCount}: NIK already exists - ${nik}`);
                    results.skipped.push({
                        row: processedCount,
                        data: row,
                        reason: `NIK already exists - ${nik}`
                    });
                    continue;
                }

                const hashedPassword = await bcrypt.hash(password || "12345678", 10);

                // Gunakan transaction individual untuk setiap employee
                const result = await prisma.$transaction(async (tx) => {
                    let userToUse;
                    let employeeToUse;

                    // Handle user - restore atau create
                    if (existingUser && existingUser.deletedAt !== null) {
                        // Restore user
                        userToUse = await tx.user.update({
                            where: { id: existingUser.id },
                            data: {
                                name: name.trim(),
                                email: email.trim().toLowerCase(),
                                password: hashedPassword,
                                role: "EMPLOYEE",
                                companyId,
                                deletedAt: null,
                                updatedAt: new Date(),
                            },
                        });
                        console.log(`Restored user: ${userToUse.email}`);
                    } else if (!existingUser) {
                        // Create new user
                        userToUse = await tx.user.create({
                            data: {
                                name: name.trim(),
                                email: email.trim().toLowerCase(),
                                password: hashedPassword,
                                role: "EMPLOYEE",
                                companyId,
                            },
                        });
                        console.log(`Created new user: ${userToUse.email}`);
                    } else {
                        // Use existing active user
                        userToUse = existingUser;
                        console.log(`Using existing active user: ${userToUse.email}`);
                    }

                    // Handle employee - restore atau create
                    if (existingEmployee && existingEmployee.deletedAt !== null) {
                        // Restore employee
                        const employeeCode = await generateEmployeeCode(companyId!, new Date());
                        
                        employeeToUse = await tx.employee.update({
                            where: { id: existingEmployee.id },
                            data: {
                                userId: userToUse.id,
                                companyId,
                                employeeCode,
                                fullName: fullName.trim(),
                                nik: nik ? nik.trim() : null,
                                gender: gender ? gender.trim().toUpperCase() : null,
                                mobileNumber: mobileNumber ? mobileNumber.trim() : null,
                                address: address ? address.trim() : null,
                                position: position ? position.trim() : null,
                                department: department ? department.trim() : null,
                                hireDate: hireDate ? new Date(hireDate) : new Date(),
                                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                                promotionHistory: promotionHistory ? promotionHistory.trim() : null,
                                scheduleGroupId: scheduleGroupId ? Number(scheduleGroupId) : null,
                                status: "ACTIVE",
                                deletedAt: null,
                                updatedAt: new Date(),
                            },
                        });
                        console.log(`Restored employee: ${employeeToUse.fullName}`);
                        
                        results.restored.push({
                            row: processedCount,
                            user: userToUse,
                            employee: employeeToUse,
                            action: "restored"
                        });
                    } else if (!existingEmployee) {
                        // Create new employee
                        const employeeCode = await generateEmployeeCode(companyId!, new Date());
                        
                        employeeToUse = await tx.employee.create({
                            data: {
                                userId: userToUse.id,
                                companyId,
                                employeeCode,
                                fullName: fullName.trim(),
                                nik: nik ? nik.trim() : null,
                                gender: gender ? gender.trim().toUpperCase() : null,
                                mobileNumber: mobileNumber ? mobileNumber.trim() : null,
                                address: address ? address.trim() : null,
                                position: position ? position.trim() : null,
                                department: department ? department.trim() : null,
                                hireDate: hireDate ? new Date(hireDate) : new Date(),
                                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                                promotionHistory: promotionHistory ? promotionHistory.trim() : null,
                                scheduleGroupId: scheduleGroupId ? Number(scheduleGroupId) : null,
                                status: "ACTIVE",
                            },
                        });
                        console.log(`Created new employee: ${employeeToUse.fullName}`);
                        
                        results.created.push({
                            row: processedCount,
                            user: userToUse,
                            employee: employeeToUse,
                            action: "created"
                        });
                    } else {
                        // Skip jika employee sudah aktif, jangan update
                        console.log(`Skipping row ${processedCount}: Employee already active - ${existingEmployee.nik}`);
                        return null;
                    }

                    return { user: userToUse, employee: employeeToUse };
                });

                // Jika result null, berarti row di-skip dalam transaction
                if (!result) {
                    results.skipped.push({
                        row: processedCount,
                        data: row,
                        reason: `Employee already active - ${nik}`
                    });
                    console.log(`Row ${processedCount} skipped: Employee already active`);
                    continue;
                }

                console.log(`Successfully processed employee: ${fullName}`);

            } catch (error: any) {
                console.error(`Error processing row ${processedCount}:`, error);
                
                // Handle unique constraint errors
                if (error.code === 'P2002') {
                    results.skipped.push({
                        row: processedCount,
                        data: row,
                        reason: `Database constraint error: ${error.meta?.target || 'unknown'}`
                    });
                } else {
                    results.errors.push({
                        row: processedCount,
                        data: row,
                        reason: error.message || "Unknown error"
                    });
                }
                continue;
            }
        }

        console.log(`Import Summary:`, {
            processed: processedCount,
            created: results.created.length,
            restored: results.restored.length,
            skipped: results.skipped.length,
            errors: results.errors.length
        });

        res.status(201).json({
            message: `Import selesai. Diproses: ${processedCount}, Berhasil dibuat: ${results.created.length}, Direstore/diupdate: ${results.restored.length}, Dilewati: ${results.skipped.length}, Error: ${results.errors.length}`,
            summary: {
                totalProcessed: processedCount,
                created: results.created.length,
                restored: results.restored.length,
                skipped: results.skipped.length,
                errors: results.errors.length
            },
            details: {
                created: results.created,
                restored: results.restored,
                skipped: results.skipped,
                errors: results.errors
            }
        });

    } catch (err) {
        console.error("Error importEmployees:", err);
        res.status(500).json({ 
            message: "Error importing employees",
            error: err instanceof Error ? err.message : "Unknown error"
        });
    } finally {
        // Hapus file temporary
        if (filePath) {
            fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });
        }
    }
}