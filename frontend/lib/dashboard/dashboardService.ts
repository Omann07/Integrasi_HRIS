// lib/dashboardService.ts
import api from "@/lib/api";
import {
  mapAdminDashboard,
  mapEmployeeDashboard,
  AdminDashboardUI,
  EmployeeDashboardUI,
} from "@/lib/dashboard/dashboardMapper";

export const dashboardService = {
  getAdminDashboard: async (): Promise<AdminDashboardUI> => {
    const res = await api.get("/attendance/admin-dashboard");
    return mapAdminDashboard(res.data);
  },

  getEmployeeDashboard: async (): Promise<EmployeeDashboardUI> => {
    const res = await api.get("/attendance/employee-dashboard");
    return mapEmployeeDashboard(res.data);
  },
};
