"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  MagnifyingGlass,
  Receipt,
  SpinnerGap,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/ui/custom-select";
import type { AdminTransaction } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  deleteTransactions,
  getTransactions,
  type TransactionSummary,
} from "@/services/transaction.service";

type DirectionFilter = "all" | AdminTransaction["direction"];
type TypeFilter = "all" | AdminTransaction["type"];

const directionLabels: Record<DirectionFilter, string> = {
  all: "All entries",
  credit: "Credits",
  debit: "Debits",
};

const typeOptions: CustomSelectOption<TypeFilter>[] = [
  { label: "All transaction types", value: "all" },
  { label: "Deposits", value: "deposit" },
  { label: "Withdrawals", value: "withdrawal" },
  { label: "Adjustments", value: "adjustment" },
  { label: "Investments", value: "investment" },
];

const emptySummary: TransactionSummary = {
  all: 0,
  credit: 0,
  debit: 0,
  depositedVolumes: [],
};

function formatAmount(value: string) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function getTypeClasses(type: AdminTransaction["type"]) {
  if (type === "deposit") return "bg-[#e5f8ee] text-[#008c4e]";
  if (type === "withdrawal") return "bg-[#fff0ec] text-[#b74c39]";
  if (type === "investment") return "bg-[#e8f7ff] text-[#176b8c]";
  return "bg-[#eef2ff] text-[#5363b8]";
}

