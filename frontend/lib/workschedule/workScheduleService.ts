// @/lib/workScheduleService.ts

import api from "../api";

// Definisikan Interface untuk payload (data yang dikirim ke API)
export interface WorkSchedulePayload {
  companyId: number;
  scheduleGroupId: number;
  dayOfWeek: string;
  startTime: string;
  breakStart: string;
  breakEnd: string;
  endTime: string;
}

// 1. Ambil data jadwal kantor (Admin/Company level)
export const getWorkSchedules = async () => {
  const res = await api.get("/work-schedule/show/my-work-schedule-company");
  // Pastikan return data konsisten. Jika API membungkus di .data.data:
  return res.data.data || res.data;
};

// 2. Buat jadwal baru
export const createWorkSchedule = async (data: WorkSchedulePayload) => {
  const res = await api.post("/work-schedule/create-schedule", data);
  return res.data;
};

// 3. Update jadwal
export const updateWorkSchedule = async (id: number, data: Partial<WorkSchedulePayload>) => {
  const res = await api.patch(`/work-schedule/update-schedule/${id}`, data);
  return res.data;
};

// 4. Hapus jadwal
export const deleteWorkSchedule = async (id: number) => {
  const res = await api.delete(`/work-schedule/delete-schedule/${id}`);
  return res.data;
};

// 5. Ambil jadwal karyawan (Employee level)
// Biarkan service mengembalikan data mentah (Raw), mapping dilakukan di UI atau Hook
export const getMyWorkScheduleEmployee = async () => {
  const res = await api.get("/work-schedule/my-work-schedule-employee");
  return res.data.data || [];
};