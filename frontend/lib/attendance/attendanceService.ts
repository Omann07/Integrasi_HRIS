import api from "../api";
import {
  mapAttendancesToUI,
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

/* GET ATTENDANCE */
export const getAttendances = async (): Promise<AttendanceUI[]> => {
  const res = await api.get("/attendance/show-attendance");
  return mapAttendancesToUI(res.data.data);
};


/* CREATE ATTENDANCE */
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