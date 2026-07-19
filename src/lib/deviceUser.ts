import type { Person } from "./types";

export type DeviceUser = Exclude<Person, "juntos">;

export const DEVICE_USER_KEY = "nosepeleen-who";

export function loadDeviceUser(): DeviceUser | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(DEVICE_USER_KEY);
  if (v === "mama" || v === "papa") return v;
  return null;
}

export function saveDeviceUser(user: DeviceUser): void {
  localStorage.setItem(DEVICE_USER_KEY, user);
}

export function clearDeviceUser(): void {
  localStorage.removeItem(DEVICE_USER_KEY);
}
