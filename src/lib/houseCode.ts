export const HOUSE_CODE_KEY = "nosepeleen-house-code";

export function loadHouseCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(HOUSE_CODE_KEY);
}

export function saveHouseCode(code: string): void {
  localStorage.setItem(HOUSE_CODE_KEY, code);
}

export function clearHouseCode(): void {
  localStorage.removeItem(HOUSE_CODE_KEY);
}
