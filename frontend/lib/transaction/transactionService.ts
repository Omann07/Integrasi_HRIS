import api from "@/lib/api";
import {
  mapTransactionToUI,
  mapTransactionDetailToUI,
} from "./transactionMapper";

export const getTransactionHistory = async () => {
  const res = await api.get(
    "/payment/show-transactions/history"
  );

  return res.data.data.map(mapTransactionToUI);
};

export const getBillingTransactions = async () => {
  const res = await api.get(
    "/payment/show-transactions/billing"
  );

  return res.data.data.map(mapTransactionToUI);
};

export const getTransactionDetail = async (id: number) => {
  const res = await api.get(
    `/payment/show-transactions/${id}`
  );

  return mapTransactionDetailToUI(res.data.data);
};

export const createTransaction = async (planId: number) => {
  const res = await api.post(
    "/payment/create-transactions",
    { planId }
  );

  return res.data;
};
