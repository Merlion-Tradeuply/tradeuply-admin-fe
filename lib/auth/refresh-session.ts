import "server-only";

import { cookies } from "next/headers";

import { ADMIN_REFRESH_TOKEN_COOKIE } from "@/lib/admin-session";
import { requestBackend } from "@/lib/api/backend";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendLoginResponse } from "@/lib/api/types";
import { clearAdminSessionCookies, setAdminSessionCookies } from "./session-cookies";

export async function refreshAdminSession(request: Request) {
  const refreshToken = (await cookies()).get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) return null;

  const result = await requestBackend(API_ENDPOINTS.backend.refresh, {
    body: JSON.stringify({ refreshToken }),
    headers: {
      "Content-Type": "application/json",
      "User-Agent": request.headers.get("user-agent") ?? "",
    },
    method: "POST",
  });

  if (result.status !== 200) {
    await clearAdminSessionCookies();
    return null;
  }

  const session = JSON.parse(result.body) as BackendLoginResponse;
  await setAdminSessionCookies(session.data.tokens);
  return session;
}
