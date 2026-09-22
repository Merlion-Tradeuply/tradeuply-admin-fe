import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AdminTransaction } from "@/lib/api/types";

type ApiResponse<T> = {
  data?: T;
  error?: { message: string };
};

export type TransactionFilters = {
  direction?: AdminTransaction["direction"];
  query?: string;
  type?: AdminTransaction["type"];
};

export type TransactionSummary = {
  all: number;
  credit: number;
  debit: number;
  depositedVolume: string;
};

async function readResponse<T>(response: Response) {
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.data) {
    throw new Error(
      result.error?.message ?? "The transactions could not be loaded.",
    );
  }

  return result.data;
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const parameters = new URLSearchParams();
  if (filters.direction) parameters.set("direction", filters.direction);
  if (filters.query?.trim()) parameters.set("q", filters.query.trim());
  if (filters.type) parameters.set("type", filters.type);

  const queryString = parameters.toString();
  const response = await fetch(
    `${API_ENDPOINTS.frontend.transactions}${queryString ? `?${queryString}` : ""}`,
  );
  return readResponse<{
    summary: TransactionSummary;
    transactions: AdminTransaction[];
  }>(response);
}

export async function deleteTransactions(ids: string[]) {
  const response = await fetch(API_ENDPOINTS.frontend.transactions, {
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  });
  const result = await readResponse<{ deletedCount: number }>(response);
  return result.deletedCount;
}
