"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const phrases = [
  { in: "Inhala…", out: "Exhala… la cuota no define su amor." },
  { in: "Inhala…", out: "Exhala… nadie compró eso para molestarte." },
  { in: "Inhala…", out: "Exhala… después miran la app juntos." },
  { in: "Inhala…", out: "Exhala… el resumen no es un ultimátum." },
  { in: "Inhala…", out: "Exhala… son un equipo, no dos agendas." },
  { in: "Inhala…", out: "Exhala… la Visa también quiere paz." },
];

type Phase = "idle" | "in" | "hold" | "out" | "done";

export default function ZenPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (phase === "idle" || phase === "done") return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (phase === "in") {
      timers.push(setTimeout(() => setPhase("hold"), 4000));
    } else if (phase === "hold") {
      timers.push(setTimeout(() => setPhase("out"), 2000));
    } else if (phase === "out") {
      timers.push(
        setTimeout(() => {
          if (round >= 2) {
            setPhase("done");
          } else {
            setRound((r) => r + 1);
            setPhraseIndex((i) => (i + 1) % phrases.length);
            setPhase("in");
          }
        }, 4000),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [phase, round]);

  const phrase = phrases[phraseIndex];
  const label =
    phase === "in"
      ? phrase.in
      : phase === "hold"
        ? "Mantén el aire un segundo…"
        : phase === "out"
          ? phrase.out
          : phase === "done"
            ? "Listo. Ahora sí pueden hablar de dinero."
            : "Antes de pelear por la tarjeta";

  function start() {
    setRound(0);
    setPhraseIndex(Math.floor(Math.random() * phrases.length));
    setPhase("in");
  }

  return (
    <div className="animate-in flex min-h-[70vh] flex-col items-center justify-center space-y-8 text-center">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mint)]">
          Modo anti-pelea
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Zen de pareja
        </h1>
      </header>

      <div className="relative flex h-52 w-52 items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full border-2 border-[var(--mint)]/40 ${
            phase === "in" || phase === "hold" || phase === "out"
              ? "pulse-ring"
              : ""
          }`}
        />
        <div
          className={`flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-[var(--mint)] to-[#1a2744] text-white shadow-[0_20px_50px_-20px_rgba(42,157,143,0.7)] ${
            phase === "in" || phase === "hold" || phase === "out"
              ? "breathe"
              : ""
          }`}
          style={
            phase === "idle" || phase === "done"
              ? { animation: "none" }
              : undefined
          }
        >
          <span className="font-[family-name:var(--font-display)] text-lg font-bold">
            {phase === "idle" ? "♥" : phase === "done" ? "✓" : "air"}
          </span>
        </div>
      </div>

      <p className="max-w-xs text-lg font-semibold leading-snug text-[var(--ink)]">
        {label}
      </p>

      {phase === "idle" && (
        <p className="max-w-xs text-sm text-[var(--muted)]">
          Tres respiraciones. Después vuelven a la app y marcan lo que
          corresponde… sin gritos.
        </p>
      )}

      {phase === "idle" || phase === "done" ? (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <button type="button" className="btn btn-primary w-full" onClick={start}>
            {phase === "done" ? "Otra ronda" : "Empezar a respirar"}
          </button>
          {phase === "done" && (
            <Link href="/" className="btn btn-accent w-full">
              Volver a Este mes
            </Link>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => setPhase("idle")}
        >
          Cancelar
        </button>
      )}

      <ul className="w-full max-w-sm space-y-2 text-left text-sm text-[var(--muted)]">
        <li>1. Hablen mirando la misma pantalla.</li>
        <li>2. Marquen lo pagado juntos.</li>
        <li>3. Si se calientan otra vez, vuelvan aquí.</li>
      </ul>
    </div>
  );
}
