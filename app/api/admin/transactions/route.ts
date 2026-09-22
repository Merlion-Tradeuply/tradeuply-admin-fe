import {
  authenticatedAdminRequest,
  jsonProxyResponse,
} from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const queryString = requestUrl.searchParams.toString();
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.transactions}${queryString ? `?${queryString}` : ""}`,
      { method: "GET" },
    ),
  );
}

export async function DELETE(request: Request) {
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      API_ENDPOINTS.backend.transactions,
      {
        body: await request.text(),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      },
    ),
  );
}
