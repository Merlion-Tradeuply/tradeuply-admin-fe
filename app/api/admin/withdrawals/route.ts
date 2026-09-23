import { authenticatedAdminRequest, jsonProxyResponse } from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return jsonProxyResponse(await authenticatedAdminRequest(request, `${API_ENDPOINTS.backend.withdrawals}${query ? `?${query}` : ""}`, { method: "GET" }));
}
