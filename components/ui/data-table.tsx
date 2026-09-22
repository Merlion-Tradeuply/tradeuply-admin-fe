"use client";

import { Check, SpinnerGap } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<Row> = {
  cellClassName?: string;
  headerClassName?: string;
  key: string;
  label: string;
  render: (row: Row) => ReactNode;
};

type TableSelection = {
  getLabel: (rowId: string, isSelected: boolean) => string;
  onToggle: (rowId: string) => void;
  onToggleAll: () => void;
  selectedIds: string[];
};

type DataTableProps<Row> = {
  caption: string;
  columns: DataTableColumn<Row>[];
  emptyDescription: string;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  getRowId: (row: Row) => string;
  isLoading?: boolean;
  minWidthClassName?: string;
  rows: Row[];
  selection?: TableSelection;
};

export function DataTable<Row>({
  caption,
  columns,
  emptyDescription,
  emptyIcon,
  emptyTitle,
  getRowId,
  isLoading = false,
  minWidthClassName = "min-w-[850px]",
  rows,
  selection,
}: DataTableProps<Row>) {
  const visibleIds = rows.map(getRowId);
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((rowId) => selection?.selectedIds.includes(rowId));

  if (isLoading) {
    return (
      <div className="grid min-h-72 place-items-center text-[var(--color-brand-hover)]">
        <SpinnerGap className="animate-spin" size={29} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        {emptyIcon && (
          <span className="mx-auto flex w-fit text-[var(--color-muted)]">
            {emptyIcon}
          </span>
        )}
        <h2 className="mt-4 text-lg font-extrabold text-[var(--color-ink)]">
          {emptyTitle}
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--color-muted)]">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-left",
          minWidthClassName,
        )}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[#f8faf9] text-[0.63rem] font-extrabold tracking-[0.12em] text-[var(--color-muted)] uppercase">
            {selection && (
              <th className="w-14 px-5 py-4" scope="col">
                <SelectionButton
                  checked={allVisibleSelected}
                  label={
                    allVisibleSelected
                      ? "Clear visible selection"
                      : "Select all visible rows"
                  }
                  onClick={selection.onToggleAll}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                className={cn("px-3 py-4", column.headerClassName)}
                key={column.key}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowId = getRowId(row);
            const isSelected = selection?.selectedIds.includes(rowId) ?? false;

            return (
              <tr
                className="border-b border-[var(--color-border)] transition last:border-0 hover:bg-[#fbfcfb]"
                key={rowId}
              >
                {selection && (
                  <td className="px-5 py-4">
                    <SelectionButton
                      checked={isSelected}
                      label={selection.getLabel(rowId, isSelected)}
                      onClick={() => selection.onToggle(rowId)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    className={cn("px-3 py-4", column.cellClassName)}
                    key={column.key}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SelectionButton({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid size-5 place-items-center rounded-md border",
        checked
          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
          : "border-[var(--color-border)] bg-white",
      )}
      onClick={onClick}
      type="button"
    >
      {checked && <Check size={13} weight="bold" />}
    </button>
  );
}
