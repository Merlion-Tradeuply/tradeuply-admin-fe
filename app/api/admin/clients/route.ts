import {
  authenticatedAdminRequest,
  jsonProxyResponse,
} from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const limit = requestUrl.searchParams.get("limit") ?? "10";
  const page = requestUrl.searchParams.get("page") ?? "1";
  const query = requestUrl.searchParams.get("query") ?? "";
  const status = requestUrl.searchParams.get("status") ?? "all";
  const parameters = new URLSearchParams({ limit, page, query, status });
  const backendPath = `${API_ENDPOINTS.backend.clients}?${parameters.toString()}`;

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
