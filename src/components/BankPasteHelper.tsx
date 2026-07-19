"use client";

import { useState } from "react";

const steps = [
  {
    n: "1",
    title: "Abran la app del banco",
    body: "Galicia, Santander, Mercado Pago, Ualá, o la que usen. Busquen el aviso de la compra o el historial de movimientos.",
  },
  {
    n: "2",
    title: "Copien el texto del aviso",
    body: "Mantengan el dedo apretado sobre el mensaje hasta que aparezca “Copiar”. Si no deja copiar, anoten a mano el comercio, el monto y si hubo cuotas.",
  },
  {
    n: "3",
    title: "Péguenlo aquí abajo",
    body: "Vuelvan a esta pantalla, toquen el cuadro y elijan “Pegar”. Después toquen “Completar solo”.",
  },
];

type Props = {
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  appliedHint?: string;
};

export function BankPasteHelper({ value, onChange, onApply, appliedHint }: Props) {
  const [showHow, setShowHow] = useState(false);

  return (
    <section className="space-y-3">
      <div>
        <p className="label">Atajo</p>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
          Pegar aviso del banco
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
          Usen la notificación o el movimiento de la app del banco.
        </p>
      </div>

      <button
        type="button"
        className="text-sm font-semibold text-[var(--mint)] underline underline-offset-2"
        onClick={() => setShowHow((v) => !v)}
      >
        {showHow ? "Ocultar cómo se hace" : "¿Cómo copio desde la app?"}
      </button>

      {showHow && (
        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-3 py-1">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-bold text-white">
                {s.n}
              </span>
              <div>
                <p className="font-semibold text-[var(--ink)]">{s.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-[var(--muted)]">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div>
        <label className="label" htmlFor="bank-paste">
          Peguen el aviso aquí
        </label>
        <textarea
          id="bank-paste"
          className="field min-h-[96px] resize-y text-[15px] leading-relaxed"
          placeholder='Ejemplo: "Compra *4321 SUPER $25.000" o "... en 6 cuotas"'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn btn-accent w-full text-base"
        onClick={onApply}
        disabled={!value.trim()}
      >
        Completar solo
      </button>

      {appliedHint && (
        <p className="text-center text-sm font-semibold text-[var(--mint)]">
          {appliedHint}
        </p>
      )}
    </section>
  );
}
