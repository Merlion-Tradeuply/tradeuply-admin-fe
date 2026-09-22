import "server-only";

import { cookies } from "next/headers";

import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/admin-session";
import { requestBackend } from "@/lib/api/backend";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { InternalUser } from "@/lib/api/types";

export async function getCurrentAdminUser() {
  const accessToken = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) return { status: 401, user: null };

  const result = await requestBackend(API_ENDPOINTS.backend.me, {
    headers: { Authorization: `Bearer ${accessToken}` },
    method: "GET",
  });

  if (result.status !== 200) return { status: result.status, user: null };

  const response = JSON.parse(result.body) as {
    data: { user: InternalUser };
  };

  return { status: 200, user: response.data.user };
}
