import { requestBackend } from "@/lib/api/backend";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendLoginResponse } from "@/lib/api/types";
import { setAdminSessionCookies } from "@/lib/auth/session-cookies";

export async function POST(request: Request) {
  const result = await requestBackend(API_ENDPOINTS.backend.login, {
    body: await request.text(),
    headers: {
      "Content-Type": "application/json",
      "User-Agent": request.headers.get("user-agent") ?? "",
    },
    method: "POST",
  });

  if (result.status !== 200) {
    return new Response(result.body, {
      headers: { "Content-Type": "application/json" },
      status: result.status,
    });
  }

  const session = JSON.parse(result.body) as BackendLoginResponse;
  await setAdminSessionCookies(session.data.tokens);

  return Response.json({
    data: { user: session.data.user },
    message: session.message,
    success: true,
  });
}