export function TransactionManagement() {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>(emptySummary);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [type, setType] = useState<TypeFilter>("all");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let ignoreResult = false;
    const requestTimeout = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      setSelectedIds([]);

      getTransactions({
        direction: direction === "all" ? undefined : direction,
        query: debouncedQuery,
        type: type === "all" ? undefined : type,
      })
        .then((result) => {
          if (ignoreResult) return;
          setTransactions(result.transactions);
          setSummary(result.summary);
        })
        .catch((requestError: Error) => {
          if (!ignoreResult) setError(requestError.message);
        })
        .finally(() => {
          if (!ignoreResult) setIsLoading(false);
        });
    }, 0);

    return () => {
      ignoreResult = true;
      window.clearTimeout(requestTimeout);
    };
  }, [debouncedQuery, direction, reloadKey, type]);

  const visibleIds = transactions.map((transaction) => transaction.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleSelection(transactionId: string) {
    setSelectedIds((current) =>
      current.includes(transactionId)
        ? current.filter((id) => id !== transactionId)
        : [...current, transactionId],
    );
  }

  function toggleVisibleSelection() {
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  }

  async function confirmDeletion() {
    setIsDeleting(true);
    setError("");

    try {
      await deleteTransactions(pendingDeleteIds);
      setPendingDeleteIds([]);
      setSelectedIds([]);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The transactions could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: DataTableColumn<AdminTransaction>[] = [
    {
      key: "client",
      label: "Client",
      render: (transaction) => {
        const firstName = transaction.client?.firstName ?? "Client";
        const lastName = transaction.client?.lastName ?? "";

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
                {transaction.client?.email ?? "Client record unavailable"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "entry",
      label: "Entry",
      render: (transaction) => {
        const DirectionIcon =
          transaction.direction === "credit" ? ArrowDownLeft : ArrowUpRight;

        return (
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                transaction.direction === "credit"
                  ? "bg-[#e5f8ee] text-[#008c4e]"
                  : "bg-[#fff0ec] text-[#b74c39]",
              )}
            >
              <DirectionIcon size={16} weight="bold" />
            </span>
            <div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[0.62rem] font-extrabold capitalize",
                  getTypeClasses(transaction.type),
                )}
              >
                {transaction.type}
              </span>
              <p className="mt-1 text-[0.63rem] font-bold text-[var(--color-muted)] capitalize">
                {transaction.direction}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "amount",
      label: "Amount",
      render: (transaction) => (
        <p
          className={cn(
            "text-sm font-extrabold",
            transaction.direction === "credit"
              ? "text-[#008c4e]"
              : "text-[var(--color-danger)]",
          )}
        >
          {transaction.direction === "credit" ? "+" : "−"}
          {formatAmount(transaction.amount)} {transaction.currency}
        </p>
      ),
    },
    {
      key: "balance",
      label: "Balance movement",
      render: (transaction) => (
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink-soft)]">
          <span>{formatAmount(transaction.balanceBefore)}</span>
          <span className="text-[var(--color-muted)]">→</span>
          <span className="text-[var(--color-ink)]">
            {formatAmount(transaction.balanceAfter)}
          </span>
        </div>
      ),
    },
    {
      key: "reference",
      label: "Reference",
      render: (transaction) => (
        <div className="max-w-56">
          <p
            className="truncate text-xs font-bold text-[var(--color-ink-soft)]"
            title={transaction.deposit?.transactionHash}
          >
            {transaction.deposit?.transactionHash ?? transaction.description}
          </p>
          <p className="mt-1 text-[0.65rem] font-semibold text-[var(--color-muted)]">
            {transaction.deposit
              ? `${transaction.deposit.methodName} · ${transaction.deposit.network}`
              : transaction.description}
          </p>
        </div>
      ),
    },
    {
      key: "created",
      label: "Created",
      render: (transaction) => (
        <>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-1 text-[0.65rem] font-semibold text-[var(--color-muted)]">
            {new Date(transaction.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
      ),
    },
    {
      cellClassName: "pr-5 text-right",
      headerClassName: "pr-5 text-right",
      key: "actions",
      label: "Actions",
      render: (transaction) => (
        <button
          aria-label={`Delete transaction for ${transaction.client?.email ?? "client"}`}
          className="ml-auto grid size-10 place-items-center rounded-xl border border-[#efc8c0] text-[var(--color-danger)] transition hover:bg-[#fff1ed]"
          onClick={() => setPendingDeleteIds([transaction.id])}
          title="Delete transaction"
          type="button"
        >
          <Trash size={17} weight="duotone" />
        </button>
      ),
    },
  ];

  return (
    <div>
      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl bg-[#fff1ed] p-4 text-xs font-bold text-[var(--color-danger)]">
          <span>{error}</span>
          <button
            aria-label="Dismiss error"
            onClick={() => setError("")}
            type="button"
          >
            <X size={17} weight="bold" />
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(["all", "credit", "debit"] as const).map((item) => (
          <button
            className={cn(
              "rounded-2xl border p-5 text-left transition",
              direction === item
                ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] shadow-[0_12px_32px_rgba(6,184,102,0.08)]"
                : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]/40",
            )}
            key={item}
            onClick={() => setDirection(item)}
            type="button"
          >
            <span className="text-[0.65rem] font-extrabold tracking-[0.12em] text-[var(--color-muted)] uppercase">
              {directionLabels[item]}
            </span>
            <span className="mt-2 block text-2xl font-extrabold text-[var(--color-ink)]">
              {summary[item]}
            </span>
          </button>
        ))}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <span className="text-[0.65rem] font-extrabold tracking-[0.12em] text-[var(--color-muted)] uppercase">
            Deposited volume
          </span>
          <span className="mt-2 block text-sm font-extrabold text-[var(--color-ink)]">
            {summary.depositedVolumes.length > 0
              ? summary.depositedVolumes
                  .map(
                    ({ currency, total }) =>
                      `${formatAmount(total)} ${currency}`,
                  )
                  .join(" · ")
              : "No approved deposits"}
          </span>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-white shadow-[0_18px_55px_rgba(18,45,72,0.06)]">
        <div className="grid gap-3 border-b border-[var(--color-border)] p-4 sm:p-5 lg:grid-cols-[minmax(18rem,1fr)_13rem_auto]">
          <label className="relative">
            <MagnifyingGlass
              className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-muted)]"
              size={18}
            />
            <span className="sr-only">Search transactions</span>
            <input
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] pr-4 pl-11 text-sm font-semibold outline-none focus:border-[var(--color-brand)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search client, hash, description, or amount"
              type="search"
              value={query}
            />
          </label>
          <CustomSelect
            ariaLabel="Filter by transaction type"
            onChange={setType}
            options={typeOptions}
            value={type}
          />
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#efc8c0] px-4 text-xs font-extrabold text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selectedIds.length === 0}
            onClick={() => setPendingDeleteIds(selectedIds)}
            type="button"
          >
            <Trash size={17} weight="duotone" />
            Delete selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </button>
        </div>

        <DataTable
          caption="TradeUply balance transactions"
          columns={columns}
          emptyDescription="Adjust the search, direction, or transaction type."
          emptyIcon={<Receipt size={32} weight="duotone" />}
          emptyTitle="No transactions found"
          getRowId={(transaction) => transaction.id}
          isLoading={isLoading}
          minWidthClassName="min-w-[1180px]"
          rows={transactions}
          selection={{
            getLabel: (transactionId, isSelected) => {
              const transaction = transactions.find(
                (item) => item.id === transactionId,
              );
              return `${isSelected ? "Deselect" : "Select"} transaction for ${transaction?.client?.email ?? "client"}`;
            },
            onToggle: toggleSelection,
            onToggleAll: toggleVisibleSelection,
            selectedIds,
          }}
        />

        {!isLoading && transactions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-4 text-[0.68rem] font-bold text-[var(--color-muted)]">
            <span>
              Showing {transactions.length} of {summary.all} transactions
            </span>
            <span>{selectedIds.length} selected</span>
          </div>
        )}
      </section>

      {pendingDeleteIds.length > 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-ink)]/48 p-5 backdrop-blur-sm">
          <button
            aria-label="Close delete confirmation"
            className="absolute inset-0"
            onClick={() => setPendingDeleteIds([])}
            type="button"
          />
          <section
            aria-modal="true"
            className="relative w-full max-w-md rounded-[1.6rem] bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-[#fff1ed] text-[var(--color-danger)]">
              <Trash size={23} weight="duotone" />
            </span>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--color-ink)]">
              Delete{" "}
              {pendingDeleteIds.length === 1
                ? "transaction"
                : `${pendingDeleteIds.length} transactions`}
              ?
            </h2>
            <p className="mt-3 text-sm leading-6 font-medium text-[var(--color-muted)]">
              The selected ledger entries will be removed from admin and client
              activity views. Existing balances and deposit records will not be
              changed.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                className="min-h-12 rounded-xl border border-[var(--color-border)] text-xs font-extrabold text-[var(--color-ink)]"
                disabled={isDeleting}
                onClick={() => setPendingDeleteIds([])}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-danger)] text-xs font-extrabold text-white disabled:opacity-60"
                disabled={isDeleting}
                onClick={confirmDeletion}
                type="button"
              >
                {isDeleting ? (
                  <SpinnerGap className="animate-spin" size={17} />
                ) : (
                  <Trash size={17} />
                )}
                {isDeleting ? "Deleting…" : "Delete transactions"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
