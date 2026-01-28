import cron from "node-cron";
import prisma from "../utils/prisma";
import {
    calculateBillingAmount,
    getCheapestSubscriptionPlan,
} from "../utils/billing";

cron.schedule(
    "0 2 28 * *", // tanggal 28 jam 02:00 WIB
    async () => {
        console.log("[CRON BILLING] START");

        try {
            const expiredSubscriptions = await prisma.subscription.findMany({
                where: {
                    status: "EXPIRED",
                    autoRenew: true,
                    deletedAt: null,
                },
                include: {
                    plan: true,
                    company: true,
                },
            });

            for (const sub of expiredSubscriptions) {
                try {
                    let billingPlan = sub.plan;

                    // Jika TRIAL maka ambil subscription termurah
                    if (sub.plan.planType === "TRIAL") {
                        const cheapest = await getCheapestSubscriptionPlan();
                        if (!cheapest) {
                            console.warn(
                                `[CRON BILLING] No subscription plan available for company ${sub.companyId}`
                            );
                            continue;
                        }
                        billingPlan = cheapest;
                    }

                    // Hitung amount
                    const amount = await calculateBillingAmount(
                        sub.companyId,
                        billingPlan
                    );

                    // Buat transaction
                    const externalId = `bill_${sub.companyId}_${Date.now()}`;

                    const transaction = await prisma.transaction.create({
                        data: {
                            companyId: sub.companyId,
                            planId: billingPlan.id,
                            subscriptionId: sub.id,
                            type: "RENEWAL",
                            status: "PENDING",
                            amount,
                            externalId,
                        },
                    });

                    // Create invoice Xendit
                    const response = await fetch(
                        "https://api.xendit.co/v2/invoices",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization:
                                    "Basic " +
                                    Buffer.from(
                                        process.env.XENDIT_SECRET_KEY + ":"
                                    ).toString("base64"),
                            },
                            body: JSON.stringify({
                                external_id: transaction.externalId,
                                amount: transaction.amount,
                                description: `Billing otomatis paket ${billingPlan.name}`,
                            }),
                        }
                    );

                    const invoice = await response.json();

                    if (!invoice.id) {
                        console.error(
                            `[CRON BILLING] Failed invoice for company ${sub.companyId}`
                        );
                        continue;
                    }

                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            xenditInvoiceId: invoice.id,
                            invoiceUrl: invoice.invoice_url,
                            expiryDate: invoice.expiry_date
                                ? new Date(invoice.expiry_date)
                                : null,
                        },
                    });

                    console.log(
                        `[CRON BILLING] Invoice created for company ${sub.companyId}`
                    );
                } catch (err: any) {
                    console.warn(
                        `[CRON BILLING] Billing skipped for company ${sub.companyId}:`,
                        err.message
                    );
                }
            }

            console.log("[CRON BILLING] COMPLETE");
        } catch (error) {
            console.error("[CRON BILLING] ERROR:", error);
        }
    },
    {
        timezone: "Asia/Jakarta",
    }
);
