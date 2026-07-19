"use client";

import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import {
  formatMoney,
  personLabel,
  purchaseProgress,
} from "@/lib/finance";

export default function ComprasPage() {
  const { ready, data, removePurchase } = useFinance();

  if (!ready) return null;

  const cardMap = new Map(data.cards.map((c) => [c.id, c]));

  return (
    <div className="animate-in space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-hot)]">
            Historial
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-[2rem] font-extrabold leading-none tracking-tight">
            Compras
          </h1>
        </div>
        <Link
          href="/nueva"
          className="text-sm font-bold text-[var(--ink)] underline underline-offset-2"
        >
          + Sumar
        </Link>
      </header>

      {data.purchases.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold">
            Agenda vacía
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Cuando compren algo, aparece aquí.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {data.purchases.map((p) => {
            const card = cardMap.get(p.cardId);
            const progress = purchaseProgress(p, data.payments);
            const pct =
              (progress.paidCount / Math.max(p.installments, 1)) * 100;

            return (
              <li key={p.id} className="py-4 first:pt-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[var(--ink)]">
                      {p.description}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {card
                        ? `${card.name} ••${card.lastFour}`
                        : "Tarjeta borrada"}{" "}
                      · {personLabel(p.boughtBy, data.household)}
                      {p.addedBy
                        ? ` · cargó ${personLabel(p.addedBy, data.household)}`
                        : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-[family-name:var(--font-display)] font-bold">
                    {formatMoney(p.totalAmount)}
                  </p>
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex justify-between text-xs font-semibold">
                    <span>
                      {p.installments === 1
                        ? progress.paidCount
                          ? "Pagado"
                          : "Pendiente"
                        : `${progress.paidCount}/${p.installments} cuotas`}
                    </span>
                    <span className="text-[var(--muted)]">
                      quedan {formatMoney(progress.remainingAmount)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                    <div
                      className="h-full rounded-full bg-[var(--mint)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {p.installments === 1
                      ? `Pago único · día ${p.paymentDay || 10}`
                      : `${formatMoney(p.installmentAmount)} × ${p.installments} · día ${p.paymentDay || 10}`}
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-[var(--accent-hot)]"
                  onClick={() => {
                    if (confirm(`¿Borrar “${p.description}”?`)) {
                      removePurchase(p.id);
                    }
                  }}
                >
                  Eliminar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
