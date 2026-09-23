"use client";

import {
  CaretLeft,
  CaretRight,
  Eye,
  MagnifyingGlass,
  SpinnerGap,
  Trash,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { ClientDetailDrawer } from "@/components/clients/client-detail-drawer";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import type { AdminClient } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  deleteClients,
  getClients,
  type ClientPagination,
  type ClientSummary,
} from "@/services/client-management.service";

const statuses = [
  "all",
  "active",
  "pending_verification",
  "suspended",
] as const;
type StatusFilter = (typeof statuses)[number];

const statusLabels: Record<StatusFilter, string> = {
  active: "Active",
  all: "All clients",
  pending_verification: "Pending verification",
  suspended: "Suspended",
};

const emptyPagination: ClientPagination = {
  limit: 10,
  page: 1,
  pages: 1,
  total: 0,
};

const emptySummary: ClientSummary = {
  active: 0,
  all: 0,
  pending_verification: 0,
  suspended: 0,
};

function getStatusClasses(status: AdminClient["status"]) {
  if (status === "active") return "bg-[#e5f8ee] text-[#008c4e]";
  if (status === "suspended") return "bg-[#fff0ec] text-[#b74c39]";
  return "bg-[#fff4db] text-[#9b6a08]";
}

export function ClientManagement() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState<ClientPagination>(emptyPagination);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [summary, setSummary] = useState<ClientSummary>(emptySummary);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let ignoreResult = false;
    const requestTimeout = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      setSelectedIds([]);

      getClients({
        limit: 10,
        page,
        query: debouncedQuery,
        status,
      })
        .then((result) => {
          if (ignoreResult) return;
          setClients(result.clients);
          setPagination(result.pagination);
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
  }, [debouncedQuery, page, reloadKey, status]);

  const visibleIds = clients.map((client) => client.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleSelection(clientId: string) {
    setSelectedIds((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId],
    );
  }

  function toggleVisibleSelection() {
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  }

  function refreshAfterDeletion(clientIds: string[]) {
    setSelectedIds((current) =>
      current.filter((id) => !clientIds.includes(id)),
    );
    if (clientIds.length >= clients.length && page > 1) {
      setPage((current) => current - 1);
    } else {
      setReloadKey((current) => current + 1);
    }
  }

  async function confirmBulkDeletion() {
    setIsDeleting(true);
    setError("");
    try {
      await deleteClients(pendingDeleteIds);
      refreshAfterDeletion(pendingDeleteIds);
      setPendingDeleteIds([]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The clients could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: DataTableColumn<AdminClient>[] = [
    {
      key: "client",
      label: "Client",
      render: (client) => (
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-xs font-extrabold text-[var(--color-brand-hover)]">
            {client.firstName.charAt(0)}
            {client.lastName.charAt(0)}
          </span>
          <div>
            <p className="text-sm font-extrabold text-[var(--color-ink)]">
              {client.firstName} {client.lastName}
            </p>
            <p className="mt-1 text-[0.67rem] font-semibold text-[var(--color-muted)]">
              {client.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      cellClassName: "text-xs font-bold text-[var(--color-ink-soft)]",
      key: "phone",
      label: "Phone",
      render: (client) => client.phone,
    },
    {
      key: "balance",
      label: "Current balance",
      render: (client) => (
        <div className="space-y-1">
          {client.balances.length > 0 ? (
            client.balances.slice(0, 2).map((balance) => (
              <p
                className="text-sm font-extrabold text-[var(--color-ink)]"
                key={balance.currency}
              >
                {balance.availableBalance} {balance.currency}
              </p>
            ))
          ) : (
            <p className="text-xs font-bold text-[var(--color-muted)]">
              No funded wallets
            </p>
          )}
          {client.balances.length > 2 && (
            <p className="text-[0.64rem] font-bold text-[var(--color-muted)]">
              +{client.balances.length - 2} more assets
            </p>
          )}
        </div>
      ),
    },
    {
      key: "profile",
      label: "Profile",
      render: (client) => (
        <>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">
            {client.investmentProfile.experience}
          </p>
          <p className="mt-1 text-[0.65rem] font-semibold text-[var(--color-muted)]">
            {client.investmentProfile.investmentRange}
          </p>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (client) => (
        <span
          className={cn(
            "rounded-full px-3 py-1.5 text-[0.63rem] font-extrabold capitalize",
            getStatusClasses(client.status),
          )}
        >
          {client.status.replace("_", " ")}
        </span>
      ),
    },
    {
      headerClassName: "pr-5 text-right",
      cellClassName: "pr-5",
      key: "actions",
      label: "Actions",
      render: (client) => (
        <div className="flex justify-end gap-2">
          <button
            className="grid size-10 place-items-center rounded-xl border border-[var(--color-border)] text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-hover)]"
            onClick={() => setSelectedClientId(client.id)}
            title={`View ${client.firstName}`}
            type="button"
          >
            <Eye size={17} weight="duotone" />
          </button>
          <button
            className="grid size-10 place-items-center rounded-xl border border-[#efc8c0] text-[var(--color-danger)]"
            onClick={() => setPendingDeleteIds([client.id])}
            title={`Delete ${client.firstName}`}
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

      <section className="mt-5 overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-white shadow-[0_18px_55px_rgba(18,45,72,0.06)]">
        <div className="grid gap-3 border-b border-[var(--color-border)] p-4 sm:p-5 lg:grid-cols-[1fr_auto]">
          <label className="relative">
            <MagnifyingGlass
              className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-muted)]"
              size={18}
            />
            <span className="sr-only">Search clients</span>
            <input
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] pr-4 pl-11 text-sm font-semibold outline-none focus:border-[var(--color-brand)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or phone"
              type="search"
              value={query}
            />
          </label>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#efc8c0] px-4 text-xs font-extrabold text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selectedIds.length === 0}
            onClick={() => setPendingDeleteIds(selectedIds)}
            type="button"
          >
            <Trash size={17} weight="duotone" />
            Delete selected{" "}
            {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </button>
        </div>

        <DataTable
          caption="TradeUply clients"
          columns={columns}
          emptyDescription="Adjust the search or selected status."
          emptyIcon={<UsersThree size={34} weight="duotone" />}
          emptyTitle="No clients found"
          getRowId={(client) => client.id}
          isLoading={isLoading}
          minWidthClassName="min-w-[920px]"
          rows={clients}
          selection={{
            getLabel: (clientId, isSelected) => {
              const client = clients.find((item) => item.id === clientId);
              return `${isSelected ? "Deselect" : "Select"} ${client?.firstName ?? "client"} ${client?.lastName ?? ""}`;
            },
            onToggle: toggleSelection,
            onToggleAll: toggleVisibleSelection,
            selectedIds,
          }}
        />

        {!isLoading && clients.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-4 text-[0.68rem] font-bold text-[var(--color-muted)]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )}{" "}
                of {pagination.total} clients
              </span>
              <span>{selectedIds.length} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous client page"
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
                aria-label="Next client page"
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

      {selectedClientId && (
        <ClientDetailDrawer
          clientId={selectedClientId}
          key={selectedClientId}
          onClose={() => setSelectedClientId(null)}
          onDeleted={(clientId) => refreshAfterDeletion([clientId])}
          onUpdated={(updatedClient) => {
            setClients((current) =>
              current.map((client) =>
                client.id === updatedClient.id ? updatedClient : client,
              ),
            );
            setReloadKey((current) => current + 1);
          }}
        />
      )}

      {pendingDeleteIds.length > 0 && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[var(--color-ink)]/48 p-5 backdrop-blur-sm">
          <button
            aria-label="Close deletion confirmation"
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
                ? "this client"
                : `${pendingDeleteIds.length} clients`}
              ?
            </h2>
            <p className="mt-3 text-sm leading-6 font-medium text-[var(--color-muted)]">
              Client access will be revoked immediately. Deposit and balance
              history will be retained for auditing.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                className="min-h-12 rounded-xl border border-[var(--color-border)] text-xs font-extrabold"
                disabled={isDeleting}
                onClick={() => setPendingDeleteIds([])}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-danger)] text-xs font-extrabold text-white"
                disabled={isDeleting}
                onClick={confirmBulkDeletion}
                type="button"
              >
                {isDeleting ? (
                  <SpinnerGap className="animate-spin" size={17} />
                ) : (
                  <Trash size={17} />
                )}
                {isDeleting ? "Deleting…" : "Delete clients"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
