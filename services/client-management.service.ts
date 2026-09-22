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

export async function getClients() {
  const response = await fetch(API_ENDPOINTS.frontend.clients);
  return (await readResponse<{ clients: AdminClient[] }>(response)).clients;
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
