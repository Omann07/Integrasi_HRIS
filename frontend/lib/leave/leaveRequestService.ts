// lib/leaveRequestService.ts
import api from "@/lib/api";
import { mapLeaveAdmin, LeaveUI } from "./leaveRequestMapper";
import { mapLeaveEmployee, LeaveEmployeeUI } from "./leaveRequestMapper";

export const getLeaveRequests = async (): Promise<LeaveUI[]> => {
  const res = await api.get("/leave-requests/show/my-leave-requests");
  return res.data.data.map(mapLeaveAdmin);
};

export const approveLeaveRequest = async (id: number) => {
  return api.patch(`/leave-requests/update-leave-status/${id}`, {
    status: "APPROVED",
  });
};

export const rejectLeaveRequest = async (id: number, reason: string) => {
  return api.patch(`/leave-requests/update-leave-status/${id}`, {
    status: "REJECTED",
    rejectionReason: reason,
  });
};

// EMPLOYEE - get my leaves
export const getMyLeaveRequests = async (): Promise<LeaveEmployeeUI[]> => {
  const res = await api.get("/leave-requests/show/my-leave-requests");
  return res.data.data.map(mapLeaveEmployee);
};

// EMPLOYEE - create
export const createLeaveRequest = async (formData: FormData) => {
  return api.post(
    "/leave-requests/create-leave-request",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
};

export const updateLeaveRequest = async (
  id: number,
  formData: FormData
) => {
  return api.patch(
    `/leave-requests/update-leave-request/${id}`,
    formData,
    { headers: {"Content-Type": "multipart/form-data",}, }
  );
};


// EMPLOYEE - cancel
export const cancelLeaveRequest = async (id: number) => {
  return api.patch(`/leave-requests/cancel-leave-request/${id}`);
};