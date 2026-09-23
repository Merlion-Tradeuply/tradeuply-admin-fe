import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AdminClient, AdminClientDetails } from "@/lib/api/types";

export type ClientUpdatePayload = {
  experience: AdminClient["investmentProfile"]["experience"];
  firstName: string;
  investmentRange: AdminClient["investmentProfile"]["investmentRange"];
  lastName: string;
  objective: AdminClient["investmentProfile"]["objective"];
  phone: string;
  status: AdminClient["status"];
};

export type ClientFilters = {
  limit?: number;
  page?: number;
  query?: string;
  status?: "all" | AdminClient["status"];
};

export type ClientPagination = {
  limit: number;
  page: number;
  pages: number;
  total: number;
};

export type ClientSummary = {
  active: number;
  all: number;
  pending_verification: number;
  suspended: number;
};

type ApiResponse<T> = {
  data?: T;
  error?: { message: string };
};

async function readResponse<T>(response: Response) {
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.data) {
    throw new Error(
      result.error?.message ?? "The request could not be completed.",
    );
  }

  return result.data;
}

export async function getClients(filters: ClientFilters = {}) {
  const parameters = new URLSearchParams();
  if (filters.limit) parameters.set("limit", String(filters.limit));
  if (filters.page) parameters.set("page", String(filters.page));
  if (filters.query?.trim()) parameters.set("query", filters.query.trim());
  if (filters.status) parameters.set("status", filters.status);

  const queryString = parameters.toString();
  const response = await fetch(
    `${API_ENDPOINTS.frontend.clients}${queryString ? `?${queryString}` : ""}`,
  );
  return readResponse<{
    clients: AdminClient[];
    pagination: ClientPagination;
    summary: ClientSummary;
  }>(response);
}

export async function getClientDetails(clientId: string) {
  const response = await fetch(`${API_ENDPOINTS.frontend.clients}/${clientId}`);
  return readResponse<AdminClientDetails>(response);
}

export async function updateClient(
  clientId: string,
  payload: ClientUpdatePayload,
) {
  const response = await fetch(
    `${API_ENDPOINTS.frontend.clients}/${clientId}`,
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );
  return (await readResponse<{ client: AdminClient }>(response)).client;
}

export async function deleteClients(ids: string[]) {
  const response = await fetch(API_ENDPOINTS.frontend.clients, {
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  });
  return (await readResponse<{ deletedCount: number }>(response)).deletedCount;
}
