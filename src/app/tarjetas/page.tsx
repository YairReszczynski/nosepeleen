"use client";

import { useState, type FormEvent } from "react";
import { useFinance } from "@/context/FinanceContext";
import { CardVisual } from "@/components/CardVisual";
import { HouseSyncPanel } from "@/components/HouseSyncPanel";
import { personLabel } from "@/lib/finance";
import type { CardKind, Person } from "@/lib/types";

export default function TarjetasPage() {
  const { ready, data, addCard, removeCard, updateHousehold } = useFinance();
  const [name, setName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [owner, setOwner] = useState<Person>("mama");
  const [kind, setKind] = useState<CardKind>("credito");
  const [dueDay, setDueDay] = useState("10");
  const [showForm, setShowForm] = useState(false);
  const [editNames, setEditNames] = useState(false);
  const [msg, setMsg] = useState("");

  if (!ready) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const four = lastFour.replace(/\D/g, "").slice(-4);
    if (!name.trim() || four.length !== 4) {
      setMsg("Nombre y 4 dígitos, por favor.");
      return;
    }
    const day = Number(dueDay);
    if (!day || day < 1 || day > 28) {
      setMsg("Día entre 1 y 28, por favor.");
      return;
    }
    addCard({
      name: name.trim(),
      lastFour: four,
      owner,
      dueDay: day,
      kind,
    });
    setName("");
    setLastFour("");
    setDueDay("10");
    setKind("credito");
    setShowForm(false);
    setMsg("");
  }

  function askRemove(cardName: string, id: string) {
    if (
      confirm(
        `¿Borrar ${cardName}? También se van las compras de esa tarjeta.`,
      )
    ) {
      removeCard(id);
    }
  }

  return (
    <div className="animate-in space-y-5">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-hot)]">
          Billetera
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[2rem] font-extrabold leading-none tracking-tight">
          Tarjetas
        </h1>
        <p className="mt-2 max-w-[22rem] text-[14px] leading-snug text-[var(--muted)]">
          Crédito o débito. Cada compra queda en un plástico y al mes queda
          claro qué hay que pagar.
        </p>
        <div className="mt-3">
          <HouseSyncPanel />
        </div>
      </header>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] text-[var(--ink)]">
          <span className="font-semibold">{data.household.mamaName}</span>
          <span className="mx-1.5 text-[var(--muted)]">·</span>
          <span className="font-semibold">{data.household.papaName}</span>
        </p>
        <button
          type="button"
          className="text-sm font-medium text-[var(--muted)] underline underline-offset-2"
          onClick={() => setEditNames((v) => !v)}
        >
          {editNames ? "Listo" : "Cambiar nombres"}
        </button>
      </div>

      {editNames && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="mama">
              Nombre 1
            </label>
            <input
              id="mama"
              className="field"
              value={data.household.mamaName}
              onChange={(e) => updateHousehold({ mamaName: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="papa">
              Nombre 2
            </label>
            <input
              id="papa"
              className="field"
              value={data.household.papaName}
              onChange={(e) => updateHousehold({ papaName: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.cards.map((card) => (
          <CardVisual
            key={card.id}
            name={card.name}
            lastFour={card.lastFour}
            color={card.color}
            ownerLabel={personLabel(card.owner, data.household)}
            dueDay={card.dueDay}
            kind={card.kind}
            onRemove={() => askRemove(card.name, card.id)}
          />
        ))}
      </div>

      {data.cards.length === 0 && !showForm && (
        <p className="text-center text-sm text-[var(--muted)]">
          Todavía no hay tarjetas. Agreguen la primera.
        </p>
      )}

      {showForm ? (
        <form onSubmit={onSubmit} className="space-y-3 border-t border-[var(--line)] pt-4">
          <div>
            <label className="label" htmlFor="cname">
              Nombre
            </label>
            <input
              id="cname"
              className="field"
              placeholder="Visa crédito, Débito banco…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="kind">
              Tipo
            </label>
            <select
              id="kind"
              className="field"
              value={kind}
              onChange={(e) => setKind(e.target.value as CardKind)}
            >
              <option value="credito">Crédito</option>
              <option value="debito">Débito</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="four">
                Últimos 4
              </label>
              <input
                id="four"
                className="field"
                inputMode="numeric"
                maxLength={4}
                placeholder="4321"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="due">
                {kind === "debito" ? "Día de pago" : "Día vencimiento"}
              </label>
              <input
                id="due"
                className="field"
                inputMode="numeric"
                min={1}
                max={28}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="owner">
              De quién es
            </label>
            <select
              id="owner"
              className="field"
              value={owner}
              onChange={(e) => setOwner(e.target.value as Person)}
            >
              <option value="mama">{data.household.mamaName}</option>
              <option value="papa">{data.household.papaName}</option>
              <option value="juntos">Compartida</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">
              Guardar
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-accent w-full"
          onClick={() => setShowForm(true)}
        >
          + Agregar tarjeta
        </button>
      )}

      {msg && (
        <p className="text-center text-sm font-semibold text-[var(--accent-hot)]">
          {msg}
        </p>
      )}
    </div>
  );
}
