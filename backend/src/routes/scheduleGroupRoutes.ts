import express from "express";
import {
    createScheduleGroup,
    getMyScheduleGroups,
    getMyScheduleGroupsEmployee,
    getAllScheduleGroups,
    updateScheduleGroup,
    deleteScheduleGroup
} from "../controllers/scheduleGroupController";
import { requireFeature } from "../middlewares/requireFeatureMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/create-shift", authMiddleware, requireFeature("WORKSCHEDULE"), createScheduleGroup);
router.get("/show/my-schedule-group", authMiddleware, requireFeature("WORKSCHEDULE"), getMyScheduleGroups);
router.get("/show/my-schedule-group-employee",authMiddleware,requireFeature("WORKSCHEDULE"),getMyScheduleGroupsEmployee);
router.get("/show/all-schedule-group", authMiddleware, requireFeature("WORKSCHEDULE"), getAllScheduleGroups);
router.put("/update-shift/:id", authMiddleware, requireFeature("WORKSCHEDULE"), updateScheduleGroup);
router.delete("/delete-shift/:id", authMiddleware, requireFeature("WORKSCHEDULE"), deleteScheduleGroup);

export default router;