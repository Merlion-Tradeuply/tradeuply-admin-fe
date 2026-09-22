import { authenticatedAdminRequest, jsonProxyResponse } from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ methodId: string }> },
) {
  const { methodId } = await context.params;
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.paymentMethods}/${methodId}`,
      {
        body: await request.text(),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      },
    ),
  );
}
