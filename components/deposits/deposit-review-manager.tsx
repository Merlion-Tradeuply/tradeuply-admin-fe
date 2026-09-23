"use client";

import {
  CaretLeft,
  CaretRight,
  Check,
  ClockCounterClockwise,
  Eye,
  MagnifyingGlass,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AdminDeposit } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const statuses = ["all", "pending", "approved", "rejected"] as const;
const statusStyle = {
  approved: "bg-[#e8f8ef] text-[#008d4d]",
  pending: "bg-[#fff6df] text-[#946515]",
  rejected: "bg-[#fff0ec] text-[#b74c39]",
};
const statusLabels = {
  all: "All deposits",
  approved: "Approved",
  pending: "Pending review",
  rejected: "Rejected",
};
type DepositStatusFilter = (typeof statuses)[number];
type DepositPagination = {
  limit: number;
  page: number;
  pages: number;
  total: number;
};
type DepositSummary = Record<DepositStatusFilter, number>;

const emptyPagination: DepositPagination = {
  limit: 10,
  page: 1,
  pages: 1,
  total: 0,
};

const emptySummary: DepositSummary = {
  all: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
};

export function DepositReviewManager() {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [notes, setNotes] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState<DepositPagination>(emptyPagination);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminDeposit | null>(null);
  const [status, setStatus] = useState<DepositStatusFilter>("pending");
  const [summary, setSummary] = useState<DepositSummary>(emptySummary);

  const loadDeposits = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const parameters = new URLSearchParams({
        limit: "10",
        page: String(page),
        q: debouncedQuery,
        status,
      });
      const response = await fetch(
        `${API_ENDPOINTS.frontend.deposits}?${parameters.toString()}`,
      );
      const result = (await response.json()) as {
        data?: {
          deposits: AdminDeposit[];
          pagination: DepositPagination;
          summary: DepositSummary;
        };
        error?: { message: string };
      };
      if (!response.ok || !result.data)
        throw new Error(result.error?.message ?? "Unable to load deposits.");
      if (page > result.data.pagination.pages) {
        setPage(result.data.pagination.pages);
        return;
      }
      setDeposits(result.data.deposits);
      setPagination(result.data.pagination);
      setSummary(result.data.summary);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load deposits.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, page, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDeposits();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadDeposits]);

  async function openDeposit(deposit: AdminDeposit) {
    setError("");
    const response = await fetch(
      `${API_ENDPOINTS.frontend.deposits}/${deposit.id}`,
    );
    const result = (await response.json()) as {
      data?: { deposit: AdminDeposit };
      error?: { message: string };
    };
    if (!response.ok || !result.data) {
      setError(result.error?.message ?? "Unable to load deposit details.");
      return;
    }
    setNotes("");
    setSelected(result.data.deposit);
  }

  async function review(action: "approve" | "reject") {
    if (!selected) return;
    if (action === "reject" && !notes.trim()) {
      setError("Add a reason before rejecting this deposit.");
      return;
    }

    setIsReviewing(true);
    setError("");
    try {
      const response = await fetch(
        `${API_ENDPOINTS.frontend.deposits}/${selected.id}/review`,
        {
          body: JSON.stringify({ action, notes: notes.trim() }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        },
      );
      const result = (await response.json()) as {
        data?: { deposit: AdminDeposit };
        error?: { message: string };
      };
      if (!response.ok || !result.data)
        throw new Error(
          result.error?.message ?? "Unable to review this deposit.",
        );
      setSelected(null);
      await loadDeposits();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to review this deposit.",
      );
    } finally {
      setIsReviewing(false);
    }
  }

  const columns: DataTableColumn<AdminDeposit>[] = [
    {
      key: "client",
      label: "Client",
      render: (deposit) => {
        const firstName = deposit.client?.firstName ?? "Client";
        const lastName = deposit.client?.lastName ?? "";

        return (
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-xs font-extrabold text-[var(--color-brand-hover)]">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-extrabold text-[var(--color-ink)]">
                {firstName} {lastName}
              </p>
              <p className="mt-1 text-[0.67rem] font-semibold text-[var(--color-muted)]">
                {deposit.client?.email ?? "Client record unavailable"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "amount",
      label: "Amount",
      render: (deposit) => (
        <>
          <p className="text-sm font-extrabold text-[var(--color-ink)]">
            {deposit.amount} {deposit.asset}
          </p>
          <p className="mt-1 text-[0.66rem] font-semibold text-[var(--color-muted)]">
            {deposit.network}
          </p>
        </>
      ),
    },
    {
      key: "transaction",
      label: "Transaction",
      render: (deposit) => (
        <p
          className="max-w-52 truncate text-xs font-bold text-[var(--color-ink-soft)]"
          title={deposit.transactionHash}
        >
          {deposit.transactionHash}
        </p>
      ),
    },
    {
      key: "submitted",
      label: "Submitted",
      render: (deposit) => (
        <>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">
            {new Date(deposit.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-1 text-[0.66rem] font-semibold text-[var(--color-muted)]">
            {new Date(deposit.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (deposit) => (
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1.5 text-[0.65rem] font-extrabold capitalize",
            statusStyle[deposit.status],
          )}
        >
          {deposit.status}
        </span>
      ),
    },
    {
      headerClassName: "pr-5 text-right",
      cellClassName: "pr-5",
      key: "actions",
      label: "Actions",
      render: (deposit) => (
        <div className="flex justify-end">
          <button
            className="grid size-10 place-items-center rounded-xl border border-[var(--color-border)] text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-hover)]"
            onClick={() => openDeposit(deposit)}
            title="Review deposit"
            type="button"
          >
            <Eye size={17} weight="duotone" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statuses.map((item) => (
          <button
            className={cn(
              "rounded-2xl border p-5 text-left transition",
              status === item
                ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] shadow-[0_12px_32px_rgba(6,184,102,0.08)]"
                : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]/40",
            )}
            key={item}
            onClick={() => {
              setStatus(item);
              setPage(1);
            }}
            type="button"
          >
            <span className="text-[0.65rem] font-extrabold tracking-[0.12em] text-[var(--color-muted)] uppercase">
              {statusLabels[item]}
            </span>
            <span className="mt-2 block text-2xl font-extrabold text-[var(--color-ink)]">
              {summary[item]}
            </span>
          </button>
        ))}
      </section>
      {error && (
        <p className="mt-5 rounded-xl bg-[#fff1ed] p-4 text-xs font-bold text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <section className="mt-5 overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-white shadow-[0_18px_55px_rgba(18,45,72,0.06)]">
        <div className="border-b border-[var(--color-border)] p-4 sm:p-5">
          <label className="relative block max-w-2xl">
            <MagnifyingGlass
              className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-muted)]"
              size={18}
            />
            <span className="sr-only">Search deposits</span>
            <input
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] pr-4 pl-11 text-sm font-semibold outline-none focus:border-[var(--color-brand)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by client, transaction, wallet, or amount"
              type="search"
              value={query}
            />
          </label>
        </div>

        <DataTable
          caption="TradeUply client deposits"
          columns={columns}
          emptyDescription="Adjust the search or selected status."
          emptyIcon={<MagnifyingGlass size={30} />}
          emptyTitle="No deposits found"
          getRowId={(deposit) => deposit.id}
          isLoading={isLoading}
          minWidthClassName="min-w-[900px]"
          rows={deposits}
        />

        {!isLoading && deposits.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-4 text-[0.68rem] font-bold text-[var(--color-muted)]">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total,
              )}{" "}
              of {pagination.total} deposits
            </span>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous deposit page"
                className="grid size-9 place-items-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-ink)] transition hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                <CaretLeft size={15} weight="bold" />
              </button>
              <span className="min-w-20 text-center text-[0.7rem] text-[var(--color-ink-soft)]">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                aria-label="Next deposit page"
                className="grid size-9 place-items-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-ink)] transition hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.pages, current + 1),
                  )
                }
                type="button"
              >
                <CaretRight size={15} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-ink)]/50 backdrop-blur-sm sm:items-center sm:p-6">
          <button
            aria-label="Close deposit"
            className="absolute inset-0"
            onClick={() => setSelected(null)}
            type="button"
          />
          <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8">
            <button
              aria-label="Close"
              className="absolute top-5 right-5 grid size-10 place-items-center rounded-xl bg-slate-100"
              onClick={() => setSelected(null)}
              type="button"
            >
              <X size={19} weight="bold" />
            </button>
            <p className="text-xs font-extrabold tracking-[0.16em] text-[var(--color-brand-hover)] uppercase">
              Deposit verification
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-ink)]">
              {selected.amount} {selected.asset}
            </h2>
            <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
              {selected.client?.firstName} {selected.client?.lastName} ·{" "}
              {selected.client?.email}
            </p>
            <div className="mt-7 grid gap-5 sm:grid-cols-[15rem_1fr]">
              {selected.paymentProofUrl ? (
                <a
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#f5f8f7]"
                  href={selected.paymentProofUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Image
                    alt="Client payment screenshot"
                    className="object-contain p-2 transition group-hover:scale-[1.02]"
                    fill
                    sizes="240px"
                    src={selected.paymentProofUrl}
                  />
                  <span className="absolute right-3 bottom-3 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-[0.62rem] font-extrabold text-white shadow-lg">
                    Open full image
                  </span>
                </a>
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[#f5f8f7] px-5 text-center text-xs font-bold text-[var(--color-muted)]">
                  No payment screenshot was stored for this earlier deposit.
                </div>
              )}
              <dl className="grid gap-4 rounded-2xl bg-[#f5f8f7] p-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                    Transaction hash
                  </dt>
                  <dd className="mt-2 break-all text-xs font-bold text-[var(--color-ink)]">
                    {selected.transactionHash}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                    Sender wallet
                  </dt>
                  <dd className="mt-2 break-all text-xs font-bold text-[var(--color-ink)]">
                    {selected.senderWalletAddress}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                    Receiving wallet
                  </dt>
                  <dd className="mt-2 break-all text-xs font-bold text-[var(--color-ink)]">
                    {selected.destinationWalletAddress}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                    Network
                  </dt>
                  <dd className="mt-2 text-xs font-bold text-[var(--color-ink)]">
                    {selected.network}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="mt-7">
              <div className="flex items-center gap-2">
                <ClockCounterClockwise
                  className="text-[var(--color-brand-hover)]"
                  size={20}
                />
                <h3 className="font-extrabold text-[var(--color-ink)]">
                  Activity history
                </h3>
              </div>
              <ol className="mt-5 space-y-4 border-l border-[var(--color-border)] pl-6">
                {selected.activities.map((activity) => (
                  <li className="relative" key={activity.id}>
                    <span className="absolute top-1 -left-[1.8rem] size-3 rounded-full border-2 border-white bg-[var(--color-brand)]" />
                    <p className="text-sm font-extrabold capitalize text-[var(--color-ink)]">
                      {activity.event.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                      {activity.actorLabel} ·{" "}
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            {selected.status === "pending" && (
              <div className="mt-7 border-t border-[var(--color-border)] pt-6">
                <label className="text-xs font-extrabold text-[var(--color-ink)]">
                  Review notes
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-xl border border-[var(--color-border)] bg-[#f7faf8] p-4 text-sm font-medium outline-none focus:border-[var(--color-brand)]"
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Required when rejecting"
                    value={notes}
                  />
                </label>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#e3b6aa] text-xs font-extrabold text-[var(--color-danger)] disabled:opacity-60"
                    disabled={isReviewing}
                    onClick={() => review("reject")}
                    type="button"
                  >
                    <X size={17} weight="bold" />
                    Reject deposit
                  </button>
                  <button
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-xs font-extrabold text-white disabled:opacity-60"
                    disabled={isReviewing}
                    onClick={() => review("approve")}
                    type="button"
                  >
                    {isReviewing ? (
                      <SpinnerGap className="animate-spin" size={17} />
                    ) : (
                      <Check size={17} weight="bold" />
                    )}
                    Approve and credit
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
