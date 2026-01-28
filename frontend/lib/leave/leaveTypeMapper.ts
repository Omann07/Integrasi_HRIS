/* ================= BACKEND RESPONSE TYPE ================= */

export type LeaveTypeAPI = {
  id: number;
  companyId: number;
  name: string;
  maxDays: number;
  description: string | null;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type GetLeaveTypesAPIResponse = {
  message: string;
  count: number;
  data: LeaveTypeAPI[];
};

export type LeaveTypeSingleAPIResponse = {
  message: string;
  data: LeaveTypeAPI;
};

/* ================= UI TYPE ================= */

export type LeaveTypeUI = {
  id: number;
  name: string;
  maxDays: number;
  description: string;
  isPaid: boolean;
};

/* ================= MAPPER ================= */

export const mapLeaveTypeToUI = (
  apiData: LeaveTypeAPI
): LeaveTypeUI => ({
  id: apiData.id,
  name: apiData.name,
  maxDays: apiData.maxDays,
  description: apiData.description ?? "-",
  isPaid: apiData.isPaid,
});
