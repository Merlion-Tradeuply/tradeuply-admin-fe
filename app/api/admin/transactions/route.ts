import {
  authenticatedAdminRequest,
  jsonProxyResponse,
} from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(request: Request) {
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      API_ENDPOINTS.backend.transactions,
      { method: "GET" },
    ),
  );
}
