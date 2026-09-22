import {
  authenticatedAdminRequest,
  jsonProxyResponse,
} from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get("query") ?? "";
  const status = requestUrl.searchParams.get("status") ?? "all";
  const backendPath = `${API_ENDPOINTS.backend.clients}?query=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`;

  return jsonProxyResponse(
    await authenticatedAdminRequest(request, backendPath, { method: "GET" }),
  );
}

export async function DELETE(request: Request) {
  return jsonProxyResponse(
    await authenticatedAdminRequest(request, API_ENDPOINTS.backend.clients, {
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    }),
  );
}
