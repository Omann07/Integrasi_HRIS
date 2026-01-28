import api from "../api";
import { mapPlanToUI, PlanApi } from "./planMapper";

// SUBSCRIPTION
export const getSubscriptionPlans = async () => {
  const res = await api.get("/plans/show/subscription");

  return res.data.data.map((plan: PlanApi) =>
    mapPlanToUI(plan)
  );
};

// PAYGO
export const getPaygoPlans = async () => {
  const res = await api.get("/plans/show/paygo");

  return res.data.data.map((plan: PlanApi) =>
    mapPlanToUI(plan)
  );
};

export const getPlanById = async (id: number) => {
    const res = await api.get(`/plans/show/${id}`);
    return res.data.data;
};

export const createTransaction = async (planId: number) => {
  const res = await api.post("/payment/create-transactions", {
    planId,
  });

  return res.data;
};

  