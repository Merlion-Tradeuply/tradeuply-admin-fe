import "server-only";

const requestTimeoutMs = 15_000;

function getBackendBaseUrl() {
  const backendUrl = process.env.BACKEND_API_URL?.trim().replace(/\/$/, "");

  if (!backendUrl) throw new Error("BACKEND_API_URL is not configured.");
  return backendUrl;
}

export async function requestBackend(path: string, init: RequestInit = {}) {
  try {
    const response = await fetch(`${getBackendBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers: { Accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    return { body: await response.text(), status: response.status };
  } catch (error) {
    console.error("Admin backend request failed.", error);

    return {
      body: JSON.stringify({
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "The administration service is temporarily unavailable.",
        },
        success: false,
      }),
      status: 503,
    };
  }
}
