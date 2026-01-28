import express from "express";
import { 
    createWorkSchedule,
    getMyWorkSchedules,
    getMyWorkSchedulesEmployee,
    getAllWorkSchedules,
    updateWorkSchedule,
    deleteWorkSchedule
 } from "../controllers/workScheduleController";
import { requireFeature } from "../middlewares/requireFeatureMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/create-schedule", authMiddleware, requireFeature("WORKSCHEDULE"), createWorkSchedule);
router.get("/show/my-work-schedule-company", authMiddleware, requireFeature("WORKSCHEDULE"), getMyWorkSchedules);
router.get("/my-work-schedule-employee",authMiddleware, requireFeature("WORKSCHEDULE"), getMyWorkSchedulesEmployee);  
router.get("/show/all-work-schedule-company", authMiddleware, requireFeature("WORKSCHEDULE"), getAllWorkSchedules);
router.patch("/update-schedule/:id", authMiddleware, requireFeature("WORKSCHEDULE"), updateWorkSchedule);
router.delete("/delete-schedule/:id", authMiddleware, requireFeature("WORKSCHEDULE"), deleteWorkSchedule);

export default router;