import type { AppData } from "./types";

/** Marca la agenda como la versión más reciente. */
export function touchData(data: AppData): AppData {
  return { ...data, updatedAt: new Date().toISOString() };
}

export function ensureUpdatedAt(data: AppData): AppData {
  if (data.updatedAt) return data;
  return touchData(data);
}

function timeOf(data: AppData): number {
  const t = Date.parse(data.updatedAt || "");
  return Number.isFinite(t) ? t : 0;
}

/**
 * Última escritura gana.
 * Así un borrado no “revive” por un merge que vuelve a unir tarjetas.
 */
export function pickLatest(
  local: AppData,
  remote: AppData | null,
): { data: AppData; shouldUpload: boolean } {
  const localReady = ensureUpdatedAt(local);
  if (!remote) {
    return { data: localReady, shouldUpload: true };
  }
  const remoteReady = ensureUpdatedAt(remote);
  if (timeOf(remoteReady) > timeOf(localReady)) {
    return { data: remoteReady, shouldUpload: false };
  }
  if (timeOf(localReady) > timeOf(remoteReady)) {
    return { data: localReady, shouldUpload: true };
  }
  // Empate: preferir la que tenga más contenido (arranque inicial)
  const localScore =
    localReady.cards.length +
    localReady.purchases.length +
    localReady.payments.length;
  const remoteScore =
    remoteReady.cards.length +
    remoteReady.purchases.length +
    remoteReady.payments.length;
  if (localScore > remoteScore) {
    return { data: touchData(localReady), shouldUpload: true };
  }
  return { data: remoteReady, shouldUpload: false };
}

export function isRemoteNewer(local: AppData, remote: AppData): boolean {
  return timeOf(remote) > timeOf(local);
}
