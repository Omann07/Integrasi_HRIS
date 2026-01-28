import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

type FeatureType =
    | "ALL_FEATURES"
    | "ATTENDANCE"
    | "LEAVE_PERMISSION"
    | "WORKSCHEDULE";

export function requireFeature(requiredFeature: FeatureType) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            // Ambil user & role
            const user = await prisma.user.findFirst({
                where: { id: userId, deletedAt: null },
                select: { role: true },
            });

            if (!user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            // SUPERADMIN BYPASS
            if (user.role === "SUPERADMIN") {
                return next();
            }

            let companyId: number | null = null;

            // ADMIN > owner company
            if (user.role === "ADMIN") {
                const company = await prisma.company.findFirst({
                    where: {
                        ownerUserId: userId,
                        deletedAt: null,
                    },
                    select: { id: true },
                });

                if (!company) {
                    return res.status(404).json({ message: "Company not found" });
                }

                companyId = company.id;
            }

            // EMPLOYEE > lewat tabel employee
            if (user.role === "EMPLOYEE") {
                const employee = await prisma.employee.findFirst({
                    where: {
                        userId,
                        deletedAt: null,
                        status: "ACTIVE",
                    },
                    select: { companyId: true },
                });

                if (!employee) {
                    return res.status(404).json({
                        message: "Employee record not found",
                    });
                }

                companyId = employee.companyId;
            }

            if (!companyId) {
                return res.status(403).json({ message: "Invalid user role" });
            }

            // Cek subscription aktif
            const now = new Date();

            const activeSubscriptions = await prisma.subscription.findMany({
                where: {
                    companyId,
                    status: "ACTIVE",
                    deletedAt: null,
                    startDate: { lte: now },
                    endDate: { gte: now },
                },
                include: {
                    plan: true,
                },
            });

            if (activeSubscriptions.length === 0) {
                return res.status(403).json({
                    message: "No active paygo or subscription",
                });
            }

            // Subscription ALL_FEATURES
            const hasAllFeatures = activeSubscriptions.some(
                (sub) => sub.plan.featureType === "ALL_FEATURES"
            );

            if (hasAllFeatures) {
                return next();
            }

            // PAYGO feature check
            const hasFeature = activeSubscriptions.some(
                (sub) => sub.plan.featureType === requiredFeature
            );

            if (!hasFeature) {
                return res.status(403).json({
                    message: `Feature '${requiredFeature}' is not available in your plan`,
                });
            }

            return next();
        } catch (error) {
            console.error("requireFeature middleware error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
}
