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

async function readResponse<T>(response: Response) {
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.data) {
    throw new Error(
      result.error?.message ?? "The request could not be completed.",
    );
  }

  return result;
}

export async function getPaymentMethods() {
  const response = await fetch(API_ENDPOINTS.frontend.paymentMethods);
  const result = await readResponse<{ methods: AdminPaymentMethod[] }>(
    response,
  );
  return result.data!.methods;
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
