"use client";

import Link from "next/link";
import { useTutorial } from "@/components/TutorialProvider";

const sections = [
  {
    title: "¿Para qué sirve?",
    body: "Para que los dos vean la misma lista de gastos: crédito, débito, con cuotas o un solo pago. Nada de agendas separadas.",
  },
  {
    title: "1. Agregar las tarjetas",
    body: "En Tarjetas agreguen cada plástico (crédito o débito) con un nombre claro, los últimos 4 dígitos y el día del mes en que suelen pagar.",
    href: "/tarjetas",
    cta: "Ir a Tarjetas",
  },
  {
    title: "2. Sumar una compra",
    body: "Vayan a Sumar. Si es de contado o débito, pongan 1 cuota. Si es en cuotas, indiquen cuántas y qué día del mes se paga. También pueden pegar el aviso de la app del banco. Si ya venían pagando (ej: van en la 7 de 12), activen “Ya venían pagando”.",
    href: "/nueva",
    cta: "Ir a Sumar",
  },
  {
    title: "Cómo copiar desde la app del banco",
    body: "Abran la app del banco → busquen el aviso o el movimiento → mantengan apretado el texto → Copiar → vuelvan a No Se Peleen → Pegar → Completar solo. Revisen que los datos estén bien y guarden.",
  },
  {
    title: "3. Marcar lo pagado",
    body: "En Este mes toquen cada ítem cuando lo paguen. Se tacha y baja el pendiente. Háganlo juntos si pueden.",
    href: "/",
    cta: "Ir a Este mes",
  },
  {
    title: "Si se enojan",
    body: "En Zen hay tres respiraciones para calmarse antes de hablar de dinero. Después vuelven a la lista.",
    href: "/zen",
    cta: "Ir a Zen",
  },
  {
    title: "Dos teléfonos",
    body: "Pamela e Itae abren la misma app. Todo se guarda en la nube: lo que anota uno, lo ve el otro de inmediato.",
    href: "/tarjetas",
    cta: "Ir a Tarjetas",
  },
];

export default function AyudaPage() {
  const { openTutorial } = useTutorial();

  return (
    <div className="animate-in space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-hot)]">
          Guía para padres
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Cómo usar No Se Peleen
        </h1>
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
          Léanlo una vez con calma. Después pueden volver aquí cuando quieran
          con el botón de ayuda.
        </p>
        <button
          type="button"
          className="btn btn-accent w-full text-base"
          onClick={openTutorial}
        >
          Ver el tutorial paso a paso
        </button>
      </header>

      <div className="divide-y divide-[var(--line)]">
        {sections.map((s) => (
          <article key={s.title} className="py-4 first:pt-0">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
              {s.title}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
              {s.body}
            </p>
            {"href" in s && s.href && s.cta && (
              <Link
                href={s.href}
                className="mt-2 inline-flex text-sm font-bold text-[var(--mint)]"
              >
                {s.cta} →
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
