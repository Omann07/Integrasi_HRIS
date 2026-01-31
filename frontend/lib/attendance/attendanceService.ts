import api from "../api";
import {
  mapAttendancesToUI,
  mapAttendanceToUI,
  AttendanceUI,
} from "../attendance/attendanceMapper";

export const getAttendancesAdmin = async (): Promise<AttendanceUI[]> => {
  const res = await api.get("/attendance/show-attendance");
  return mapAttendancesToUI(res.data.data);
};

export const updateAttendanceStatus = async (
  id: number,
  status: "APPROVED" | "REJECTED"
) => {
  return api.patch(`/attendance/update-attendance/${id}`, {
    approvalStatus: status,
  });
};

export const updateAttendance = async (id: number, formData: FormData) => {
  return api.patch(`/attendance/update-attendance/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data", // Penting jika ada upload foto bukti
    },
  });
};

export const getAttendances = async (): Promise<AttendanceUI[]> => {
  const res = await api.get("/attendance/show-attendance");
  return mapAttendancesToUI(res.data.data);
};

export const createAttendance = async (formData: FormData) => {
  return api.post(
    "/attendance/create-attendance",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const createAttendanceByAdmin = async (formData: FormData) => {
  return api.post(
    "/attendance/admin/attendance",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// attendanceService.ts

export const getAttendanceById = async (id: number): Promise<AttendanceUI> => {
  const res = await api.get(`/attendance/show-detail/${id}`);
  
  // GUNAKAN mapAttendanceToUI karena data detail adalah satu objek tunggal
  // res.data.data dari backend adalah { id: 1, ... } bukan [{ id: 1, ... }]
  return mapAttendanceToUI(res.data.data); 
};

export const deleteAttendance = async (id: number) => {
  return api.delete(`/attendance/delete-attendance/${id}`);
};