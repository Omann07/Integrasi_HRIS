import { Router } from "express";
import { 
    createCompany, 
    getMyCompany, 
    getEmployeeCompany,
    updateCompany, 
    deleteCompanyOwner, 
    deleteCompanySuperadmin, 
    getAllCompanies,
    getTotalEmployees
 } from "../controllers/companyController";
import { authMiddleware } from "../middlewares/authMiddleware";
import uploadLogo from "../middlewares/uploadLogoMiddleware";

const router = Router();

// hanya admin login yang bisa create + lihat company-nya sendiri
router.post("/create", authMiddleware, uploadLogo.single("logo"), createCompany);
router.get("/show/mycompany", authMiddleware, getMyCompany);
router.get("/show/employee-company",authMiddleware,getEmployeeCompany);
router.get("/all-companies", authMiddleware, getAllCompanies);
router.patch("/update", authMiddleware, uploadLogo.single("logo"), updateCompany);
router.delete("/delete", authMiddleware, deleteCompanyOwner );
router.delete("/delete/:id", authMiddleware, deleteCompanySuperadmin );

// total employee digunakan untuk filter paket subscription yang bisa dibeli, 
// fe harus memfilternya agar:
// jika total employee saat ini > max employee maka paket akan di disabel,
// hanya paket yang memiliki max employee < employee saat ini yang bisa dibeli
router.get("/total-employees", authMiddleware, getTotalEmployees);

export default router;
