/* ================================
   BACKEND DTO TYPES
================================ */

export type PlanDTO = {
  id?: number;
  name: string;
  planType: "SUBSCRIPTION" | "PAYGO" | "TRIAL";
  durationInDays?: number; 
  maxEmployees?: number | null;
};

export type TransactionDTO = {
  id: number;

  type: "PURCHASE" | "RENEWAL";
  status: "PENDING" | "PAID" | "FAILED";

  amount: number;

  createdAt: string;
  expiryDate?: string | null;
  paidAt?: string | null;

  invoiceUrl?: string | null;
  xenditInvoiceId?: string | null;

  paymentMethod?: string | null;
  plan: PlanDTO;
};

/* ================================
   UI TYPES
================================ */

export type TransactionUI = {
  id: number;

  date: string;
  type: string;

  planName: string;
  planType: string;

  amount: string;
  status: string;

  invoiceUrl?: string | null;
  xenditInvoiceId?: string | null;
};

export type TransactionDetailUI = {
  id: number;

  date: string;
  status: string;
  type: string;

  planName: string;
  planType: string;

  amount: string;
  expiryDate: string;
  paidAt: string;

  invoiceUrl?: string | null;
  xenditInvoiceId?: string | null;
  durationInDays: number;
  maxEmployees: string;
  paymentMethod: string;
};

/* ================================
   HELPERS
================================ */

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return `IDR ${amount.toLocaleString("id-ID")}`;
};

/* ================================
   MAPPERS
================================ */

export const mapTransactionToUI = (
  item: TransactionDTO
): TransactionUI => ({
  id: item.id,

  date: formatDate(item.createdAt),
  type: item.type,

  planName: item.plan?.name ?? "-",
  planType: item.plan?.planType ?? "-",

  amount: formatCurrency(item.amount),
  status: item.status,

  invoiceUrl: item.invoiceUrl ?? null,
  xenditInvoiceId: item.xenditInvoiceId ?? null,
});

export const mapTransactionDetailToUI = (
  item: TransactionDTO
): TransactionDetailUI => ({
  id: item.id,

  date: formatDate(item.createdAt),
  status: item.status,
  type: item.type,

  planName: item.plan?.name ?? "-",
  planType: item.plan?.planType ?? "-",

  amount: formatCurrency(item.amount),

  expiryDate: formatDate(item.expiryDate),
  paidAt: formatDate(item.paidAt),

  invoiceUrl: item.invoiceUrl ?? null,
  xenditInvoiceId: item.xenditInvoiceId ?? null,
  durationInDays: item.plan?.durationInDays ?? 0,
  maxEmployees: item.plan?.maxEmployees 
  ? `${item.plan.maxEmployees} Employees` 
  : "-", // Sesuai gambar jika tidak ada maka "-"
  paymentMethod: item.paymentMethod ?? "-",
});
