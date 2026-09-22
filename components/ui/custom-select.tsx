"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

export type CustomSelectOption<Value extends string> = {
  label: string;
  value: Value;
};

export function CustomSelect<Value extends string>({
  ariaLabel,
  className,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: Value) => void;
  options: CustomSelectOption<Value>[];
  value: Value;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function selectOption(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setHighlightedIndex(index);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;

    event.preventDefault();
    if (!isOpen) {
      setHighlightedIndex(selectedIndex);
      setIsOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      setHighlightedIndex((current) => (current + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      setHighlightedIndex((current) => (current - 1 + options.length) % options.length);
    } else {
      selectOption(highlightedIndex);
    }
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-[#f8faf9] px-4 text-left text-xs font-extrabold outline-none transition",
          isOpen
            ? "border-[var(--color-brand)] ring-4 ring-[var(--color-brand)]/10"
            : "border-[var(--color-border)] hover:border-[var(--color-brand)]/45",
        )}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <CaretDown
          className={cn("shrink-0 transition", isOpen && "rotate-180")}
          size={16}
          weight="bold"
        />
      </button>

      {isOpen && (
        <div
          aria-label={ariaLabel}
          className="absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-[var(--color-border)] bg-white p-1.5 shadow-[0_18px_45px_rgba(3,26,59,0.16)]"
          role="listbox"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition",
                  isSelected
                    ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]"
                    : isHighlighted
                      ? "bg-slate-50 text-[var(--color-ink)]"
                      : "text-[var(--color-ink-soft)] hover:bg-slate-50",
                )}
                key={option.value}
                onClick={() => selectOption(index)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {isSelected && <Check size={15} weight="bold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
