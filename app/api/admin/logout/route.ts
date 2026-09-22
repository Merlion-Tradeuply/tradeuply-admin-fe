import { cookies } from "next/headers";

import { ADMIN_REFRESH_TOKEN_COOKIE } from "@/lib/admin-session";
import { requestBackend } from "@/lib/api/backend";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { clearAdminSessionCookies } from "@/lib/auth/session-cookies";

export async function POST() {
  const refreshToken = (await cookies()).get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    await requestBackend(API_ENDPOINTS.backend.logout, {
      body: JSON.stringify({ refreshToken }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  }

  await clearAdminSessionCookies();
  return Response.json({ message: "You have logged out successfully.", success: true });
}
