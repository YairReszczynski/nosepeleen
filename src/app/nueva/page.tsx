"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  const [paymentDay, setPaymentDay] = useState("10");
  const [currentCuota, setCurrentCuota] = useState("1");
  const [isOldPurchase, setIsOldPurchase] = useState(false);
  const [error, setError] = useState("");
  const [appliedHint, setAppliedHint] = useState("");

  const selectedCard = useMemo(
    () => data.cards.find((c) => c.id === (cardId || data.cards[0]?.id)),
    [data.cards, cardId],
  );

  useEffect(() => {
    if (selectedCard?.dueDay) {
      setPaymentDay(String(selectedCard.dueDay));
    }
  }, [selectedCard?.id, selectedCard?.dueDay]);

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
        "No se pudo leer ese texto. Completen los campos de abajo a mano, sin problema.",
      );
    } else {
      setAppliedHint(`Listo: se completó ${filled.join(", ")}. Revisen abajo.`);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const total = Number(totalAmount);
    const n = Number(installments);
    const day = Number(paymentDay);
    const card = cardId || data.cards[0]?.id;

    if (!card) {
      setError("Primero agreguen una tarjeta en la pestaña Tarjetas.");
      return;
    }
    if (!description.trim()) {
      setError("Indiquen qué compraron (ej: refrigerador, zapatos…).");
      return;
    }
    if (!total || total <= 0) {
      setError("El monto total debe ser mayor a 0.");
      return;
    }
    if (!n || n < 1 || n > 60) {
      setError("Las cuotas van de 1 a 60.");
      return;
    }
    if (!day || day < 1 || day > 28) {
      setError("El día de pago debe ser entre 1 y 28.");
      return;
    }

    let alreadyPaidCount = 0;
    if (isOldPurchase) {
      const current = Number(currentCuota);
      if (!current || current < 1 || current > n) {
        setError(`La cuota actual debe ser entre 1 y ${n}.`);
        return;
      }
      alreadyPaidCount = current - 1;
    }

    addPurchase({
      description: description.trim(),
      totalAmount: total,
      installments: n,
      cardId: card,
      boughtBy,
      startMonth,
      paymentDay: day,
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
          Antes de sumar una compra, agreguen al menos una tarjeta.
        </p>
        <Link href="/tarjetas" className="btn btn-primary text-base">
          Ir a Tarjetas
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-5">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-hot)]">
          Nueva compra
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[2rem] font-extrabold leading-none tracking-tight">
          Sumar compra
        </h1>
        <p className="mt-2 max-w-[22rem] text-[14px] leading-snug text-[var(--muted)]">
          Crédito, débito, con cuotas o un solo pago. Peguen el aviso del banco
          o llénenlo a mano.
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
            placeholder="Refrigerador, zapatos, cena…"
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
              ¿Cuántas cuotas?
            </label>
            <input
              id="cuotas"
              className="field text-[16px]"
              inputMode="numeric"
              min={1}
              max={60}
              value={installments}
              onChange={(e) => {
                setInstallments(e.target.value);
                if (Number(e.target.value) <= 1) {
                  setIsOldPurchase(false);
                  setCurrentCuota("1");
                }
              }}
              required
            />
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Pongan <strong>1</strong> si es débito o de contado (sin cuotas).
            </p>
          </div>
        </div>

        {cuotaPreview != null && (
          <p className="rounded-xl bg-[var(--accent)]/25 px-3 py-3 text-center text-[15px] font-semibold">
            {Number(installments) === 1
              ? `Pago único de ${formatMoney(cuotaPreview)}`
              : `Van a pagar ≈ ${formatMoney(cuotaPreview)} por mes`}
            {selectedCard ? ` · ${selectedCard.name}` : ""}
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
                {c.name} · {c.kind === "debito" ? "débito" : "crédito"} ••
                {c.lastFour}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="payDay">
            ¿Qué día del mes se paga?
          </label>
          <input
            id="payDay"
            className="field text-[16px]"
            inputMode="numeric"
            min={1}
            max={28}
            value={paymentDay}
            onChange={(e) => setPaymentDay(e.target.value)}
            required
          />
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Ejemplo: si pagan el día 10, pongan 10. Se usa para cada cuota.
          </p>
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
            {Number(installments) === 1
              ? "¿En qué mes se paga / se pagó?"
              : "¿En qué mes fue / es la primera cuota?"}
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
            {Number(installments) === 1
              ? "Si es de este mes, déjenlo como está."
              : "Si empezaron en enero, pongan enero (aunque hoy sea otro mes)."}
          </p>
        </div>

        {Number(installments) > 1 && (
          <section className="space-y-3 border-t border-[var(--line)] pt-4">
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
                  Para compras antiguas: por ejemplo 12 cuotas y ahora van en la
                  7.
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
        )}

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
