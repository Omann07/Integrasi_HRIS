import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;
// console.log("🔑 JWT_SECRET:", JWT_SECRET);

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        // cek token ada di DB
        const tokenRecord = await prisma.userToken.findUnique({ where: { token } });
        if (!tokenRecord) return res.status(403).json({ message: "Token invalid or expired" });

        (req as any).user = decoded; // simpan payload token di request
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
}

// export function authMiddleware(req: Request, res: Response, next: NextFunction) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   const token = authHeader.split(" ")[1];
//   console.log("👉 Token from header:", token); // cek token yg dikirim FE / Rest Client

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
//     console.log("✅ Decoded payload:", decoded); // cek hasil decode

//     (req as any).user = decoded; // simpan payload token di request
//     next();
//   } catch (err) {
//     console.error("❌ JWT verify error:", err); // tampilkan error jwt
//     return res.status(403).json({ message: "Invalid token" });
//   }
// }
