import {
  jsonProxyResponse,
  streamAuthenticatedAdminUpload,
} from "@/lib/api/authenticated-proxy";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function POST(
  request: Request,
  context: { params: Promise<{ methodId: string }> },
) {
  const { methodId } = await context.params;
  const result = await streamAuthenticatedAdminUpload(
    request,
    `${API_ENDPOINTS.backend.paymentMethods}/${methodId}/qr-code`,
  );

  return jsonProxyResponse(result);
}
