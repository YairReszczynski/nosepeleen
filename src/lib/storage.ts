import type { AppData, Card, Household } from "./types";

export const STORAGE_KEY = "nosepeleen-v1";

export const CARD_COLORS = [
  "#1a2744",
  "#e85d4c",
  "#2a9d8f",
  "#e9c46a",
  "#7b2cbf",
  "#264653",
  "#f4a261",
  "#2d6a4f",
];

export const defaultHousehold: Household = {
  mamaName: "Pamela",
  papaName: "Itae",
};

export function createId(): string {
  return crypto.randomUUID();
}

export function createDefaultData(): AppData {
  return {
    version: 1,
    household: { ...defaultHousehold },
    cards: [],
    purchases: [],
    payments: [],
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return createDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as AppData;
    if (parsed.version !== 1) return createDefaultData();
    const household = { ...defaultHousehold, ...parsed.household };
    // Migrar nombres genéricos viejos
    if (household.mamaName === "Mamá") household.mamaName = "Pamela";
    if (household.papaName === "Papá") household.papaName = "Itae";
    const cards = (parsed.cards ?? []).map((c) => ({
      ...c,
      kind: c.kind === "debito" ? ("debito" as const) : ("credito" as const),
    }));
    const purchases = (parsed.purchases ?? []).map((p) => ({
      ...p,
      paymentDay:
        typeof p.paymentDay === "number" && p.paymentDay >= 1
          ? p.paymentDay
          : 10,
    }));
    return {
      ...createDefaultData(),
      ...parsed,
      household,
      cards,
      purchases,
      payments: parsed.payments ?? [],
    };
  } catch {
    return createDefaultData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): AppData {
  const parsed = JSON.parse(json) as AppData;
  if (!parsed || parsed.version !== 1) {
    throw new Error("Archivo inválido");
  }
  return {
    version: 1,
    household: { ...defaultHousehold, ...parsed.household },
    cards: parsed.cards ?? [],
    purchases: parsed.purchases ?? [],
    payments: parsed.payments ?? [],
  };
}

export function suggestCardColor(existing: Card[]): string {
  const used = new Set(existing.map((c) => c.color));
  return CARD_COLORS.find((c) => !used.has(c)) ?? CARD_COLORS[0];
}
