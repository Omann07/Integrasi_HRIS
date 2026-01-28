import express from "express";
import { 
    createAttendance,
    createAttendanceByAdmin,
    getAttendances,
    updateAttendance,
    getAttendanceById,
    deleteAttendance,
    getAdminDashboard,
    getEmployeeDashboard
 } from "../controllers/attendanceController";
import { requireFeature } from "../middlewares/requireFeatureMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";
import uploadProofAttendance from "../middlewares/uploadProofAttendance";
import { timezoneMiddleware } from "../middlewares/timezoneMiddleware";

const router = express.Router();

// tambah absensi
router.post(
    "/create-attendance", 
    authMiddleware, 
    timezoneMiddleware,
    requireFeature("ATTENDANCE"), 
    uploadProofAttendance.single("proof"), 
    createAttendance
);

router.post(
    "/admin/attendance",
    authMiddleware,
    uploadProofAttendance.single("proof"),
    createAttendanceByAdmin
  );

// tampilkan data absensi (include search)
router.get(
    "/show-attendance",
    authMiddleware,
    timezoneMiddleware,
    requireFeature("ATTENDANCE"),
    getAttendances
);

// tampilan detail data absensi (berdasarkan id attendance)
router.get(
    "/show-detail/:id",
    authMiddleware,
    timezoneMiddleware,
    requireFeature("ATTENDANCE"),
    getAttendanceById
)

// update data absensi (admin/superadmin only)
router.patch(
    "/update-attendance/:id", 
    authMiddleware, 
    timezoneMiddleware,
    requireFeature("ATTENDANCE"),
    uploadProofAttendance.single("proof"), 
    updateAttendance
);

// soft delete attendance
router.delete(
    "/delete-attendance/:id",
    authMiddleware,
    requireFeature("ATTENDANCE"),
    deleteAttendance
);

// dashboard admin (perhari)
router.get(
    "/admin-dashboard",
    authMiddleware,
    timezoneMiddleware,
    requireFeature("ATTENDANCE"),
    getAdminDashboard
);

// dashboard employee (perbulan)
router.get(
    "/employee-dashboard",
    authMiddleware,
    timezoneMiddleware,
    requireFeature("ATTENDANCE"),
    getEmployeeDashboard
);

// route cek waktu sekarang (wib)
router.get("/time", (req, res) => {
  res.json({
    nowWIB: req.formatWIB(req.nowWIB, "dd MMM yyyy HH:mm:ss"),
    todayWIB: req.todayWIB,
  });
});

export default router;
