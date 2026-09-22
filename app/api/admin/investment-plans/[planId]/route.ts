import { authenticatedAdminRequest, jsonProxyResponse } from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/investment-plans/[planId]">,
) {
  const { planId } = await context.params;
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.investmentPlans}/${planId}`,
      {
        body: await request.text(),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      },
    ),
  );
}
