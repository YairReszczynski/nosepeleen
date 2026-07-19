import type { AppData, PaymentMark } from "./types";
import { createDefaultData } from "./storage";

function contentScore(data: AppData): number {
  return data.cards.length * 10 + data.purchases.length * 5 + data.payments.length;
}

function mergePayments(a: PaymentMark[], b: PaymentMark[]): PaymentMark[] {
  const map = new Map<string, PaymentMark>();
  for (const p of [...a, ...b]) {
    const key = `${p.purchaseId}:${p.installmentNumber}`;
    const prev = map.get(key);
    if (!prev || (p.paidAt && p.paidAt > prev.paidAt)) {
      map.set(key, p);
    }
  }
  return Array.from(map.values());
}

/** Une dos copias sin borrar lo que el otro teléfono ya tenía. */
export function mergeAppData(local: AppData, remote: AppData): AppData {
  const cardMap = new Map(local.cards.map((c) => [c.id, c]));
  for (const c of remote.cards) {
    if (!cardMap.has(c.id)) cardMap.set(c.id, c);
  }

  const purchaseMap = new Map(local.purchases.map((p) => [p.id, p]));
  for (const p of remote.purchases) {
    if (!purchaseMap.has(p.id)) purchaseMap.set(p.id, p);
  }

  const base = createDefaultData();
  return {
    version: 1,
    household: {
      mamaName:
        remote.household.mamaName ||
        local.household.mamaName ||
        base.household.mamaName,
      papaName:
        remote.household.papaName ||
        local.household.papaName ||
        base.household.papaName,
    },
    cards: Array.from(cardMap.values()),
    purchases: Array.from(purchaseMap.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
    payments: mergePayments(local.payments, remote.payments),
  };
}

export function pickRicherOrMerge(local: AppData, remote: AppData | null): AppData {
  if (!remote) return local;
  const merged = mergeAppData(local, remote);
  // Si el merge quedó igual de rico o más, úsalo
  if (contentScore(merged) >= contentScore(remote)) return merged;
  return remote;
}
