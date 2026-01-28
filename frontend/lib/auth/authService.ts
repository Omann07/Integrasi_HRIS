import api from "../api";

export const registerAdmin = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const res = await api.post("/auth/register", {
    ...data,
    role: "ADMIN",
  });
  return res.data;
};


export const loginAdmin = async (data: {
  email: string;
  password: string;
}) => {
  const res = await api.post("/auth/login/admin", data);
  return res.data;
};

export const loginEmployee = async (data: {
  employeeCode: string;
  password: string;
}) => {
  const res = await api.post("/auth/login/employee", data);
  return res.data;
};

export const changeEmployeePassword = async (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const res = await api.patch("/auth/employee/change-password", data);
  return res.data;
};

export const getAdminProfile = async () => {
  const res = await api.get("/auth/admin/profile");
  return res.data;
};

export const updateAdminProfile = async (data: {
  name: string;
  email: string;
}) => {
  const res = await api.patch("/auth/admin/profile/update", data);
  return res.data;
};

export const changeAdminPassword = async (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const res = await api.patch("/auth/admin/change-password", data);
  return res.data;
};

export const forgotPassword = async (data: {
  email: string;
}) => {
  const res = await api.post("/auth/forgot-password", data);
  return res.data;
};

export const resetPassword = async (data: {
  token: string;
  email: string;
  password: string;
}) => {
  const res = await api.post("/auth/reset-password", data);
  return res.data;
};


export const getEmployeeProfile = async () => {
  const res = await api.get("/auth/employee/profile");
  return res.data;
};

export const logout = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};
