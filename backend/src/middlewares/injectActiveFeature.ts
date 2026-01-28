import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

export async function injectActiveFeatures(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = (req as any).user?.id;

        // belum login → lewati saja
        if (!userId) {
            (req as any).activeFeatures = [];
            return next();
        }

        // cek user + role
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });

        // SUPERADMIN bebas semua
        if (user?.role === "SUPERADMIN") {
            (req as any).activeFeatures = ["ALL_FEATURES"];
            return next();
        }

        // cari company
        const company = await prisma.company.findFirst({
            where: {
                ownerUserId: userId,
                deletedAt: null,
            },
        });

        if (!company) {
            (req as any).activeFeatures = [];
            return next();
        }

        const now = new Date();

        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                companyId: company.id,
                status: "ACTIVE",
                deletedAt: null,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            include: {
                plan: true,
            },
        });

        const features = activeSubscriptions.map(
            (sub) => sub.plan.featureType
        );

        // kalau ada subscription >> ALL_FEATURES override
        if (features.includes("ALL_FEATURES")) {
            (req as any).activeFeatures = ["ALL_FEATURES"];
        } else {
            (req as any).activeFeatures = features;
        }

        next();
    } catch (error) {
        console.error("injectActiveFeatures error:", error);
        (req as any).activeFeatures = [];
        next();
    }
}
