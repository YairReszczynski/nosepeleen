"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { BankPasteHelper } from "@/components/BankPasteHelper";
import {
  currentMonthKey,
  formatMoney,
  parsePurchaseHint,
} from "@/lib/finance";
import type { Person } from "@/lib/types";

export default function NuevaPage() {
  const router = useRouter();
  const { ready, data, addPurchase } = useFinance();
  const [paste, setPaste] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installments, setInstallments] = useState("1");
  const [cardId, setCardId] = useState("");
  const [boughtBy, setBoughtBy] = useState<Person>("juntos");
  const [startMonth, setStartMonth] = useState(currentMonthKey());
  /** 1 = recién empiezan; 7 = van en la cuota 7 (las 1..6 ya pagadas) */
  const [currentCuota, setCurrentCuota] = useState("1");
  const [isOldPurchase, setIsOldPurchase] = useState(false);
  const [error, setError] = useState("");
  const [appliedHint, setAppliedHint] = useState("");

  const selectedCard = useMemo(
    () => data.cards.find((c) => c.id === (cardId || data.cards[0]?.id)),
    [data.cards, cardId],
  );

  const cuotaPreview = useMemo(() => {
    const total = Number(totalAmount);
    const n = Number(installments);
    if (!total || !n || n < 1) return null;
    return Math.round(total / n);
  }, [totalAmount, installments]);

  const progressPreview = useMemo(() => {
    const n = Number(installments);
    const current = Number(currentCuota);
    if (!isOldPurchase || !n || !current || current < 1) return null;
    const paid = Math.min(current - 1, n);
    const remaining = Math.max(n - paid, 0);
    return { paid, remaining, current: Math.min(current, n) };
  }, [installments, currentCuota, isOldPurchase]);

  if (!ready) return null;

  function applyPaste() {
    const hint = parsePurchaseHint(paste);
    const filled: string[] = [];
    if (hint.description) {
      setDescription(hint.description);
      filled.push("comercio");
    }
    if (hint.totalAmount) {
      setTotalAmount(String(hint.totalAmount));
      filled.push("monto");
    }
    if (hint.installments) {
      setInstallments(String(hint.installments));
      filled.push("cuotas");
    }
    if (hint.lastFour) {
      const match = data.cards.find((c) => c.lastFour === hint.lastFour);
      if (match) {
        setCardId(match.id);
        filled.push("tarjeta");
      }
    }
    if (filled.length === 0) {
      setAppliedHint(
        "No pude leer ese texto. Completen los campos de abajo a mano, sin drama.",
      );
    } else {
      setAppliedHint(`Listo: completé ${filled.join(", ")}. Revisen abajo.`);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const total = Number(totalAmount);
    const n = Number(installments);
    const card = cardId || data.cards[0]?.id;

    if (!card) {
      setError("Primero agreguen una tarjeta en la pestaña Tarjetas.");
      return;
    }
    if (!description.trim()) {
      setError("Falta decir qué compraron (ej: heladera, Zara…).");
      return;
    }
    if (!total || total <= 0) {
      setError("El monto total tiene que ser mayor a 0.");
      return;
    }
    if (!n || n < 1 || n > 60) {
      setError("Las cuotas van de 1 a 60.");
      return;
    }

    let alreadyPaidCount = 0;
    if (isOldPurchase) {
      const current = Number(currentCuota);
      if (!current || current < 1 || current > n) {
        setError(`La cuota actual tiene que ser entre 1 y ${n}.`);
        return;
      }
      // Van en la cuota N → ya pagaron 1..(N-1)
      alreadyPaidCount = current - 1;
    }

    addPurchase({
      description: description.trim(),
      totalAmount: total,
      installments: n,
      cardId: card,
      boughtBy,
      startMonth,
      alreadyPaidCount,
    });
    router.push("/");
  }

  if (data.cards.length === 0) {
    return (
      <div className="animate-in space-y-4 pt-8 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
          Primero las tarjetas
        </h1>
        <p className="mx-auto max-w-xs text-[15px] leading-relaxed text-[var(--muted)]">
          Antes de sumar una compra, carguen al menos una tarjeta. Es como
          ponerle nombre a la billetera.
        </p>
        <Link href="/tarjetas" className="btn btn-primary text-base">
          Ir a Tarjetas
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-hot)]">
          Nueva compra
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Sumar cuotas
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Opción A: pegar el aviso de la app del banco. Opción B: llenar los
          casilleros a mano. Las dos sirven.
        </p>
      </header>

      <BankPasteHelper
        value={paste}
        onChange={setPaste}
        onApply={applyPaste}
        appliedHint={appliedHint}
      />

      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-[var(--line-strong)]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          o a mano
        </span>
        <div className="h-px flex-1 bg-[var(--line-strong)]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="desc">
            ¿Qué compraron?
          </label>
          <input
            id="desc"
            className="field text-[16px]"
            placeholder="Heladera, zapatillas, cena…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="total">
              Monto total ($)
            </label>
            <input
              id="total"
              className="field text-[16px]"
              inputMode="decimal"
              placeholder="120000"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="cuotas">
              ¿En cuántas cuotas?
            </label>
            <input
              id="cuotas"
              className="field text-[16px]"
              inputMode="numeric"
              min={1}
              max={60}
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              required
            />
          </div>
        </div>

        {cuotaPreview != null && (
          <p className="rounded-xl bg-[var(--accent)]/25 px-3 py-3 text-center text-[15px] font-semibold">
            Van a pagar ≈ {formatMoney(cuotaPreview)} por mes
            {selectedCard ? ` con ${selectedCard.name}` : ""}
          </p>
        )}

        <div>
          <label className="label" htmlFor="card">
            ¿Con qué tarjeta?
          </label>
          <select
            id="card"
            className="field text-[16px]"
            value={cardId || data.cards[0].id}
            onChange={(e) => setCardId(e.target.value)}
          >
            {data.cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ••{c.lastFour}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="buyer">
            ¿Quién hizo la compra?
          </label>
          <select
            id="buyer"
            className="field text-[16px]"
            value={boughtBy}
            onChange={(e) => setBoughtBy(e.target.value as Person)}
          >
            <option value="juntos">Los dos</option>
            <option value="mama">{data.household.mamaName}</option>
            <option value="papa">{data.household.papaName}</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="start">
            ¿En qué mes fue / es la primera cuota?
          </label>
          <input
            id="start"
            type="month"
            className="field text-[16px]"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            required
          />
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Si compraron el celular en enero, pongan enero (aunque hoy sea
            julio).
          </p>
        </div>

        <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 accent-[var(--ink)]"
              checked={isOldPurchase}
              onChange={(e) => {
                setIsOldPurchase(e.target.checked);
                if (!e.target.checked) setCurrentCuota("1");
              }}
            />
            <span>
              <span className="block font-bold text-[var(--ink)]">
                Ya venían pagando cuotas
              </span>
              <span className="mt-0.5 block text-sm text-[var(--muted)]">
                Para compras viejas: celular en 12 cuotas y ahora van en la 7,
                por ejemplo.
              </span>
            </span>
          </label>

          {isOldPurchase && (
            <div>
              <label className="label" htmlFor="current">
                ¿En qué cuota van ahora?
              </label>
              <input
                id="current"
                className="field text-[16px]"
                inputMode="numeric"
                min={1}
                max={Number(installments) || 60}
                value={currentCuota}
                onChange={(e) => setCurrentCuota(e.target.value)}
                required={isOldPurchase}
              />
              {progressPreview && (
                <p className="mt-2 rounded-xl bg-[var(--mint)]/10 px-3 py-2 text-sm font-semibold text-[var(--ink)]">
                  Se marcan {progressPreview.paid} como ya pagadas. Quedan{" "}
                  {progressPreview.remaining} (desde la cuota{" "}
                  {progressPreview.current}).
                </p>
              )}
            </div>
          )}
        </section>

        {error && (
          <p className="rounded-xl bg-[#fff0ee] px-3 py-3 text-center text-sm font-semibold text-[var(--accent-hot)]">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full text-base">
          Guardar compra
        </button>
      </form>
    </div>
  );
}
