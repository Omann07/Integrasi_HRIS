export interface PlanApi {
    id: number;
    name: string;
    price: number;
    description: string | null;
    detail: string | null;
    maxEmployees: number | null;
    planType: "SUBSCRIPTION" | "PAYGO" | "TRIAL";
  }
  
  export interface PlanUI {
    id: number;
    name: string;
    price: string;
    description: string;
    limit: string;
    features: string[];
  }
  
  export const mapPlanToUI = (plan: PlanApi): PlanUI => {
  
    let features: string[] = [];
  
    if (plan.detail) {
      features = plan.detail
        .split("\n")                 // pecah per baris
        .map(line => line.replace(/^-\s*/, "").trim()) // hapus "- "
        .filter(Boolean);            // hapus kosong
    }
  
    return {
      id: plan.id,
      name: plan.name,
      price: plan.price.toLocaleString("id-ID"),
      description: plan.description ?? "",
      limit: plan.maxEmployees
        ? `≤ ${plan.maxEmployees} employees`
        : "Unlimited employees",
      features,
    };
  };
  