"use client";

import Link from "next/link";
import { useTutorial } from "@/components/TutorialProvider";

const sections = [
  {
    title: "¿Para qué sirve?",
    body: "Para que los dos vean la misma lista de compras en cuotas. Nada de agendas separadas: acá aparece qué se compró, con qué tarjeta y qué cuota toca este mes.",
  },
  {
    title: "1. Cargar las tarjetas",
    body: "En Tarjetas agreguen cada plástico con un nombre claro, los últimos 4 dígitos y el día en que vence el resumen. Es el paso uno, siempre.",
    href: "/tarjetas",
    cta: "Ir a Tarjetas",
  },
  {
    title: "2. Sumar una compra",
    body: "Cuando compren algo en cuotas, vayan a Sumar. Pueden escribirlo a mano o pegar el aviso desde la aplicación del banco (ya casi no llegan SMS). Si ya venían pagando (ej: van en la cuota 7 de 12), activen “Ya venían pagando cuotas” y pongan el mes de la primera cuota.",
    href: "/nueva",
    cta: "Ir a Sumar",
  },
  {
    title: "Cómo copiar desde la app del banco",
    body: "Abrí la app del banco → buscá el aviso o el movimiento → mantené apretado el texto → Copiar → volvé a No Se Peleen → Pegar → Completar solo. Revisen que los datos estén bien y guarden.",
  },
  {
    title: "3. Marcar lo pagado",
    body: "En Este mes toquen cada cuota cuando la paguen. Se tacha y baja el pendiente. Háganlo juntos si pueden: así no hay “yo pensé que vos…”.",
    href: "/",
    cta: "Ir a Este mes",
  },
  {
    title: "Si se enojan",
    body: "En Zen hay tres respiraciones para calmarse antes de hablar de plata. Después vuelven a la lista.",
    href: "/zen",
    cta: "Ir a Zen",
  },
  {
    title: "Dos celulares",
    body: "En Tarjetas, uno crea la “casa” y le pasa el código AMOR-xxxx al otro por WhatsApp. Con Firebase conectado, los dos ven lo mismo al instante. Si hace falta, también hay backup manual (exportar/importar).",
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
          Léanlo una vez con calma. Después pueden volver acá cuando quieran
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

      <div className="space-y-3">
        {sections.map((s) => (
          <article
            key={s.title}
            className="rounded-[1.35rem] border border-[var(--line)] bg-white/70 p-4"
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
              {s.title}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
              {s.body}
            </p>
            {"href" in s && s.href && s.cta && (
              <Link
                href={s.href}
                className="mt-3 inline-flex text-sm font-bold text-[var(--mint)]"
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
