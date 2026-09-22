import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AdminTransaction } from "@/lib/api/types";

type TransactionsResponse = {
  data?: { transactions: AdminTransaction[] };
  error?: { message: string };
};

export async function getTransactions() {
  const response = await fetch(API_ENDPOINTS.frontend.transactions);
  const result = (await response.json()) as TransactionsResponse;

  if (!response.ok || !result.data) {
    throw new Error(
      result.error?.message ?? "The transactions could not be loaded.",
    );
  }

  return result.data.transactions;
}
