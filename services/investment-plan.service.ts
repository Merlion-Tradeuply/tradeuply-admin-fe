import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AdminInvestmentPlan } from "@/lib/api/types";

type ApiResponse<T> = { data?: T; error?: { message: string } };

export type InvestmentPlanFilters = {
  featured?: boolean;
  limit?: number;
  page?: number;
  query?: string;
  risk?: string;
  sort?: "display-order" | "minimum-asc" | "minimum-desc" | "name-asc" | "name-desc";
  status?: AdminInvestmentPlan["status"];
};

export type InvestmentPlanPagination = {
  limit: number;
  page: number;
  pages: number;
  total: number;
};

export type InvestmentPlanSummary = {
  active: number;
  all: number;
  coming_soon: number;
  disabled: number;
  featured: number;
};

export type InvestmentPlanPayload = Omit<AdminInvestmentPlan, "id" | "slug"> & {
  slug?: string;
};

async function readResponse<T>(response: Response) {
  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !result.data) {
    throw new Error(result.error?.message ?? "The request could not be completed.");
  }
  return result.data;
}

export async function getInvestmentPlans(filters: InvestmentPlanFilters = {}) {
  const parameters = new URLSearchParams();
  if (filters.featured !== undefined) parameters.set("featured", String(filters.featured));
  if (filters.limit) parameters.set("limit", String(filters.limit));
  if (filters.page) parameters.set("page", String(filters.page));
  if (filters.query?.trim()) parameters.set("q", filters.query.trim());
  if (filters.risk) parameters.set("risk", filters.risk);
  if (filters.sort) parameters.set("sort", filters.sort);
  if (filters.status) parameters.set("status", filters.status);
  const query = parameters.toString();
  const response = await fetch(
    `${API_ENDPOINTS.frontend.investmentPlans}${query ? `?${query}` : ""}`,
  );
  return readResponse<{
    pagination: InvestmentPlanPagination;
    plans: AdminInvestmentPlan[];
    risks: string[];
    summary: InvestmentPlanSummary;
  }>(response);
}

export async function saveInvestmentPlan(payload: InvestmentPlanPayload, planId?: string) {
  const endpoint = planId
    ? `${API_ENDPOINTS.frontend.investmentPlans}/${planId}`
    : API_ENDPOINTS.frontend.investmentPlans;
  const response = await fetch(endpoint, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: planId ? "PATCH" : "POST",
  });
  return readResponse<{ plan: AdminInvestmentPlan }>(response);
}

export async function deleteInvestmentPlans(ids: string[]) {
  const response = await fetch(API_ENDPOINTS.frontend.investmentPlans, {
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  });
  return readResponse<{ deletedCount: number }>(response);
}
