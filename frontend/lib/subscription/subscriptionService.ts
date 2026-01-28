import api from "../api";
import {
  mapSubscriptionToUI,
} from "./subscriptionMapper";

// GET ACTIVE SUBSCRIPTION
export const getMySubscription = async () => {
  const res = await api.get("/payment/show-subscription");

  return res.data.data.map(mapSubscriptionToUI);
};

// UPDATE AUTO RENEW
export const updateAutoRenew = async (autoRenew: boolean) => {
  const res = await api.patch("/payment/auto-renew", {
    autoRenew,
  });

  return res.data;
};
