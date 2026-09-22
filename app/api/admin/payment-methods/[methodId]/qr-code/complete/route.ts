import {
  authenticatedAdminRequest,
  jsonProxyResponse,
} from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function POST(
  request: Request,
  context: { params: Promise<{ methodId: string }> },
) {
  const { methodId } = await context.params;
  return jsonProxyResponse(
    await authenticatedAdminRequest(
      request,
      `${API_ENDPOINTS.backend.paymentMethods}/${methodId}/qr-code/complete`,
      {
        body: await request.text(),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    ),
  );
}
