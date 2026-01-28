import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { paymentService } from "../services/paymentService";

// fungsi untuk membuat transaksi setelah admin menekan tombol untuk beli paket
export async function createTransaction(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { planId } = req.body;

        // 1. Cari company milik admin 
        const company = await prisma.company.findFirst({
            where: {
                ownerUserId: userId,
                deletedAt: null,
            },
        });

        if (!company) {
            return res.status(404).json({ message: "Company tidak ditemukan" });
        }

        // 2. Ambil plan 
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            return res.status(404).json({ message: "Plan tidak ditemukan" });
        }

        // 3. Cek subscription aktif 
        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                companyId: company.id,
                status: "ACTIVE",
                deletedAt: null,
            },
            include: {
                plan: true,
            },
        });

        const hasActiveSubscription = activeSubscriptions.some(
            (sub) => sub.plan.planType === "SUBSCRIPTION"
        );

        // Jika masih ada SUBSCRIPTION aktif maka tidak boleh beli apa pun
        if (hasActiveSubscription) {
            return res.status(400).json({
                message: "Masih ada subscription aktif, tidak bisa membeli paket lain",
            });
        }

        // 4. Hitung jumlah employee 
        const employeeCount = await prisma.employee.count({
            where: {
                companyId: company.id,
                deletedAt: null,
            },
        });

        // 5. Validasi & hitung amount 
        let amount = plan.price;

        if (plan.planType === "SUBSCRIPTION") {
            // Validasi max employee hanya untuk subscription
            const maxAllowed = plan.maxEmployees ?? Infinity;

            if (employeeCount > maxAllowed) {
                return res.status(400).json({
                    message: `Plan ini hanya untuk maksimal ${plan.maxEmployees} employee`,
                });
            }

            // Harga subscription langsung dari plan
            amount = plan.price;
        }

        if (plan.planType === "PAYGO") {
            // PAYGO = harga per employee
            amount = plan.price * employeeCount;

            if (employeeCount === 0) {
                return res.status(400).json({
                    message: "Tidak ada employee aktif untuk dikenakan biaya",
                });
            }
        }

        // 6. Buat transaksi PENDING 
        const externalId = `tsn_${company.id}_${Date.now()}`;

        const transaction = await prisma.transaction.create({
            data: {
                companyId: company.id,
                planId: plan.id,
                type: "PURCHASE",
                status: "PENDING",
                amount,
                externalId,
            },
        });

        // 7. Buat invoice Xendit 
        const invoicePayload = {
            external_id: transaction.externalId,
            amount: transaction.amount,
            description: `Pembelian paket ${plan.name}`,
            success_redirect_url: "http://localhost:3000/dashboard/admin", // tolong ganti url ini dengan url fe nya ketika success
            failure_redirect_url: "http://localhost:3000/dashboard/admin/history", // ataupun ketika gagal
        };

        const response = await fetch("https://api.xendit.co/v2/invoices", { // JANGAN DIUBAH!!! -- ini url untuk kirim invoice ke xendit
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " +
                    Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64"),
            },
            body: JSON.stringify(invoicePayload),
        });

        const invoice = await response.json();

        if (!invoice.id) {
            return res.status(500).json({
                message: "Gagal membuat invoice Xendit",
            });
        }

        // 8. Update transaksi 
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                xenditInvoiceId: invoice.id,
                invoiceUrl: invoice.invoice_url,
                expiryDate: invoice.expiry_date
                    ? new Date(invoice.expiry_date)
                    : null,
            },
        });

        return res.status(201).json({
            message: "Transaksi berhasil dibuat",
            invoiceUrl: updatedTransaction.invoiceUrl,
            transaction: updatedTransaction,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}

// fungsi untuk menampilkan daftar data transaksi si admin yang pernah dibuat,
// termasuk transaksi billing (renewal) yang sudah selesai bayar (untuk kebutuhan history)
export async function getTransactionHistory(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

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

        const transactions = await prisma.transaction.findMany({
            where: {
                companyId: company.id,
                OR: [
                    { type: "PURCHASE" },
                    {
                        type: "RENEWAL",
                        status: "PAID",
                    },
                ],
            },
            select: {
                id: true,
                type: true,
                status: true,
                amount: true,
                createdAt: true,
                invoiceUrl: true,      
                xenditInvoiceId: true,
                expiryDate: true,
                paidAt: true,
                paymentMethod: true,
                plan: {
                    select: {
                        name: true,
                        planType: true,
                        featureType: true,
                        durationInDays: true,     // Tambahkan jika ada di skema
                        maxEmployees: true, // Tambahkan untuk menampilkan "Max Employee"
                        price: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            count: transactions.length,
            data: transactions,
        });
    } catch (error) {
        console.error("getTransactionHistory error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

// fungsi untuk menampilkan daftar data transaksi billing (renewal) yang perlu dibayar
export async function getBillingTransactions(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

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

        const billings = await prisma.transaction.findMany({
            where: {
                companyId: company.id,
                type: "RENEWAL",
                status: "PENDING",
            },
            select: {
                id: true,
                amount: true,
                createdAt: true,
                expiryDate: true,
                plan: {
                    select: {
                        name: true,
                        planType: true,
                        featureType: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return res.status(200).json({
            count: billings.length,
            data: billings,
        });
    } catch (error) {
        console.error("getBillingTransactions error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

// fungsi untuk menampilkan detail data transaksi berdasarkan id
export async function getTransactionById(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params; // ID transaksi

        // cari company milik user login
        const company = await prisma.company.findFirst({
            where: { ownerUserId: userId, deletedAt: null }
        });

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // cari transaksi berdasarkan id + company pemilik
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: Number(id),
                companyId: company.id
            },
            include: {
                plan: true,
                subscription: true
            }
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        return res.status(200).json({
            data: transaction
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}

// fungsi untuk mengupdate data transactions setelah mendapatkan callback dari xendit
export async function xenditCallback(req: Request, res: Response) {
    try {
        if (req.headers["x-callback-token"] !== process.env.XENDIT_CALLBACK_TOKEN) {
            return res.status(401).json({ message: "Invalid callback token" });
        }

        await paymentService.handleCallback(req.body); // Proses logika backend

        return res.json({ message: "Callback processed" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}

// fungsi untuk menampilkan data di tabel subscriptions include dengan remaining days
export async function getSubscription(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        // Cari company milik user login
        const company = await prisma.company.findFirst({
            where: {
                ownerUserId: userId,
                deletedAt: null,
            },
        });

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Ambil SEMUA subscription aktif
        const subscriptions = await prisma.subscription.findMany({
            where: {
                companyId: company.id,
                status: "ACTIVE",
                deletedAt: null,
            },
            include: {
                plan: true,
            },
            orderBy: {
                endDate: "desc",
            },
        });

        if (subscriptions.length === 0) {
            return res.status(404).json({
                message: "No active subscription",
            });
        }

        const now = new Date();

        // Hitung sisa hari untuk masing-masing subscription
        const result = subscriptions.map((subscription) => {
            const endDate = new Date(subscription.endDate);
            const diffMs = endDate.getTime() - now.getTime();

            const remainingDays =
                diffMs > 0
                    ? Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                    : 0;

            return {
                ...subscription,
                remainingDays,
            };
        });

        return res.status(200).json({
            count: result.length,
            data: result,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}

// end point untuk tombol renew subscription aktif
export async function updateAutoRenew(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { autoRenew } = req.body;

        if (typeof autoRenew !== "boolean") {
            return res.status(400).json({
                message: "autoRenew harus boolean",
            });
        }

        // ambil user
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: {
                ownedCompanies: true,
            },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // ambil company milik admin
        const companyId =
            user.ownedCompanies.length > 0
                ? user.ownedCompanies[0].id
                : user.companyId;

        if (!companyId) {
            return res.status(400).json({
                message: "User tidak memiliki company",
            });
        }

        // ambil subscription terakhir (ACTIVE / EXPIRED)
        const subscription = await prisma.subscription.findFirst({
            where: {
                companyId,
                deletedAt: null,
            },
            orderBy: {
                endDate: "desc",
            },
        });

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription tidak ditemukan",
            });
        }

        // update autoRenew
        const updated = await prisma.subscription.update({
            where: { id: subscription.id },
            data: { autoRenew },
        });

        return res.json({
            message: "Auto renew berhasil diperbarui",
            data: {
                subscriptionId: updated.id,
                autoRenew: updated.autoRenew,
            },
        });
    } catch (error) {
        console.error("updateAutoRenew error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}


