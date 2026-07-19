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

  return (
    <div className="animate-in space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-hot)]">
          Billetera
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Tarjetas
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Crédito o débito. Cada compra se anota en un plástico y al final del
          mes se ve claro qué toca pagar.
        </p>
      </header>

      <HouseSyncPanel />

      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--line)] bg-white/60 p-4">
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
      </section>

      <div className="space-y-3">
        {data.cards.map((card) => (
          <div key={card.id} className="space-y-2">
            <CardVisual
              name={card.name}
              lastFour={card.lastFour}
              color={card.color}
              ownerLabel={personLabel(card.owner, data.household)}
              dueDay={card.dueDay}
              kind={card.kind}
            />
            <button
              type="button"
              className="btn btn-danger w-full py-2 text-sm"
              onClick={() => {
                if (
                  confirm(
                    `¿Borrar ${card.name}? También se van las compras de esa tarjeta.`,
                  )
                ) {
                  removeCard(card.id);
                }
              }}
            >
              Quitar tarjeta
            </button>
          </div>
        ))}
      </div>

      {data.cards.length === 0 && !showForm && (
        <p className="text-center text-sm text-[var(--muted)]">
          Todavía no hay tarjetas. Agreguen la primera.
        </p>
      )}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4"
        >
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
        <p className="text-center text-sm font-semibold text-[var(--mint)]">
          {msg}
        </p>
      )}
    </div>
  );
}
