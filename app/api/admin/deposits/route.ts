import { authenticatedAdminRequest, jsonProxyResponse } from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const status = requestUrl.searchParams.get("status") ?? "all";
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.deposits}?status=${encodeURIComponent(status)}`,
      { method: "GET" },
    ),
  );
}
