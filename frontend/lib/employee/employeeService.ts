import api from "../api";

// get profile employee (login user)
export const getEmployeeProfile = async () => {
  const res = await api.get("/auth/employee/profile");
  return res.data;
};

// update profile employee sendiri
export const updateMyEmployeeProfile = async (data: FormData) => {
  const res = await api.patch(
    "/employee/update/my-profile",
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};

// GET ALL EMPLOYEES
export const getEmployees = async () => {
  const res = await api.get("/employee/show/my-employees");
  return res.data;
};

// CREATE EMPLOYEE (Fungsi Baru)
export const createEmployee = async (data: any) => {
  const res = await api.post("/employee/create", data);
  return res.data;
};

// GET EMPLOYEE BY ID
export const getEmployeeById = async (id: number) => {
  const res = await api.get(`/employee/show/my-employees/${id}`);
  return res.data;
};

// UPDATE EMPLOYEE
export const updateEmployee = async (id: number, data: FormData) => {
  const res = await api.patch(
    `/employee/update/${id}`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};

// DELETE EMPLOYEE
export const deleteEmployee = async (id: number) => {
  const res = await api.delete(`/employee/delete/${id}`);
  return res.data;
};

// EXPORT EMPLOYEE CSV
export const exportEmployeesCsv = async () => {
  const res = await api.get("/employee/export/csv", {
    responseType: "blob", // penting untuk file
  });
  return res.data;
};

// IMPORT EMPLOYEE CSV
export const importEmployeesCsv = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/employee/import/csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};
