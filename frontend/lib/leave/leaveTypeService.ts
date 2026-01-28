import api from "@/lib/api";
import {
  GetLeaveTypesAPIResponse,
  LeaveTypeSingleAPIResponse,
  LeaveTypeUI,
  mapLeaveTypeToUI,
} from "./leaveTypeMapper";

/* ================= GET ================= */

export async function getLeaveTypes(): Promise<LeaveTypeUI[]> {
  const res = await api.get<GetLeaveTypesAPIResponse>(
    "/leave-types/show/leave-types"
  );

  return res.data.data.map(mapLeaveTypeToUI);
}

/* ================= CREATE ================= */

export async function createLeaveType(payload: {
  name: string;
  maxDays: number;
  description?: string;
  isPaid: boolean;
}): Promise<LeaveTypeUI> {
  const res = await api.post<LeaveTypeSingleAPIResponse>(
    "/leave-types/create-leave-type",
    payload
  );

  return mapLeaveTypeToUI(res.data.data);
}

/* ================= UPDATE ================= */

export async function updateLeaveType(
  id: number,
  payload: Partial<{
    name: string;
    maxDays: number;
    description: string;
    isPaid: boolean;
  }>
): Promise<LeaveTypeUI> {
  const res = await api.patch<LeaveTypeSingleAPIResponse>(
    `/leave-types/update-leave-type/${id}`,
    payload
  );

  return mapLeaveTypeToUI(res.data.data);
}

/* ================= DELETE ================= */

export async function deleteLeaveType(id: number): Promise<void> {
  await api.delete(`/leave-types/delete-leave-type/${id}`);
}
