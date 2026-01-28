// lib/dashboardMapper.ts

/* =========================
   ADMIN DASHBOARD
========================= */

export type AdminDashboardUI = {
  summary: {
    alpha: number;
    onTime: number;
    late: number;
    leave: number;
  };
  refinedLists: {
    alpha: EmployeeEntry[];
    onTime: EmployeeEntry[];
    late: EmployeeEntry[];
    leave: EmployeeEntry[];
  };
};

type EmployeeEntry = {
  id: number;
  name?: string;
  status: "ALPHA" | "ONTIME" | "LATE" | string;
};

type AdminDashboardAPI = {
  summary?: {
    leave?: number;
  };
  lists?: {
    employeeDataEntry?: EmployeeEntry[];
    leave?: EmployeeEntry[];
  };
};

export const mapAdminDashboard = (
  data: AdminDashboardAPI
): AdminDashboardUI => {
  const lists = data.lists ?? {};
  const allEntries = lists.employeeDataEntry ?? [];

  const alphaList = allEntries.filter(
    (emp) => emp.status === "ALPHA"
  );

  const onTimeList = allEntries.filter(
    (emp) => emp.status === "ONTIME"
  );

  const lateList = allEntries.filter(
    (emp) => emp.status === "LATE"
  );

  return {
    summary: {
      alpha: alphaList.length,
      onTime: onTimeList.length,
      late: lateList.length,
      leave: data.summary?.leave ?? 0,
    },
    refinedLists: {
      alpha: alphaList,
      onTime: onTimeList,
      late: lateList,
      leave: lists.leave ?? [],
    },
  };
};

/* =========================
   EMPLOYEE DASHBOARD
========================= */

export type EmployeeDashboardUI = {
  summary: {
    totalWorkHours: string;
    onTime: number;
    late: number;
    leave: number;
    alpha: number;
  };
  overviewData: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
  workHoursData: {
    day: string;
    hours: number;
  }[];
};

type EmployeeDashboardAPI = {
  summary?: {
    totalWorkHours?: string;
    onTime?: number;
    late?: number;
    leave?: number;
    alpha?: number;
  };
  charts?: {
    workHoursDaily?: {
      date: string;
      hours: number;
    }[];
  };
};

export const mapEmployeeDashboard = (
  data: EmployeeDashboardAPI
): EmployeeDashboardUI => {
  const summary = data.summary ?? {};
  const charts = data.charts ?? {};

  return {
    summary: {
      totalWorkHours: summary.totalWorkHours ?? "0h 0m",
      onTime: summary.onTime ?? 0,
      late: summary.late ?? 0,
      leave: summary.leave ?? 0,
      alpha: summary.alpha ?? 0,
    },

    overviewData: [
      { subject: "On Time", A: summary.onTime ?? 0, fullMark: 30 },
      { subject: "Late", A: summary.late ?? 0, fullMark: 30 },
      { subject: "Leave/Sick", A: summary.leave ?? 0, fullMark: 30 },
      { subject: "Alpha", A: summary.alpha ?? 0, fullMark: 30 },
    ],

    workHoursData:
      charts.workHoursDaily?.map((item) => ({
        day: item.date,
        hours: item.hours,
      })) ?? [],
  };
};
