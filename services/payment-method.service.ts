import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AdminPaymentMethod } from "@/lib/api/types";

export type PaymentMethodPayload = {
  asset: string | null;
  category: AdminPaymentMethod["category"];
  code?: string;
  displayOrder: number;
  instructions: string;
  maximumAmount: number | null;
  minimumAmount: number | null;
  name: string;
  network: string | null;
  status: AdminPaymentMethod["status"];
  walletAddress: string | null;
};

type ApiResponse<T> = {
  data?: T;
  error?: { message: string };
  message?: string;
};

export type PaymentMethodFilters = {
  category?: "bank" | "card" | "crypto" | "wallet";
  query?: string;
  sort?: "display-order" | "name-asc" | "name-desc";
  status?: "active" | "coming_soon" | "disabled";
};

export type PaymentMethodSummary = {
  active: number;
  all: number;
  coming_soon: number;
  disabled: number;
};

async function readResponse<T>(response: Response) {
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.data) {
    throw new Error(
      result.error?.message ?? "The request could not be completed.",
    );
  }

  return result;
}

export async function getPaymentMethods(filters: PaymentMethodFilters = {}) {
  const parameters = new URLSearchParams();

  if (filters.category) parameters.set("category", filters.category);
  if (filters.query?.trim()) parameters.set("q", filters.query.trim());
  if (filters.sort) parameters.set("sort", filters.sort);
  if (filters.status) parameters.set("status", filters.status);

  const queryString = parameters.toString();
  const response = await fetch(
    `${API_ENDPOINTS.frontend.paymentMethods}${queryString ? `?${queryString}` : ""}`,
  );
  const result = await readResponse<{
    methods: AdminPaymentMethod[];
    summary: PaymentMethodSummary;
  }>(response);
  return result.data!;
}

export async function savePaymentMethod(
  payload: PaymentMethodPayload,
  methodId?: string,
) {
  const endpoint = methodId
    ? `${API_ENDPOINTS.frontend.paymentMethods}/${methodId}`
    : API_ENDPOINTS.frontend.paymentMethods;
  const response = await fetch(endpoint, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: methodId ? "PATCH" : "POST",
  });
  const result = await readResponse<{ method: AdminPaymentMethod }>(response);
  return result.data!.method;
}

export async function deletePaymentMethods(ids: string[]) {
  const response = await fetch(API_ENDPOINTS.frontend.paymentMethods, {
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  });
  const result = await readResponse<{ deletedCount: number }>(response);
  return result.data!.deletedCount;
}
