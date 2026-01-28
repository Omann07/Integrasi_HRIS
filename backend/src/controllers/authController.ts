import { Request, Response } from "express";
import nodemailer from "nodemailer";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function register(req: Request, res: Response) {
    const { name, email, password, role } = req.body;

    try {
        const existing = await prisma.user.findFirst({ where: { email, deletedAt: null} });
        if (existing) {
        return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || "ADMIN", // default admin
        },
        });

        res.status(201).json({ message: "User registered", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error registering user" });
    }
}

export async function loginAdmin(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
        if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
        );

        // Simpan ke tabel user_tokens
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 1); // 1 hari

        await prisma.userToken.create({
            data: {
                userId: user.id,
                token,
                expiredAt,
            },
        });

        res.json({ message: "Login successful", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error logging in" });
    }
}

// LOGIN EMPLOYEE (pakai employeeCode)
export async function loginEmployee(req: Request, res: Response) {
    const { employeeCode, password } = req.body;

    try {
        const employee = await prisma.employee.findUnique({
            where: { employeeCode },
            include: { user: true },
        });

        if (!employee || !employee.user || employee.user.deletedAt) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (employee.user.role !== "EMPLOYEE") {
            return res.status(403).json({ message: "Not an employee account" });
        }

        const isMatch = await bcrypt.compare(password, employee.user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: employee.user.id, role: employee.user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 1);

        await prisma.userToken.create({
            data: { userId: employee.user.id, token, expiredAt },
        });

        res.json({
            message: "Employee login successful",
            token,
            user: {
                id: employee.user.id,
                name: employee.user.name,
                role: employee.user.role,
                employee: {
                    id: employee.id,
                    employeeCode: employee.employeeCode,
                    fullName: employee.fullName,
                    position: employee.position,
                    department: employee.department,
                    hireDate: employee.hireDate,
                },
            },
        });
    } catch (err) {
        console.error("Error loginEmployee:", err);
        res.status(500).json({ message: "Error logging in employee" });
    }
}


export async function adminProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id; // ambil dari JWT

        const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: { company: true },
        // select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //     role: true,
        //     createdAt: true,
        //     company: {
        //         select: {
        //             id: true,
        //             companyName: true,
        //         },
        //     },
        // }
        });

        if (!user) {
        return res.status(404).json({ message: "User not found" });
        }

        res.json({ status: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching profile" });
    }
}

export async function employeeProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id; // ambil dari JWT

        const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
            include: { 
                company: true,
                Employee: true
            },
        });

        if (!user) {
        return res.status(404).json({ message: "User not found" });
        }

        res.json({ status: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching profile" });
    }
}


export async function updateProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { name, email, password } = req.body;

        const data: any = {};
        if (name) data.name = name;
        if (email) data.email = email;
        if (password) {
        data.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, name: true, email: true, role: true, companyId: true }
        });

        res.json({ message: "Profile updated", user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating profile" });
    }
}

export async function deleteAccount(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true, companyId: true, deletedAt: true }
        });

        if (!user || user.deletedAt) {
        return res.status(404).json({ message: "User not found" });
        }

        if (user.companyId) {
        return res.status(400).json({ message: "Cannot delete account linked to a company" });
        }

        await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() }
        });

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting account" });
    }
}


// LOGOUT (hapus token dari tabel user_tokens)
export async function logout(req: Request, res: Response) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
        }

        // Hapus token dari DB
        await prisma.userToken.deleteMany({
        where: { token },
        });

        return res.json({ message: "Logout successful" });
    } catch (err) {
        console.error("Error logout:", err);
        return res.status(500).json({ message: "Error logging out" });
    }
}


