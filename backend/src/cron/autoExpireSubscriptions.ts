import cron from "node-cron";
import prisma from "../utils/prisma";
import { fromUTCToWIB, formatWIB } from "../utils/timezone";

/**
 * CRON: Auto-expire subscription
 * Jalan setiap hari jam 00:00 WIB
 */
cron.schedule(
    "0 0 * * *", // 00:00 setiap hari
    async () => {
        console.log("[AUTO EXPIRE SUBSCRIPTION] Job START (00:00 WIB)");

        try {
            // Ambil waktu sekarang
            const now = new Date();

            // Expire subscription yang lewat endDate
            const result = await prisma.subscription.updateMany({
                where: {
                    status: "ACTIVE",
                    deletedAt: null,
                    endDate: { lte: now },
                },
                data: {
                    status: "EXPIRED",
                },
            });

            console.log(
                `[AUTO EXPIRE SUBSCRIPTION] COMPLETE - Expired count: ${result.count}`
            );
        } catch (error) {
            console.error(
                "[AUTO EXPIRE SUBSCRIPTION] ERROR:",
                error
            );
        }
    },
    {
        timezone: "Asia/Jakarta", // pastikan WIB walau server UTC
    }
);
