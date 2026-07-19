"use client";

import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { HelpChip } from "@/components/HelpChip";
import { InstallmentRow } from "@/components/InstallmentRow";
import {
  addMonths,
  formatMoney,
  getInstallmentsForMonth,
  groupByCard,
  monthLabel,
  monthTotals,
  personLabel,
} from "@/lib/finance";

export default function HomePage() {
  const {
    ready,
    data,
    monthKey,
    setMonthKey,
    togglePayment,
    houseCode,
    syncStatus,
  } = useFinance();

  if (!ready) {
    return <p className="pt-20 text-center text-[var(--muted)]">Cargando…</p>;
  }

  const items = getInstallmentsForMonth(data, monthKey);
  const groups = groupByCard(items);
  const totals = monthTotals(items);
  const hasCards = data.cards.length > 0;
  const hasPurchases = data.purchases.length > 0;

  return (
    <div className="animate-in space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-hot)]">
            No Se Peleen
          </p>
          <HelpChip />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--ink)]">
          El amor supera
          <br />
          las cuotas
        </h1>
        <p className="max-w-[22rem] text-[15px] leading-relaxed text-[var(--muted)]">
          Acá ven juntos qué toca pagar este mes. Toquen una cuota para marcarla
          como pagada.
        </p>
        {houseCode && (
          <p className="inline-flex rounded-full bg-[var(--mint)]/15 px-3 py-1 text-xs font-bold text-[var(--mint)]">
            {syncStatus === "synced"
              ? `Casa ${houseCode} · en sync`
              : syncStatus === "connecting"
                ? "Conectando nube…"
                : syncStatus === "error"
                  ? "Sin sync (revisar internet)"
                  : `Casa ${houseCode}`}
          </p>
        )}
      </header>

      {!hasCards && (
        <StarterGuide
          step="1"
          title="Empiecen por las tarjetas"
          body="Carguen Visa, Mastercard o la que usen. Sin tarjeta no se puede anotar la compra."
          cta="Agregar tarjeta"
          href="/tarjetas"
        />
      )}

      {hasCards && !hasPurchases && (
        <StarterGuide
          step="2"
          title="Ahora sumen una compra"
          body="Cuando compren en cuotas, anótenlo acá. Pueden pegar el aviso de la app del banco."
          cta="Sumar compra"
          href="/nueva"
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-ghost min-h-11 min-w-11 px-3 py-2 text-base"
          onClick={() => setMonthKey(addMonths(monthKey, -1))}
          aria-label="Mes anterior"
        >
          ←
        </button>
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-bold capitalize">
            {monthLabel(monthKey)}
          </p>
          <p className="text-xs text-[var(--muted)]">lo que toca pagar</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost min-h-11 min-w-11 px-3 py-2 text-base"
          onClick={() => setMonthKey(addMonths(monthKey, 1))}
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--ink)] px-5 py-5 text-white shadow-[0_20px_40px_-20px_rgba(26,39,68,0.55)]">
        <div
          className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-[var(--accent)]/30 blur-2xl"
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Todavía deben este mes
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight">
          {formatMoney(totals.unpaid)}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
          <span>
            Total del mes:{" "}
            <strong className="text-white">{formatMoney(totals.total)}</strong>
          </span>
          <span>
            Ya pagaron:{" "}
            <strong className="text-[#b8e0d2]">{formatMoney(totals.paid)}</strong>
          </span>
        </div>
      </section>

      {hasPurchases && items.length > 0 && (
        <p className="px-1 text-sm font-semibold text-[var(--muted)]">
          Toquen cada ítem para marcar “pagado” ✓
        </p>
      )}

      {groups.map((group, index) => (
        <section
          key={group.card.id}
          className="animate-in space-y-3"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-end justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: group.card.color }}
              />
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
                  {group.card.name}
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  ••{group.card.lastFour} · vence el día {group.card.dueDay}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-[var(--ink)]">
              {formatMoney(group.unpaid)}
            </p>
          </div>
          <div className="space-y-2">
            {group.items.map((item) => (
              <InstallmentRow
                key={`${item.purchase.id}-${item.installmentNumber}`}
                item={item}
                buyerLabel={personLabel(item.purchase.boughtBy, data.household)}
                onToggle={() =>
                  togglePayment(item.purchase.id, item.installmentNumber)
                }
              />
            ))}
          </div>
        </section>
      ))}

      {hasPurchases && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white/50 px-5 py-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold">
            Este mes no hay cuotas
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Cambien de mes con las flechas, o sumen una compra nueva.
          </p>
        </div>
      )}

      <Link
        href="/zen"
        className="block rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-4 text-center transition hover:border-[var(--ink)]/25"
      >
        <p className="text-sm font-bold text-[var(--ink)]">
          ¿Ya empezó la discusión?
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Entrá al modo Zen antes de mencionar la tarjeta →
        </p>
      </Link>
    </div>
  );
}

function StarterGuide({
  step,
  title,
  body,
  cta,
  href,
}: {
  step: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] font-[family-name:var(--font-display)] text-lg font-extrabold text-[var(--ink)]">
          {step}
        </span>
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl font-bold">
            {title}
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-[var(--muted)]">
            {body}
          </p>
        </div>
      </div>
      <Link href={href} className="btn btn-primary mt-4 w-full text-base">
        {cta}
      </Link>
    </div>
  );
}
