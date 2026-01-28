import { Router } from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  getEmployeeProfile,
  deleteEmployee,
  restoreEmployee,
  getDeletedEmployees,
  exportEmployeesCsv,
  importEmployeesCsv
} from "../controllers/employeeController";
import { requireFeature } from "../middlewares/requireFeatureMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";
import uploadEmployeePhoto from "../middlewares/uploadEmployeePhotoMiddleware";
import uploadCsvEmployee from "../middlewares/uploadCsvEmployeeMiddleware";

const router = Router();

// Create Employee (Admin/Superadmin only)
router.post(
  "/create",
  authMiddleware,
  uploadEmployeePhoto.single("photo"),
  createEmployee
);

// Get Employee Profile (Current logged in employee)
router.get("/profile", authMiddleware, getEmployeeProfile);

// Get All Employees (alternative route for consistency)
router.get("/show/my-employees", authMiddleware, getEmployees);

// Get Employee By ID
router.get("/show/my-employees/:id", authMiddleware, getEmployeeById);

// Get All Deleted Employees (Admin/Superadmin only)
router.get("/deleted", authMiddleware, getDeletedEmployees);

// Update Employee
router.patch(
  "/update/:id",
  authMiddleware,
  uploadEmployeePhoto.single("photo"),
  updateEmployee
);

// Employee update profilenya sendiri
router.patch(
  "/update/my-profile",
  authMiddleware,
  uploadEmployeePhoto.single("photo"),
  updateEmployee
);

// Soft Delete Employee (Admin/Superadmin only)
router.delete("/delete/:id", authMiddleware, deleteEmployee);

// Restore Employee (Superadmin only)
router.patch("/restore/:id", authMiddleware, restoreEmployee);

// Export Employee to CSV
router.get(
  "/export/csv", 
  authMiddleware, 
  requireFeature("ALL_FEATURES"), 
  exportEmployeesCsv
);

// Import Employee from CSV
router.post(
  "/import/csv",
  authMiddleware,
  requireFeature("ALL_FEATURES"),
  uploadCsvEmployee.single("file"),
  importEmployeesCsv
);

export default router;