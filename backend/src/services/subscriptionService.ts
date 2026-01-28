import prisma from "../utils/prisma";

export const subscriptionService = {

    async processPaidTransaction(transaction: any) {

        const plan = transaction.plan;

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(
            endDate.getDate() + plan.durationInDays
        );

        // Jika beli SUBSCRIPTION >> hanguskan semua ACTIVE
        if (plan.planType === "SUBSCRIPTION") {
            await prisma.subscription.updateMany({
                where: {
                    companyId: transaction.companyId,
                    status: "ACTIVE",
                },
                data: {
                    status: "EXPIRED",
                    endDate: new Date(),
                },
            });
        }

        const subscription = await prisma.subscription.create({
            data: {
                companyId: transaction.companyId,
                planId: transaction.planId,
                startDate,
                endDate,
                status: "ACTIVE",
            },
        });

        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { subscriptionId: subscription.id },
        });
    },
};
