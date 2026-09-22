import type { AdminPaymentMethod } from "@/lib/api/types";

type UploadResponse = {
  data?: { method: AdminPaymentMethod };
  error?: { message: string };
};

type CloudinarySignatureResponse = {
  data?: {
    upload: {
      apiKey: string;
      folder: string;
      publicId: string;
      signature: string;
      timestamp: number;
      uploadUrl: string;
    };
  };
  error?: { message: string };
};

type CloudinaryUploadResponse = {
  bytes?: number;
  error?: { message?: string };
  format?: "jpg" | "jpeg" | "png" | "webp";
  height?: number;
  public_id?: string;
  signature?: string;
  version?: number;
  width?: number;
};

export type QrUploadStage = "preparing" | "saving" | "uploading";

export type QrUploadProgress = {
  percentage: number;
  stage: QrUploadStage;
};

type UploadPaymentMethodQrOptions = {
  file: File;
  methodId: string;
  onProgress: (progress: QrUploadProgress) => void;
};

async function readApiResponse<T>(response: Response) {
  const result = (await response.json()) as T & { error?: { message: string } };

  if (!response.ok) {
    throw new Error(result.error?.message ?? "The upload request could not be completed.");
  }

  return result;
}

function uploadDirectlyToCloudinary({
  file,
  onProgress,
  upload,
}: {
  file: File;
  onProgress: (progress: QrUploadProgress) => void;
  upload: NonNullable<CloudinarySignatureResponse["data"]>["upload"];
}) {
  return new Promise<Required<Omit<CloudinaryUploadResponse, "error">>>(
    (resolve, reject) => {
      const body = new FormData();
      const request = new XMLHttpRequest();

      body.append("file", file);
      body.append("api_key", upload.apiKey);
      body.append("timestamp", String(upload.timestamp));
      body.append("signature", upload.signature);
      body.append("folder", upload.folder);
      body.append("public_id", upload.publicId);

      request.open("POST", upload.uploadUrl);
      request.timeout = 15 * 60 * 1000;

      request.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress({
            percentage: Math.round((event.loaded / event.total) * 100),
            stage: "uploading",
          });
        }
      });

      request.addEventListener("load", () => {
        let result: CloudinaryUploadResponse = {};

        try {
          result = JSON.parse(request.responseText) as CloudinaryUploadResponse;
        } catch {
          reject(new Error("Cloudinary returned an invalid upload response."));
          return;
        }

        if (
          request.status < 200 ||
          request.status >= 300 ||
          !result.bytes ||
          !result.format ||
          !result.height ||
          !result.public_id ||
          !result.signature ||
          !result.version ||
          !result.width
        ) {
          reject(new Error(result.error?.message ?? "Cloudinary could not upload the QR image."));
          return;
        }

        resolve(result as Required<Omit<CloudinaryUploadResponse, "error">>);
      });

      request.addEventListener("error", () => {
        reject(new Error("The Cloudinary upload was interrupted. Check your connection and retry."));
      });
      request.addEventListener("timeout", () => {
        reject(new Error("The Cloudinary upload timed out. Check your connection and retry."));
      });
      request.addEventListener("abort", () => {
        reject(new Error("The Cloudinary upload was cancelled."));
      });

      request.send(body);
    },
  );
}

export async function uploadPaymentMethodQrCode({
  file,
  methodId,
  onProgress,
}: UploadPaymentMethodQrOptions) {
  onProgress({ percentage: 0, stage: "preparing" });

  const signatureResponse = await readApiResponse<CloudinarySignatureResponse>(
    await fetch(`/api/admin/payment-methods/${methodId}/qr-code/signature`, {
      method: "POST",
    }),
  );
  const upload = signatureResponse.data?.upload;

  if (!upload) throw new Error("Cloudinary upload authorization was not returned.");

  onProgress({ percentage: 0, stage: "uploading" });
  const cloudinaryResult = await uploadDirectlyToCloudinary({
    file,
    onProgress,
    upload,
  });

  onProgress({ percentage: 100, stage: "saving" });
  const completeResponse = await readApiResponse<UploadResponse>(
    await fetch(`/api/admin/payment-methods/${methodId}/qr-code/complete`, {
      body: JSON.stringify({
        bytes: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
        height: cloudinaryResult.height,
        publicId: cloudinaryResult.public_id,
        signature: cloudinaryResult.signature,
        version: cloudinaryResult.version,
        width: cloudinaryResult.width,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );

  if (!completeResponse.data?.method) {
    throw new Error("The uploaded QR image could not be saved.");
  }

  return completeResponse.data.method;
}
