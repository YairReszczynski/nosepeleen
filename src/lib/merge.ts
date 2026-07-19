import type { AppData } from "./types";
import { applyTombstones, mergeTombstones } from "./storage";

const EPOCH = "1970-01-01T00:00:00.000Z";

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

function hasUnsyncedTombstones(local: AppData, remote: AppData): boolean {
  const remoteCards = new Set(remote.deletedCardIds ?? []);
  const remotePurchases = new Set(remote.deletedPurchaseIds ?? []);
  return (
    (local.deletedCardIds ?? []).some((id) => !remoteCards.has(id)) ||
    (local.deletedPurchaseIds ?? []).some((id) => !remotePurchases.has(id))
  );
}

export function pickLatest(
  local: AppData,
  remote: AppData | null,
): { data: AppData; shouldUpload: boolean } {
  if (!remote) {
    return {
      data: applyTombstones({
        ...local,
        updatedAt:
          local.updatedAt && local.updatedAt !== EPOCH
            ? local.updatedAt
            : new Date().toISOString(),
      }),
      shouldUpload: true,
    };
  }

  const localEmpty = isEmptyAgenda(local);
  const remoteEmpty = isEmptyAgenda(remote);
  const localHasDeletes = hasUnsyncedTombstones(local, remote);
  const remoteHasDeletes = hasUnsyncedTombstones(remote, local);

  // Agenda vacía local no pisa nube con datos (salvo que haya borrados locales)
  if (localEmpty && !remoteEmpty && !localHasDeletes) {
    return {
      data: applyTombstones(mergeTombstones(remote, local)),
      shouldUpload: false,
    };
  }
  if (!localEmpty && remoteEmpty && !remoteHasDeletes) {
    return {
      data: touchData(applyTombstones(mergeTombstones(local, remote))),
      shouldUpload: true,
    };
  }

  const lt = timeOf(local);
  const rt = timeOf(remote);

  if (rt > lt) {
    const merged = applyTombstones(mergeTombstones(remote, local));
    if (localHasDeletes) {
      // Remoto “ganó” por timestamp, pero hay borrados locales que deben subir
      return { data: touchData(merged), shouldUpload: true };
    }
    return { data: merged, shouldUpload: false };
  }
  if (lt > rt) {
    return {
      data: applyTombstones(mergeTombstones(local, remote)),
      shouldUpload: true,
    };
  }

  // Empate de tiempo: unimos tombstones; subimos si hay algo que la nube no tiene
  const merged = applyTombstones(mergeTombstones(local, remote));
  if (localHasDeletes || contentScore(local) > contentScore(remote)) {
    return { data: touchData(merged), shouldUpload: true };
  }
  return { data: merged, shouldUpload: false };
}

export function isRemoteNewer(local: AppData, remote: AppData): boolean {
  return timeOf(remote) > timeOf(local);
}
