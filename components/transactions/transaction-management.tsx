"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  MagnifyingGlass,
  Receipt,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import type { AdminTransaction } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { getTransactions } from "@/services/transaction.service";

type DirectionFilter = "all" | AdminTransaction["direction"];
type TypeFilter = "all" | AdminTransaction["type"];

const directionLabels: Record<DirectionFilter, string> = {
  all: "All entries",
  credit: "Credits",
  debit: "Debits",
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
  return "bg-[#eef2ff] text-[#5363b8]";
}

export function TransactionManagement() {
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [type, setType] = useState<TypeFilter>("all");

  useEffect(() => {
    getTransactions()
      .then(setTransactions)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesDirection =
        direction === "all" || transaction.direction === direction;
      const matchesType = type === "all" || transaction.type === type;
      const matchesSearch =
        !normalizedQuery ||
        [
          transaction.client?.firstName,
          transaction.client?.lastName,
          transaction.client?.email,
          transaction.deposit?.transactionHash,
          transaction.description,
          transaction.amount,
          transaction.currency,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesDirection && matchesType && matchesSearch;
    });
  }, [direction, query, transactions, type]);

  const summary = useMemo(() => {
    const credits = transactions.filter(
      (transaction) => transaction.direction === "credit",
    );
    const debits = transactions.filter(
      (transaction) => transaction.direction === "debit",
    );
    const depositedVolume = transactions
      .filter((transaction) => transaction.type === "deposit")
      .reduce((total, transaction) => total + Number(transaction.amount), 0);

    return {
      all: transactions.length,
      credit: credits.length,
      debit: debits.length,
      depositedVolume,
    };
  }, [transactions]);

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
      cellClassName: "pr-5",
      headerClassName: "pr-5",
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
          <span className="mt-2 block text-2xl font-extrabold text-[var(--color-ink)]">
            {formatAmount(String(summary.depositedVolume))} USDT
          </span>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-white shadow-[0_18px_55px_rgba(18,45,72,0.06)]">
        <div className="grid gap-3 border-b border-[var(--color-border)] p-4 sm:p-5 lg:grid-cols-[minmax(18rem,1fr)_13rem]">
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
          <select
            aria-label="Filter by transaction type"
            className="h-12 rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-xs font-extrabold outline-none focus:border-[var(--color-brand)]"
            onChange={(event) => setType(event.target.value as TypeFilter)}
            value={type}
          >
            <option value="all">All transaction types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>

        <DataTable
          caption="TradeUply balance transactions"
          columns={columns}
          emptyDescription="Adjust the search, direction, or transaction type."
          emptyIcon={<Receipt size={32} weight="duotone" />}
          emptyTitle="No transactions found"
          getRowId={(transaction) => transaction.id}
          isLoading={isLoading}
          minWidthClassName="min-w-[1050px]"
          rows={filteredTransactions}
        />

        {!isLoading && filteredTransactions.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-5 py-4 text-[0.68rem] font-bold text-[var(--color-muted)]">
            Showing {filteredTransactions.length} of {transactions.length}{" "}
            transactions
          </div>
        )}
      </section>
    </div>
  );
}
