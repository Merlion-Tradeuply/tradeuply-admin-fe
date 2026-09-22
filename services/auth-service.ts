import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { InternalUser } from "@/lib/api/types";

type ApiResponse<T> = {
  data?: T;
  error?: { message?: string };
  message?: string;
  success?: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {};
  }
}

export async function loginAdmin(credentials: LoginCredentials) {
  const response = await fetch(API_ENDPOINTS.frontend.login, {
    body: JSON.stringify(credentials),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const result = await readResponse<{ user: InternalUser }>(response);

  if (!response.ok || !result.data?.user) {
    throw new Error(result.error?.message ?? "Unable to sign in. Please try again.");
  }

  return result.data.user;
}

export async function logoutAdmin() {
  const response = await fetch(API_ENDPOINTS.frontend.logout, { method: "POST" });

  if (!response.ok) {
    throw new Error("Unable to complete sign out.");
  }
}
