"use client";

import {
  Bank,
  CreditCard,
  CurrencyCircleDollar,
  MagnifyingGlass,
  PencilSimple,
  SpinnerGap,
  Trash,
  Wallet,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import type { AdminPaymentMethod } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  deletePaymentMethods,
  getPaymentMethods,
} from "@/services/payment-method.service";
import { useAppSelector } from "@/store/hooks";

const statusOptions = ["all", "active", "coming_soon", "disabled"] as const;
type StatusFilter = (typeof statusOptions)[number];
type SortOption = "display-order" | "name-asc" | "name-desc";

const statusLabels: Record<StatusFilter, string> = {
  active: "Active",
  all: "All methods",
  coming_soon: "Coming soon",
  disabled: "Disabled",
};

const categoryIcons = {
  bank: Bank,
  card: CreditCard,
  crypto: CurrencyCircleDollar,
  wallet: Wallet,
};

function getStatusClasses(status: AdminPaymentMethod["status"]) {
  if (status === "active") return "bg-[#e5f8ee] text-[#008c4e]";
  if (status === "disabled") return "bg-[#f1f3f5] text-[#6e7b8a]";
  return "bg-[#fff4db] text-[#9b6a08]";
}

export function PaymentMethodManager() {
  const user = useAppSelector((state) => state.auth.user);
  const [methods, setMethods] = useState<AdminPaymentMethod[]>([]);
  const [category, setCategory] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("display-order");
  const [status, setStatus] = useState<StatusFilter>("all");
  const canEdit = user?.roles.includes("super-admin") ?? false;

  useEffect(() => {
    getPaymentMethods()
      .then(setMethods)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredMethods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = methods.filter((method) => {
      const matchesSearch =
        !normalizedQuery ||
        [method.name, method.code, method.asset, method.network]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      const matchesStatus = status === "all" || method.status === status;
      const matchesCategory =
        category === "all" || method.category === category;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return result.sort((first, second) => {
      if (sort === "name-asc") return first.name.localeCompare(second.name);
      if (sort === "name-desc") return second.name.localeCompare(first.name);
      return first.displayOrder - second.displayOrder;
    });
  }, [category, methods, query, sort, status]);

  const statusCounts = useMemo(
    () => ({
      active: methods.filter((method) => method.status === "active").length,
      all: methods.length,
      coming_soon: methods.filter((method) => method.status === "coming_soon")
        .length,
      disabled: methods.filter((method) => method.status === "disabled").length,
    }),
    [methods],
  );

  const visibleIds = filteredMethods.map((method) => method.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleSelection(methodId: string) {
    setSelectedIds((current) =>
      current.includes(methodId)
        ? current.filter((id) => id !== methodId)
        : [...current, methodId],
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
      await deletePaymentMethods(pendingDeleteIds);
      setMethods((current) =>
        current.filter((method) => !pendingDeleteIds.includes(method.id)),
      );
      setSelectedIds((current) =>
        current.filter((id) => !pendingDeleteIds.includes(id)),
      );
      setPendingDeleteIds([]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The payment methods could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: DataTableColumn<AdminPaymentMethod>[] = [
    {
      key: "method",
      label: "Payment method",
      render: (method) => {
        const Icon = categoryIcons[method.category];
        return (
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]">
              <Icon size={20} weight="duotone" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-[var(--color-ink)]">
                {method.name}
              </p>
              <p className="mt-1 text-[0.67rem] font-bold text-[var(--color-muted)]">
                {method.code}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      cellClassName:
        "text-xs font-bold text-[var(--color-ink-soft)] capitalize",
      key: "category",
      label: "Category",
      render: (method) => method.category,
    },
    {
      key: "configuration",
      label: "Configuration",
      render: (method) => (
        <>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">
            {method.asset || method.network || "General"}
          </p>
          <p className="mt-1 text-[0.66rem] font-semibold text-[var(--color-muted)]">
            {method.network || "No network required"}
          </p>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (method) => (
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1.5 text-[0.65rem] font-extrabold",
            getStatusClasses(method.status),
          )}
        >
          {statusLabels[method.status]}
        </span>
      ),
    },
    {
      cellClassName: "text-xs font-extrabold text-[var(--color-ink)]",
      key: "order",
      label: "Order",
      render: (method) => method.displayOrder,
    },
    {
      headerClassName: "pr-5 text-right",
      cellClassName: "pr-5",
      key: "actions",
      label: "Actions",
      render: (method) => (
        <div className="flex justify-end gap-2">
          {canEdit ? (
            <Link
              className="grid size-10 place-items-center rounded-xl border border-[var(--color-border)] text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-hover)]"
              href={`/manage-payment-methods?id=${method.id}`}
              title={`Edit ${method.name}`}
            >
              <PencilSimple size={17} weight="duotone" />
            </Link>
          ) : (
            <span className="grid size-10 place-items-center rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] opacity-35">
              <PencilSimple size={17} weight="duotone" />
            </span>
          )}
          <button
            className="grid size-10 place-items-center rounded-xl border border-[#efc8c0] text-[var(--color-danger)] disabled:opacity-35"
            disabled={!canEdit}
            onClick={() => setPendingDeleteIds([method.id])}
            title={`Delete ${method.name}`}
            type="button"
          >
            <Trash size={17} weight="duotone" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {!canEdit && (
        <div className="mb-5 flex gap-3 rounded-xl border border-[#eed69d] bg-[#fff8e8] p-4 text-[#8d6518]">
          <WarningCircle className="shrink-0" size={20} />
          <p className="text-xs font-bold">
            You can review payment methods. Only a super-admin can create, edit,
            or delete them.
          </p>
        </div>
      )}

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
        {statusOptions.map((option) => (
          <button
            className={cn(
              "rounded-2xl border p-5 text-left transition",
              status === option
                ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] shadow-[0_12px_32px_rgba(6,184,102,0.08)]"
                : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]/40",
            )}
            key={option}
            onClick={() => setStatus(option)}
            type="button"
          >
            <span className="text-[0.65rem] font-extrabold tracking-[0.12em] text-[var(--color-muted)] uppercase">
              {statusLabels[option]}
            </span>
            <span className="mt-2 block text-2xl font-extrabold text-[var(--color-ink)]">
              {statusCounts[option]}
            </span>
          </button>
        ))}
      </section>

      <section className="mt-5 rounded-[1.6rem] border border-[var(--color-border)] bg-white shadow-[0_18px_55px_rgba(18,45,72,0.06)]">
        <div className="border-b border-[var(--color-border)] p-4 sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto]">
            <label className="relative">
              <MagnifyingGlass
                className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-muted)]"
                size={18}
              />
              <span className="sr-only">Search payment methods</span>
              <input
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] pr-4 pl-11 text-sm font-semibold outline-none focus:border-[var(--color-brand)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, code, asset, or network"
                type="search"
                value={query}
              />
            </label>
            <select
              aria-label="Filter by category"
              className="h-12 rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-xs font-extrabold outline-none focus:border-[var(--color-brand)]"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="all">All categories</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="wallet">Digital wallet</option>
            </select>
            <select
              aria-label="Sort payment methods"
              className="h-12 rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-xs font-extrabold outline-none focus:border-[var(--color-brand)]"
              onChange={(event) => setSort(event.target.value as SortOption)}
              value={sort}
            >
              <option value="display-order">Display order</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#efc8c0] px-4 text-xs font-extrabold text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canEdit || selectedIds.length === 0}
              onClick={() => setPendingDeleteIds(selectedIds)}
              type="button"
            >
              <Trash size={17} weight="duotone" />
              Delete selected{" "}
              {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
            </button>
          </div>
        </div>

        <DataTable
          caption="TradeUply payment methods"
          columns={columns}
          emptyDescription="Adjust the search or filters, or create a new payment method."
          emptyIcon={<MagnifyingGlass size={30} />}
          emptyTitle="No payment methods found"
          getRowId={(method) => method.id}
          isLoading={isLoading}
          rows={filteredMethods}
          selection={{
            getLabel: (methodId, isSelected) => {
              const method = methods.find((item) => item.id === methodId);
              return `${isSelected ? "Deselect" : "Select"} ${method?.name ?? "payment method"}`;
            },
            onToggle: toggleSelection,
            onToggleAll: toggleVisibleSelection,
            selectedIds,
          }}
        />

        {!isLoading && filteredMethods.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-4 text-[0.68rem] font-bold text-[var(--color-muted)]">
            <span>
              Showing {filteredMethods.length} of {methods.length} methods
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
                ? "payment method"
                : `${pendingDeleteIds.length} payment methods`}
              ?
            </h2>
            <p className="mt-3 text-sm leading-6 font-medium text-[var(--color-muted)]">
              These methods will no longer appear in the admin list or client
              funding flow. Existing deposit history will be preserved.
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
                {isDeleting ? "Deleting…" : "Delete methods"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
