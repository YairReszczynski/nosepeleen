import type { AppData } from "./types";

const EPOCH = "1970-01-01T00:00:00.000Z";

/** Marca la agenda como la versión más reciente (solo tras ediciones reales). */
export function touchData(data: AppData): AppData {
  return { ...data, updatedAt: new Date().toISOString() };
}

export function contentScore(data: AppData): number {
  return data.cards.length + data.purchases.length + data.payments.length;
}

export function isEmptyAgenda(data: AppData): boolean {
  return contentScore(data) === 0;
}

function timeOf(data: AppData): number {
  const t = Date.parse(data.updatedAt || "");
  return Number.isFinite(t) ? t : 0;
}

/**
 * Elige entre local y remoto sin pisar la nube con un teléfono vacío.
 * Última escritura gana cuando ambos tienen contenido.
 */
export function pickLatest(
  local: AppData,
  remote: AppData | null,
): { data: AppData; shouldUpload: boolean } {
  if (!remote) {
    // Primera vez: subir lo local (aunque esté vacío, seed inicial)
    return {
      data: {
        ...local,
        updatedAt: local.updatedAt && local.updatedAt !== EPOCH
          ? local.updatedAt
          : new Date().toISOString(),
      },
      shouldUpload: true,
    };
  }

  const localEmpty = isEmptyAgenda(local);
  const remoteEmpty = isEmptyAgenda(remote);

  // Nunca dejar que un teléfono vacío borre la nube con datos
  if (localEmpty && !remoteEmpty) {
    return { data: remote, shouldUpload: false };
  }
  if (!localEmpty && remoteEmpty) {
    return { data: touchData(local), shouldUpload: true };
  }

  const lt = timeOf(local);
  const rt = timeOf(remote);

  if (rt > lt) {
    return { data: remote, shouldUpload: false };
  }
  if (lt > rt) {
    return { data: local, shouldUpload: true };
  }

  // Empate de tiempo: preferir la que tenga más contenido
  if (contentScore(local) > contentScore(remote)) {
    return { data: touchData(local), shouldUpload: true };
  }
  return { data: remote, shouldUpload: false };
}

export function isRemoteNewer(local: AppData, remote: AppData): boolean {
  return timeOf(remote) > timeOf(local);
}