//Request reset password
export const requestPasswordReset = async (req: Request, res: Response) => {
    const { email } = req.body;
  
    try {
      const user = await prisma.user.findFirst({
        where: { email, deletedAt: null },
      });
  
      if (!user) {
        // SECURITY: jangan bocorkan user ada/tidak
        return res.json({
          status: true,
          message: "If the email exists, a reset link will be sent",
        });
      }
  
      // generate token 1 jam
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
  
      await prisma.userToken.create({
        data: {
          userId: user.id,
          token,
          expiredAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
  
      // tentukan FE path berdasarkan role
      const frontendBase = "http://localhost:3000";
  
      const resetPath =
        user.role === "EMPLOYEE"
          ? "/auth/employee/set-new-password"
          : "/auth/admin/set-new-password";
  
      const resetURL = `${frontendBase}${resetPath}?token=${token}&email=${user.email}`;
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Password Reset Request",
        html: `
          <p>Hai ${user.name || "User"},</p>
          <p>Klik link berikut untuk reset password:</p>
          <a href="${resetURL}" target="_blank">${resetURL}</a>
          <p>Link ini hanya berlaku 1 jam.</p>
        `,
      });
  
      res.json({
        status: true,
        message: "Password reset link sent to email",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        message: "Something went wrong",
      });
    }
  };

// RESET PASSWORD
export const resetPassword = async (req: Request, res: Response) => {
    const { email, token, password } = req.body;

    try {
        const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
        if (!user) return res.status(404).json({ status: false, message: "User not found" });

        // cek apakah token masih ada di tabel user_tokens
        const storedToken = await prisma.userToken.findFirst({
        where: { userId: user.id, token },
        });
        if (!storedToken) {
        return res.status(400).json({ status: false, message: "Invalid or expired token" });
        }

        // verifikasi JWT
        jwt.verify(token, JWT_SECRET);

        // update password
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
        });

        // hapus token biar nggak bisa dipakai ulang
        await prisma.userToken.delete({ where: { id: storedToken.id } });

        res.json({ status: true, message: "Password has been reset" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: "Something went wrong" });
    }
};

// Ubah Password bagi admin/superadmin
export async function changePasswordAdmin(req: Request, res: Response) {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        const currentUser = (req as any).user;

        // Validasi role - hanya ADMIN dan SUPERADMIN yang boleh akses
        if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN") {
            return res.status(403).json({ 
                message: "Forbidden: Only admin and superadmin can access this endpoint" 
            });
        }

        // Validasi input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                message: "Current password, new password, and confirm password are required" 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                message: "New password and confirm password do not match" 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: "New password must be at least 6 characters long" 
            });
        }

        // Dapatkan data user lengkap
        const user = await prisma.user.findUnique({
            where: { 
                id: currentUser.id,
                deletedAt: null 
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verifikasi password lama
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ 
                message: "Current password is incorrect" 
            });
        }

        // Validasi password baru tidak boleh sama dengan password lama
        const isSameAsOldPassword = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOldPassword) {
            return res.status(400).json({ 
                message: "New password cannot be the same as current password" 
            });
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ 
            message: "Password changed successfully" 
        });

    } catch (err: any) {
        console.error("Error changePasswordAdmin:", err);
        res.status(500).json({ message: "Error changing password" });
    }
}

// employee ubah passwordnya sendiri
export async function changePasswordEmployee(req: Request, res: Response) {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        const currentUser = (req as any).user;

        // Validasi input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                message: "Current password, new password, and confirm password are required" 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                message: "New password and confirm password do not match" 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: "New password must be at least 6 characters long" 
            });
        }

        // Dapatkan data user lengkap
        const user = await prisma.user.findUnique({
            where: { 
                id: currentUser.id,
                deletedAt: null 
            },
            include: {
                Employee: {
                    where: { deletedAt: null }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verifikasi password lama
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ 
                message: "Current password is incorrect" 
            });
        }

        // Validasi password baru tidak boleh sama dengan password lama
        const isSameAsOldPassword = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOldPassword) {
            return res.status(400).json({ 
                message: "New password cannot be the same as current password" 
            });
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ 
            message: "Password changed successfully" 
        });

    } catch (err: any) {
        console.error("Error changePassword:", err);
        res.status(500).json({ message: "Error changing password" });
    }
}