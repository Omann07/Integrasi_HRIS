import { Router } from "express";
import { 
    createTransaction,
    getTransactionHistory,
    getBillingTransactions,
    getTransactionById,
    xenditCallback,
    getSubscription,
    updateAutoRenew
} from "../controllers/paymentController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// proses transaksi (checkout)
router.post("/create-transactions", authMiddleware, createTransaction);
router.get("/show-transactions/history", authMiddleware, getTransactionHistory);
router.get("/show-transactions/billing", authMiddleware, getBillingTransactions);
router.get("/show-transactions/:id", authMiddleware, getTransactionById);

// untuk callback dari xendit guna update transactions & create subscriptions
router.post("/xendit/callback", xenditCallback);

// untuk menampilkan data subscriptions yang aktif include dengan remaining days
router.get("/show-subscription", authMiddleware, getSubscription);

router.patch("/auto-renew", authMiddleware, updateAutoRenew);

export default router;
