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
import { useCallback, useEffect, useState } from "react";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/ui/custom-select";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminDeposit,
  AdminDepositConversion,
  AdminPaymentMethod,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { getPaymentMethods } from "@/services/payment-method.service";

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
  const [cryptoMethods, setCryptoMethods] = useState<AdminPaymentMethod[]>([]);
  const [creditPaymentMethodId, setCreditPaymentMethodId] = useState("");
  const [conversion, setConversion] = useState<AdminDepositConversion | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);

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

  useEffect(() => {
    getPaymentMethods({ category: "crypto", limit: 100, status: "active" })
      .then(({ methods }) => setCryptoMethods(methods.filter((method) =>
        Boolean(method.asset && method.network && method.walletAddress && method.qrCodeUrl),
      )))
      .catch(() => setCryptoMethods([]));
  }, []);

  useEffect(() => {
    if (!selected || selected.paymentCategory !== "wallet" || !creditPaymentMethodId) {
      setConversion(null);
      return;
    }
    let ignore = false;
    setIsLoadingConversion(true);
    setError("");
    fetch(`/api/admin/deposits/${selected.id}/conversion-quote?paymentMethodId=${encodeURIComponent(creditPaymentMethodId)}`)
      .then(async (response) => {
        const result = (await response.json()) as {
          data?: { conversion: AdminDepositConversion };
          error?: { message: string };
        };
        if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Unable to load the conversion quote.");
        if (!ignore) setConversion(result.data.conversion);
      })
      .catch((requestError) => {
        if (!ignore) setError(requestError instanceof Error ? requestError.message : "Unable to load the conversion quote.");
      })
      .finally(() => {
        if (!ignore) setIsLoadingConversion(false);
      });
    return () => { ignore = true; };
  }, [creditPaymentMethodId, selected]);

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
    setCreditPaymentMethodId("");
    setConversion(null);
    setSelected(result.data.deposit);
  }

  async function review(action: "approve" | "reject") {
    if (!selected) return;
    if (action === "reject" && !notes.trim()) {
      setError("Add a reason before rejecting this deposit.");
      return;
    }
    if (action === "approve" && selected.paymentCategory === "wallet" && !creditPaymentMethodId) {
      setError("Select the cryptocurrency wallet to credit.");
      return;
    }

    setIsReviewing(true);
    setError("");
    try {
      const response = await fetch(
        `${API_ENDPOINTS.frontend.deposits}/${selected.id}/review`,
        {
          body: JSON.stringify({
            action,
            notes: notes.trim(),
            ...(selected.paymentCategory === "wallet" && {
              creditPaymentMethodId,
            }),
          }),
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
            {deposit.asset === "INR" ? `₹${Number(deposit.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : `${deposit.amount} ${deposit.asset}`}
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
              {selected.asset === "INR" ? `₹${Number(selected.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : `${selected.amount} ${selected.asset}`}
            </h2>
            <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
              {selected.client?.firstName} {selected.client?.lastName} ·{" "}
              {selected.client?.email}
            </p>
            <div className="mt-7">
              <dl className="grid gap-4 rounded-2xl bg-[#f5f8f7] p-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                    {selected.paymentCategory === "wallet" ? "UPI transaction ID / UTR" : "Transaction hash"}
                  </dt>
                  <dd className="mt-2 break-all text-xs font-bold text-[var(--color-ink)]">
                    {selected.transactionHash}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                    {selected.paymentCategory === "wallet" ? "Payer UPI ID" : "Sender wallet"}
                  </dt>
                  <dd className="mt-2 break-all text-xs font-bold text-[var(--color-ink)]">
                    {selected.senderWalletAddress}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                    {selected.paymentCategory === "wallet" ? "TradeUply UPI ID" : "Receiving wallet"}
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
            {selected.paymentCategory === "wallet" &&
              selected.convertedAmount &&
              selected.convertedAsset &&
              selected.exchangeRate && (
                <section className="mt-7 rounded-2xl border border-[var(--color-brand)]/25 bg-[var(--color-brand-soft)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.62rem] font-extrabold tracking-[0.11em] text-[var(--color-brand-hover)] uppercase">
                        Approved conversion
                      </p>
                      <h3 className="mt-2 text-lg font-extrabold text-[var(--color-ink)]">
                        ₹{Number(selected.amount).toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })} INR → {Number(selected.convertedAmount).toFixed(8)} {selected.convertedAsset}
                      </h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[0.65rem] font-extrabold text-[var(--color-brand-hover)]">
                      Rate locked at approval
                    </span>
                  </div>
                  <dl className="mt-5 grid gap-4 border-t border-[var(--color-brand)]/15 pt-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-[0.6rem] font-extrabold tracking-[0.09em] text-[var(--color-muted)] uppercase">
                        Applied exchange rate
                      </dt>
                      <dd className="mt-2 text-xs font-extrabold text-[var(--color-ink)]">
                        1 INR = {Number(selected.exchangeRate).toFixed(12)} {selected.convertedAsset}
                      </dd>
                      {Number(selected.exchangeRate) > 0 && (
                        <dd className="mt-1 text-[0.68rem] font-semibold text-[var(--color-muted)]">
                          1 {selected.convertedAsset} = ₹{(1 / Number(selected.exchangeRate)).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-[0.6rem] font-extrabold tracking-[0.09em] text-[var(--color-muted)] uppercase">
                        Rate captured
                      </dt>
                      <dd className="mt-2 text-xs font-extrabold text-[var(--color-ink)]">
                        {selected.rateQuotedAt
                          ? new Date(selected.rateQuotedAt).toLocaleString()
                          : "At approval"}
                      </dd>
                      <dd className="mt-1 text-[0.68rem] font-semibold capitalize text-[var(--color-muted)]">
                        Source: {selected.rateSource ?? "Stored approval quote"}
                      </dd>
                    </div>
                  </dl>
                </section>
              )}
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
                {selected.paymentCategory === "wallet" && (
                  <div className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[#f8faf9] p-4">
                    <label
                      className="mb-2 block text-xs font-extrabold text-[var(--color-ink)]"
                      htmlFor="deposit-credit-method"
                    >
                      Credit client crypto wallet
                    </label>
                    <CustomSelect
                      ariaLabel="Credit client crypto wallet"
                      onChange={setCreditPaymentMethodId}
                      options={cryptoMethods.map<CustomSelectOption<string>>((method) => ({
                        label: `${method.asset} · ${method.name}`,
                        value: method.id,
                      }))}
                      value={creditPaymentMethodId}
                    />
                    {isLoadingConversion && (
                      <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[var(--color-muted)]">
                        <SpinnerGap className="animate-spin" size={16} /> Loading live conversion…
                      </p>
                    )}
                    {conversion && (
                      <div className="mt-4 rounded-xl bg-[var(--color-brand-soft)] p-4">
                        <p className="text-[0.62rem] font-extrabold tracking-[0.09em] text-[var(--color-brand-hover)] uppercase">Live conversion preview</p>
                        <p className="mt-2 text-base font-extrabold text-[var(--color-ink)]">
                          ₹{Number(selected.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })} INR ≈ {conversion.convertedAmount.toFixed(8)} {conversion.to.code}
                        </p>
                        <p className="mt-2 text-[0.66rem] font-semibold text-[var(--color-muted)]">
                          1 INR = {conversion.rate.toFixed(12)} {conversion.to.code} · {conversion.source} · refreshed when approved
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
                    disabled={isReviewing || (selected.paymentCategory === "wallet" && (!creditPaymentMethodId || !conversion))}
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
                    {selected.paymentCategory === "wallet" ? "Approve, convert and credit" : "Approve and credit"}
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
