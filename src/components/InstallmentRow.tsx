"use client";

import type { MonthInstallment } from "@/lib/types";
import { formatMoney } from "@/lib/finance";

type Props = {
  item: MonthInstallment;
  buyerLabel: string;
  markedByLabel?: string;
  onToggle: () => void;
};

export function InstallmentRow({
  item,
  buyerLabel,
  markedByLabel,
  onToggle,
}: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all active:scale-[0.99] ${
        item.paid
          ? "bg-[var(--ok-soft)]/80 opacity-75"
          : "bg-white/45 hover:bg-white/70"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          item.paid
            ? "border-[var(--ok)] bg-[var(--ok)] text-white"
            : "border-[var(--line-strong)] bg-white/80"
        }`}
        aria-hidden
      >
        {item.paid && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5L20 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[15px] font-semibold text-[var(--ink)] ${
            item.paid ? "line-through decoration-[var(--muted)]" : ""
          }`}
        >
          {item.purchase.description}
        </p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {item.purchase.installments === 1
            ? "Pago único"
            : `Cuota ${item.installmentNumber} de ${item.purchase.installments}${item.isLast ? " · última" : ""}`}
          {" · "}
          día {item.paymentDay}
          {" · "}
          {buyerLabel}
          {item.paid
            ? markedByLabel
              ? ` · pagó ${markedByLabel}`
              : " · pagada"
            : ""}
        </p>
      </div>
      <p className="shrink-0 font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)]">
        {formatMoney(item.amount)}
      </p>
    </button>
  );
}
