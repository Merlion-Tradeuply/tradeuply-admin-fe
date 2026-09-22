import { authenticatedAdminRequest, jsonProxyResponse } from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.investmentPlans}${query ? `?${query}` : ""}`,
      { method: "GET" },
    ),
  );
}

export async function POST(request: Request) {
  return jsonProxyResponse(
    await authenticatedAdminRequest(request, API_ENDPOINTS.backend.investmentPlans, {
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

export async function DELETE(request: Request) {
  return jsonProxyResponse(
    await authenticatedAdminRequest(request, API_ENDPOINTS.backend.investmentPlans, {
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    }),
  );
}
