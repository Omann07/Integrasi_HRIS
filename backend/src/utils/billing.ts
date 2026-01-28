import prisma from "../utils/prisma";
import { Plan } from "../generated";


// hitung jumlah employee aktif
export async function getActiveEmployeeCount(companyId: number) {
    return prisma.employee.count({
        where: {
            companyId,
            deletedAt: null,
            status: "ACTIVE",
        },
    });
}

// ambil subscription termurah (fallback trial)
export async function getCheapestSubscriptionPlan() {
    return prisma.plan.findFirst({
        where: {
            planType: "SUBSCRIPTION",
            deletedAt: null,
        },
        orderBy: {
            price: "asc",
        },
    });
}

// hitung amount billing
export async function calculateBillingAmount(
    companyId: number,
    plan: Plan
) {
    const employeeCount = await getActiveEmployeeCount(companyId);

    if (plan.planType === "PAYGO") {
        if (employeeCount === 0) {
            throw new Error("Tidak ada employee aktif untuk PAYGO");
        }
        return plan.price * employeeCount;
    }

    if (plan.planType === "SUBSCRIPTION") {
        const maxAllowed = plan.maxEmployees ?? Infinity;
        if (employeeCount > maxAllowed) {
            throw new Error("Jumlah employee melebihi batas plan");
        }
        return plan.price;
    }

    throw new Error("Plan tidak valid untuk billing");
}

