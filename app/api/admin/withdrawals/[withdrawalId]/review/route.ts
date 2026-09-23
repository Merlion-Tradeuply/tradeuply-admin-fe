import { authenticatedAdminRequest, jsonProxyResponse } from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
export async function PATCH(request: Request, context: { params: Promise<{ withdrawalId: string }> }) {
  const { withdrawalId } = await context.params;
  return jsonProxyResponse(await authenticatedAdminRequest(request, `${API_ENDPOINTS.backend.withdrawals}/${withdrawalId}/review`, { body: await request.text(), headers: { "Content-Type": "application/json" }, method: "PATCH" }));
}
