// lib/leaveRequestMapper.ts
export type LeaveUI = {
    id: number;
    name: string;
    type: string;
    start: string;
    end: string;
    days: string;
    reason: string;
    attachment: string;
    status: "pending" | "approved" | "rejected";
    approvedAt: string;
    rejectedReason: string;
  };
  
export const mapLeaveAdmin = (item: any): LeaveUI => ({
    id: item.id,
    name: item.employee.fullName,
    type: item.leaveType.name,
    start: item.startDate.split("T")[0],
    end: item.endDate.split("T")[0],
    days: `${item.totalDays} Day`,
    reason: item.reason,
    attachment: item.attachment
      ? `http://localhost:8000/uploads/leaveAttachments/${item.attachment}`
      : "/no-image.png",
    status: item.status.toLowerCase(),
    approvedAt: item.approvedAt
      ? new Date(item.approvedAt).toLocaleString()
      : "-",
    rejectedReason: item.rejectionReason ?? "-",
  });
  
// lib/leave/leaveRequestMapper.ts

export type LeaveEmployeeUI = {
  id: number;
  leaveTypeId: number;
  name: string;
  type: string;
  start: string;
  end: string;
  days: number;
  reason: string;
  attachment: string;
  status: "pending" | "approved" | "rejected";
  approvedAt: string;
  rejectedReason: string;
};

const BASE_URL = "http://localhost:8000/uploads/leaveAttachments";

export const mapLeaveEmployee = (item: any): LeaveEmployeeUI => ({
  id: item.id,
  leaveTypeId: item.leaveTypeId,
  name: item.employee?.fullName ?? "-",
  type: item.leaveType?.name ?? "-",
  start: item.startDate?.split("T")[0] ?? "-",
  end: item.endDate?.split("T")[0] ?? "-",
  days: item.totalDays ?? 0,
  reason: item.reason ?? "-",

  attachment:
    item.attachment && item.attachment.trim() !== ""
      ? `${BASE_URL}/${item.attachment}?t=${Date.now()}`
      : "",

  status: item.status?.toLowerCase() ?? "pending",

  approvedAt: item.approvedAt
    ? new Date(item.approvedAt).toLocaleTimeString("en-GB")
    : "-",

  rejectedReason: item.rejectionReason ?? "-",
});
