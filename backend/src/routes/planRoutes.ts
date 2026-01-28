import { Router } from "express";
import { 
    getAllPlans,
    getPaygoPlans,
    getSubscriptionPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan
} from "../controllers/planController";

import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// mengambil semua data plans (khusus superadmin)
router.get("/show-all", authMiddleware, getAllPlans);

// mengambil semua data plans paygo (ini yang dipakai di fe admin)
router.get("/show/paygo", authMiddleware, getPaygoPlans);

// mengambil semua data plans subscription (ini yang dipakai di fe admin)
router.get("/show/subscription", authMiddleware, getSubscriptionPlans);

router.get("/show/:id", authMiddleware, getPlanById);
router.post("/create", authMiddleware, createPlan);
router.patch("/update/:id", authMiddleware, updatePlan);
router.delete("/delete/:id", authMiddleware, deletePlan);

export default router;
