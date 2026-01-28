import express from "express";
import {
    createLeaveType,
    getLeaveTypes,
    updateLeaveType,
    deleteLeaveType
} from "../controllers/leaveTypeController";
import { requireFeature } from "../middlewares/requireFeatureMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/create-leave-type", authMiddleware, requireFeature("LEAVE_PERMISSION"), createLeaveType);
router.get("/show/leave-types", authMiddleware, requireFeature("LEAVE_PERMISSION"), getLeaveTypes);
router.patch("/update-leave-type/:id", authMiddleware, requireFeature("LEAVE_PERMISSION"), updateLeaveType);
router.delete("/delete-leave-type/:id", authMiddleware, requireFeature("LEAVE_PERMISSION"), deleteLeaveType);

export default router;