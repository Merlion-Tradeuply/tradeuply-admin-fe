import {
  authenticatedAdminRequest,
  jsonProxyResponse,
} from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ clientId: string; investmentId: string }>;
  },
) {
  const { clientId, investmentId } = await context.params;
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.clients}/${clientId}/investments/${investmentId}/bonus`,
      {
        body: await request.text(),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    ),
  );
}
