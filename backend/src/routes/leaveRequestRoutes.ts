import express from "express";
import {
    createLeaveRequest,
    getLeaveRequests,
    getLeaveRequestById,
    updateLeaveRequest,
    updateLeaveRequestStatus,
    cancelLeaveRequest,
    deleteLeaveRequest
} from "../controllers/leaveRequestController";
import { requireFeature } from "../middlewares/requireFeatureMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadLeaveRequest"; // Jika ada upload attachment

const router = express.Router();

// Employee endpoints
router.post("/create-leave-request", authMiddleware, requireFeature("LEAVE_PERMISSION"), upload.single('attachment'), createLeaveRequest);
router.get("/show/my-leave-requests", authMiddleware, requireFeature("LEAVE_PERMISSION"), getLeaveRequests);
router.get("/show/leave-request/:id", authMiddleware, requireFeature("LEAVE_PERMISSION"), getLeaveRequestById);
router.patch("/cancel-leave-request/:id", authMiddleware, requireFeature("LEAVE_PERMISSION"), cancelLeaveRequest);
router.patch("/update-leave-request/:id", authMiddleware, upload.single("attachment"), updateLeaveRequest);

// Admin endpoints
router.patch("/update-leave-status/:id", authMiddleware, requireFeature("LEAVE_PERMISSION"), updateLeaveRequestStatus);
router.delete("/delete-leave-request/:id", authMiddleware, requireFeature("LEAVE_PERMISSION"), deleteLeaveRequest);

export default router;