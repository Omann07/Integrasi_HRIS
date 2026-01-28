import { Request, Response } from "express";
import prisma from "../utils/prisma";

// mengambil semua data plans (khusus superadmin)
export async function getAllPlans(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        // Cek role superadmin
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null }
        });

        if (!user || user.role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const plans = await prisma.plan.findMany({
            where: { deletedAt: null },
            orderBy: { id: "asc" },
        });

        res.json({ success: true, data: plans });
    } catch (err) {
        console.error("Error getPlans:", err);
        res.status(500).json({ message: "Error fetching plans" });
    }
}

// mengambil semua data plans paygo (ini yang dipakai di fe)
export async function getPaygoPlans(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        // Cek role superadmin
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null }
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const plans = await prisma.plan.findMany({
            where: {
                deletedAt: null,
                planType: "PAYGO",
            },
            orderBy: { id: "asc" },
        });

        return res.json({
            success: true,
            data: plans,
        });
    } catch (err) {
        console.error("Error getPlans:", err);
        return res.status(500).json({ message: "Error fetching plans" });
    }
}

// mengambil semua data plans subscription (ini yang dipakai di fe)
export async function getSubscriptionPlans(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        // Cek role superadmin
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null }
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const plans = await prisma.plan.findMany({
            where: {
                deletedAt: null,
                planType: "SUBSCRIPTION",
            },
            orderBy: { id: "asc" },
        });

        return res.json({
            success: true,
            data: plans,
        });
    } catch (err) {
        console.error("Error getPlans:", err);
        return res.status(500).json({ message: "Error fetching plans" });
    }
}

export async function getPlanById(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user || user.role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const id = Number(req.params.id);
        const plan = await prisma.plan.findUnique({ where: { id } });

        res.json({ success: true, data: plan });
    } catch (err) {
        console.error("Error getPlanById:", err);
        res.status(500).json({ message: "Error fetching plan" });
    }
}

export async function createPlan(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user || user.role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const {
            name,
            planType,
            featureType,
            description,
            detail,
            price,
            maxEmployees,
            durationInDays,
        } = req.body;

        const plan = await prisma.plan.create({
            data: {
                name,
                planType,
                featureType,
                description,
                detail,
                price: Number(price),
                maxEmployees: maxEmployees ? Number(maxEmployees) : null,
                durationInDays,
            },
        });

        res.json({ success: true, message: "Plan created successfully", data: plan });
    } catch (err) {
        console.error("Error createPlan:", err);
        res.status(500).json({ message: "Error creating plan" });
    }
}

export async function updatePlan(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user || user.role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const id = Number(req.params.id);
        const data = req.body;

        const plan = await prisma.plan.update({
            where: { id },
            data,
        });

        res.json({ success: true, message: "Plan updated successfully", data: plan });
    } catch (err) {
        console.error("Error updatePlan:", err);
        res.status(500).json({ message: "Error updating plan" });
    }
}

export async function deletePlan(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user || user.role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const id = Number(req.params.id);

        const plan = await prisma.plan.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        res.json({ success: true, message: "Plan deleted (soft delete)", data: plan });
    } catch (err) {
        console.error("Error deletePlan:", err);
        res.status(500).json({ message: "Error deleting plan" });
    }
}
