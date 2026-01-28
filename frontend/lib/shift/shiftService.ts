import api from "../api";
import { mapShift, ShiftUI } from "../shift/shiftMapper";

// get all shift (admin)
export const getMyShifts = async (): Promise<ShiftUI[]> => {
  const res = await api.get("/schedule-group/show/my-schedule-group");
  return res.data.data.map(mapShift);
};

export const createMyShift = async (data: { nameOfShift: string }) => {
  return api.post("/schedule-group/create-shift", data);
};

export const updateMyShift = async (
  id: number,
  data: { nameOfShift: string }
) => {
  return api.patch(`/schedule-group/update-schedule-group/${id}`, data);
};

export const deleteMyShift = async (id: number) => {
  return api.delete(`/schedule-group/delete-schedule-group/${id}`);
};

// employee hanya view
export const getMyShiftsEmployee = async (): Promise<ShiftUI[]> => {
  const res = await api.get("/schedule-group/show/my-schedule-group-employee");
  return res.data.data.map(mapShift);
};
