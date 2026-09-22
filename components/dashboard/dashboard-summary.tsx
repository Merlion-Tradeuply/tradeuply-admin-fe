"use client";

import {
  CheckCircle,
  ClockCountdown,
  PauseCircle,
  SpinnerGap,
  UsersThree,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { DashboardSummary as DashboardSummaryData } from "@/lib/api/types";

const cards = [
  { key: "totalClients", icon: UsersThree, label: "Total clients" },
  { key: "activeClients", icon: CheckCircle, label: "Active clients" },
  {
    key: "pendingVerification",
    icon: ClockCountdown,
    label: "Pending verification",
  },
  { key: "suspendedClients", icon: PauseCircle, label: "Suspended clients" },
] as const;

export function DashboardSummary() {
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);

  useEffect(() => {
    fetch(API_ENDPOINTS.frontend.dashboard)
      .then(async (response) => {
        const result = (await response.json()) as {
          data?: { summary: DashboardSummaryData };
          error?: { message: string };
        };
        if (!response.ok || !result.data) {
          throw new Error(
            result.error?.message ?? "Unable to load dashboard statistics.",
          );
        }
        setSummary(result.data.summary);
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  return (
    <section
      aria-label="Platform summary"
      className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map(({ icon: Icon, key, label }) => (
        <article
          className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_16px_45px_rgba(18,45,72,0.055)]"
          key={key}
        >
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-11 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]">
              <Icon aria-hidden="true" size={23} weight="duotone" />
            </span>
            <span className="rounded-full bg-[#e9f8ef] px-2.5 py-1 text-[0.58rem] font-extrabold tracking-[0.08em] text-[var(--color-brand-hover)] uppercase">
              Live
            </span>
          </div>
          <p className="mt-7 text-[length:var(--text-h2)] font-extrabold tracking-[-0.04em] text-[var(--color-ink)]">
            {summary ? (
              summary[key]
            ) : error ? (
              "—"
            ) : (
              <SpinnerGap className="animate-spin" size={24} />
            )}
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">
            {label}
          </p>
          {error && (
            <p className="mt-3 text-[0.63rem] font-semibold text-[var(--color-danger)]">
              Unavailable
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
