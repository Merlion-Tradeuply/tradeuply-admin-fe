import "server-only";

import { cookies } from "next/headers";

import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/admin-session";
import { requestBackend } from "@/lib/api/backend";
import { refreshAdminSession } from "@/lib/auth/refresh-session";

export async function authenticatedAdminRequest(
  request: Request,
  backendPath: string,
  init: RequestInit = {},
) {
  const accessToken = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return {
      body: JSON.stringify({
        error: { code: "UNAUTHENTICATED", message: "Administrator access is required." },
        success: false,
      }),
      status: 401,
    };
  }

  let result = await requestBackend(backendPath, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
  });

  if (result.status === 401) {
    const session = await refreshAdminSession(request);

    if (session) {
      result = await requestBackend(backendPath, {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${session.data.tokens.accessToken}`,
        },
      });
    }
  }

  return result;
}

export async function streamAuthenticatedAdminUpload(
  request: Request,
  backendPath: string,
) {
  const accessToken = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return {
      body: JSON.stringify({
        error: { code: "UNAUTHENTICATED", message: "Administrator access is required." },
        success: false,
      }),
      status: 401,
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");

  if (contentType) headers["Content-Type"] = contentType;
  if (contentLength) headers["Content-Length"] = contentLength;

  return requestBackend(backendPath, {
    body: request.body,
    duplex: "half",
    headers,
    method: "POST",
  } as RequestInit);
}

export function jsonProxyResponse(result: { body: string; status: number }) {
  return new Response(result.body, {
    headers: { "Content-Type": "application/json" },
    status: result.status,
  });
}
