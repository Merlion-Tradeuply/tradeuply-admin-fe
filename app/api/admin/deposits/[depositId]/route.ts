import { authenticatedAdminRequest, jsonProxyResponse } from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(
  request: Request,
  context: { params: Promise<{ depositId: string }> },
) {
  const { depositId } = await context.params;
  return jsonProxyResponse(
    await authenticatedAdminRequest(request, `${API_ENDPOINTS.backend.deposits}/${depositId}`, { method: "GET" }),
  );
}
