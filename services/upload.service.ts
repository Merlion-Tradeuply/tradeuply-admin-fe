import type { AdminPaymentMethod } from "@/lib/api/types";

type UploadResponse = {
  data?: { method: AdminPaymentMethod };
  error?: { message: string };
};

type UploadPaymentMethodQrOptions = {
  file: File;
  methodId: string;
  onProgress: (percentage: number) => void;
};

export function uploadPaymentMethodQrCode({
  file,
  methodId,
  onProgress,
}: UploadPaymentMethodQrOptions) {
  return new Promise<AdminPaymentMethod>((resolve, reject) => {
    const body = new FormData();
    const request = new XMLHttpRequest();

    body.append("file", file);
    request.open("POST", `/api/admin/payment-methods/${methodId}/qr-code`);

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener("load", () => {
      let result: UploadResponse = {};

      try {
        result = JSON.parse(request.responseText) as UploadResponse;
      } catch {
        reject(new Error("The upload service returned an invalid response."));
        return;
      }

      if (request.status < 200 || request.status >= 300 || !result.data?.method) {
        reject(new Error(result.error?.message ?? "The QR code could not be uploaded."));
        return;
      }

      onProgress(100);
      resolve(result.data.method);
    });

    request.addEventListener("error", () => {
      reject(new Error("The QR code upload was interrupted."));
    });

    request.send(body);
  });
}
