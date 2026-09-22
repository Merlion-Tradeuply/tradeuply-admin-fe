import { authenticatedAdminRequest, jsonProxyResponse } from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(request: Request) {
  return jsonProxyResponse(
    await authenticatedAdminRequest(request, API_ENDPOINTS.backend.paymentMethods, { method: "GET" }),
  );
}

export async function POST(request: Request) {
  return jsonProxyResponse(
    await authenticatedAdminRequest(request, API_ENDPOINTS.backend.paymentMethods, {
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

export async function DELETE(request: Request) {
  return jsonProxyResponse(
    await authenticatedAdminRequest(request, API_ENDPOINTS.backend.paymentMethods, {
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    }),
  );
}
