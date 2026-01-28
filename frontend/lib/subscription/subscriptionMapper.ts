// ===== API RESPONSE TYPE =====
export interface ApiSubscription {
    id: number;
    status: "ACTIVE" | "EXPIRED";
    startDate: string;
    endDate: string;
    remainingDays: number;
    autoRenew: boolean;
    plan: {
      name: string;
      maxEmployees: number | null;
    };
  }
  
  // ===== UI TYPE =====
  export interface UISubscription {
    id: number;
    planName: string;
    maxEmployeesLabel: string;
    status: string;
    remainingDays: number;
    startDateLabel: string;
    endDateLabel: string;
    autoRenew: boolean;
    progressPercent: number;
  }
  
  // ===== HELPER =====
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  
  // ===== MAPPER =====
  export function mapSubscriptionToUI(
    api: ApiSubscription
  ): UISubscription {
  
    const totalDays =
      (new Date(api.endDate).getTime() -
        new Date(api.startDate).getTime()) /
      (1000 * 60 * 60 * 24);
  
    const progress =
      totalDays > 0
        ? Math.min(
            100,
            Math.round(
              ((totalDays - api.remainingDays) / totalDays) * 100
            )
          )
        : 100;
  
    return {
      id: api.id,
      planName: api.plan.name,
      maxEmployeesLabel: api.plan.maxEmployees
        ? `≤ ${api.plan.maxEmployees} employees`
        : "Unlimited employees",
      status: api.status,
      remainingDays: api.remainingDays,
      startDateLabel: formatDate(api.startDate),
      endDateLabel: formatDate(api.endDate),
      autoRenew: api.autoRenew,
      progressPercent: progress,
    };
  }
  