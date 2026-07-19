"use client";

import { useFinance } from "@/context/FinanceContext";
import type { DeviceUser } from "@/lib/deviceUser";

export function WhoAmIGate({ children }: { children: React.ReactNode }) {
  const { ready, data, currentUser, setCurrentUser, syncStatus, cloudEnabled, retrySync } =
    useFinance();

  if (!ready) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center px-6 text-center">
        <p className="text-[var(--muted)]">Cargando la agenda…</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="relative mx-auto flex min-h-screen-safe w-full max-w-lg flex-col justify-center px-5 py-10">
        <div className="atmosphere" aria-hidden />
        <div className="relative z-10 space-y-6 animate-in">
          <header className="space-y-3 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-hot)]">
              No Se Peleen
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--ink)]">
              ¿Quién eres?
            </h1>
            <p className="mx-auto max-w-xs text-[15px] leading-relaxed text-[var(--muted)]">
              Así sabemos quién agregó cada tarjeta, compra o pago. Cada
              teléfono elige una vez.
            </p>
          </header>

          <div className="space-y-3">
            {(
              [
                { id: "mama" as DeviceUser, name: data.household.mamaName },
                { id: "papa" as DeviceUser, name: data.household.papaName },
              ] as const
            ).map((person) => (
              <button
                key={person.id}
                type="button"
                className="btn btn-primary w-full text-lg"
                onClick={() => setCurrentUser(person.id)}
              >
                Soy {person.name}
              </button>
            ))}
          </div>

          {cloudEnabled && (
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold text-[var(--mint)]">
                {syncStatus === "synced"
                  ? "Agenda en la nube lista ✓"
                  : syncStatus === "connecting"
                    ? "Conectando…"
                    : syncStatus === "error"
                      ? "Sin nube por ahora (revisen internet)"
                      : null}
              </p>
              {syncStatus === "error" && (
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={retrySync}
                >
                  Reconectar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
