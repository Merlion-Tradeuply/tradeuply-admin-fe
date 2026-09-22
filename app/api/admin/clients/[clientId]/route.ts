import {
  authenticatedAdminRequest,
  jsonProxyResponse,
} from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await context.params;
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.clients}/${clientId}`,
      { method: "GET" },
    ),
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await context.params;
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.clients}/${clientId}`,
      {
        body: await request.text(),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      },
    ),
  );
}
