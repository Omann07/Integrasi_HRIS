import { Router } from "express";
import multer from "multer";
import { 
    register, 
    loginAdmin,
    loginEmployee, 
    adminProfile,
    employeeProfile, 
    updateProfile, 
    deleteAccount, 
    requestPasswordReset, 
    resetPassword, 
    logout,
    changePasswordAdmin,
    changePasswordEmployee
 } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const upload = multer();
const router = Router();

router.post("/register", upload.none(), register);
router.post("/login/admin", loginAdmin);
router.post("/login/employee", loginEmployee);
router.get("/admin/profile", authMiddleware, adminProfile);
router.get("/employee/profile", authMiddleware, employeeProfile);
router.patch("/admin/profile/update", authMiddleware, updateProfile);
router.delete("/profile/delete", authMiddleware, deleteAccount);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/logout", authMiddleware, logout);
// Admin/Superadmin ubah passwordnya sendiri
router.patch("/admin/change-password", authMiddleware, changePasswordAdmin);
// Employee ubah passwordnya sendiri
router.patch("/employee/change-password", authMiddleware, changePasswordEmployee);

export default router;
