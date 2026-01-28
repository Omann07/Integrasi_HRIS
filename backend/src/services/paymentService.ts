import prisma from "../utils/prisma";
import { subscriptionService } from "./subscriptionService";

export const paymentService = {

    async handleCallback(payload: any) {

        const externalId =
            payload.externalId ||
            payload.external_id ||
            payload.data?.external_id;

        if (!externalId) throw new Error("externalId missing");

        const statusMap: any = {
            PAID: "PAID",
            SETTLED: "PAID",
            PENDING: "PENDING",
            EXPIRED: "EXPIRED",
            FAILED: "FAILED",
        };

        const mappedStatus = statusMap[payload.status] || "FAILED";

        const transaction = await prisma.transaction.findUnique({
            where: { externalId },
            include: { plan: true },
        });

        if (!transaction) throw new Error("Transaction not found");

        await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                status: mappedStatus,
                paidAt: mappedStatus === "PAID" ? new Date() : null,
                paymentMethod: payload.payment_method || transaction.paymentMethod,
                metadata: payload,
            },
        });

        if (mappedStatus === "PAID" && !transaction.subscriptionId) {
            await subscriptionService.processPaidTransaction(transaction);
        }
    },
};
