"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";

export function HouseSyncPanel() {
  const {
    cloudEnabled,
    houseCode,
    syncStatus,
    createHouse,
    joinHouse,
    leaveHouse,
  } = useFinance();
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!cloudEnabled) {
    return (
      <section className="space-y-2 rounded-2xl border border-dashed border-[var(--line-strong)] bg-white/40 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Nube (Firebase)
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
          Todavía no está conectada la nube. Cuando configures Firebase, Pamela
          e Itae van a ver lo mismo en los dos celulares automáticamente.
        </p>
      </section>
    );
  }

  async function onCreate() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const code = await createHouse();
      setMsg(`Casa creada. Código: ${code}. Pasáselo a Itae/Pamela.`);
    } catch {
      setErr("No se pudo crear la casa. Revisá la conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await joinHouse(joinCode);
      setJoinCode("");
      setMsg("Listo: este celular quedó unido a la casa.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo unir");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel =
    syncStatus === "synced"
      ? "Sincronizado ✓"
      : syncStatus === "connecting"
        ? "Conectando…"
        : syncStatus === "error"
          ? "Error de sync"
          : "Solo en este celular";

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Misma agenda en los dos celulares
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-[var(--muted)]">
          Uno crea la casa y le pasa el código al otro por WhatsApp. Después
          todo se actualiza solo.
        </p>
      </div>

      <p className="text-sm font-bold text-[var(--mint)]">{statusLabel}</p>

      {houseCode ? (
        <div className="space-y-3 rounded-xl bg-[var(--paper-deep)]/70 p-3">
          <p className="text-sm text-[var(--muted)]">Código de su casa</p>
          <p className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-wide text-[var(--ink)]">
            {houseCode}
          </p>
          <button
            type="button"
            className="btn btn-ghost w-full text-sm"
            onClick={() => {
              void navigator.clipboard.writeText(houseCode).then(
                () => setMsg("Código copiado. Mandalo por WhatsApp."),
                () => setMsg("Copiá el código a mano."),
              );
            }}
          >
            Copiar código
          </button>
          <button
            type="button"
            className="btn btn-danger w-full py-2 text-sm"
            onClick={() => {
              if (confirm("¿Salir de la casa? Este celular deja de sincronizar.")) {
                leaveHouse();
                setMsg("Saliste de la casa. Los datos locales siguen acá.");
              }
            }}
          >
            Salir de esta casa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            className="btn btn-primary w-full text-base"
            disabled={busy}
            onClick={() => void onCreate()}
          >
            Crear casa para Pamela e Itae
          </button>

          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-[var(--line-strong)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              o unirse
            </span>
            <div className="h-px flex-1 bg-[var(--line-strong)]" />
          </div>

          <div>
            <label className="label" htmlFor="join">
              Código que te pasaron
            </label>
            <input
              id="join"
              className="field text-[16px] uppercase tracking-wider"
              placeholder="AMOR-1234"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-accent w-full text-base"
            disabled={busy || !joinCode.trim()}
            onClick={() => void onJoin()}
          >
            Unirme a esa casa
          </button>
        </div>
      )}

      {msg && (
        <p className="text-center text-sm font-semibold text-[var(--mint)]">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-center text-sm font-semibold text-[var(--accent-hot)]">
          {err}
        </p>
      )}
    </section>
  );
}
