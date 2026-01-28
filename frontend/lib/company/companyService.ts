// src/lib/companyService.ts
import api from "@/lib/api";

export const getMyCompany = async () => {
  try {
    const res = await api.get("/company/show/mycompany");
    return res.data.company;
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const getEmployeeCompany = async () => {
  try {
    const res = await api.get("/company/show/employee-company");
    return res.data.company;
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const createCompany = async (formData: FormData) => {
  return api.post("/company/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateCompany = async (formData: FormData) => {
  return api.patch("/company/update", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
