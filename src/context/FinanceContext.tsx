"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Card, Household, Purchase } from "@/lib/types";
import {
  createDefaultData,
  createId,
  exportData,
  importData,
  loadData,
  saveData,
  suggestCardColor,
} from "@/lib/storage";
import { currentMonthKey } from "@/lib/finance";
import { FAMILY_SYNC_ID, saveHouseCode } from "@/lib/houseCode";
import {
  fetchCloudHousehold,
  isFirebaseConfigured,
  saveCloudHousehold,
  subscribeCloudHousehold,
} from "@/lib/firebase";
import { isRemoteNewer, pickLatest, touchData } from "@/lib/merge";
import {
  loadDeviceUser,
  saveDeviceUser,
  type DeviceUser,
} from "@/lib/deviceUser";

type SyncStatus = "local" | "connecting" | "synced" | "error";

type FinanceContextValue = {
  ready: boolean;
  data: AppData;
  monthKey: string;
  setMonthKey: (key: string) => void;
  syncStatus: SyncStatus;
  cloudEnabled: boolean;
  currentUser: DeviceUser | null;
  setCurrentUser: (user: DeviceUser) => void;
  retrySync: () => void;
  updateHousehold: (h: Partial<Household>) => void;
  addCard: (
    input: Omit<Card, "id" | "color" | "addedBy"> & {
      color?: string;
      kind?: Card["kind"];
    },
  ) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  removeCard: (id: string) => void;
  addPurchase: (
    input: Omit<
      Purchase,
      "id" | "createdAt" | "installmentAmount" | "addedBy"
    > & {
      installmentAmount?: number;
      alreadyPaidCount?: number;
    },
  ) => void;
  removePurchase: (id: string) => void;
  togglePayment: (purchaseId: string, installmentNumber: number) => void;
  exportJson: () => string;
  importJson: (json: string) => void;
  resetAll: () => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(createDefaultData);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [synced, setSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [currentUser, setCurrentUserState] = useState<DeviceUser | null>(null);
  const [bootKey, setBootKey] = useState(0);
  const skipNextCloudSave = useRef(false);
  const flushSoon = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveGeneration = useRef(0);
  const cloudEnabled = isFirebaseConfigured();
  const currentUserRef = useRef<DeviceUser | null>(null);
  currentUserRef.current = currentUser;

  useEffect(() => {
    setCurrentUserState(loadDeviceUser());
  }, []);

  const setCurrentUser = useCallback((user: DeviceUser) => {
    saveDeviceUser(user);
    setCurrentUserState(user);
  }, []);

  const retrySync = useCallback(() => {
    setSynced(false);
    setSyncStatus("connecting");
    setBootKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const local = loadData();
    setData(local);

    if (!cloudEnabled) {
      setSyncStatus("local");
      setReady(true);
      return;
    }

    let cancelled = false;
    setSyncStatus("connecting");

    // Si Firebase cuelga en Safari viejo / red mala, no dejar pantalla eterna
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setSyncStatus("error");
      setSynced(false);
      setReady(true);
    }, 10000);

    void (async () => {
      try {
        saveHouseCode(FAMILY_SYNC_ID);
        const remote = await fetchCloudHousehold(FAMILY_SYNC_ID);
        if (cancelled) return;

        const { data: winner, shouldUpload } = pickLatest(local, remote);
        skipNextCloudSave.current = !shouldUpload;
        setData(winner);
        if (shouldUpload) {
          await saveCloudHousehold(FAMILY_SYNC_ID, winner);
        }

        setSynced(true);
        setSyncStatus("synced");
      } catch {
        if (!cancelled) {
          setSyncStatus("error");
          setSynced(false);
        }
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [cloudEnabled, bootKey]);

  useEffect(() => {
    if (!ready) return;
    saveData(data);
  }, [data, ready]);

  useEffect(() => {
    if (!ready || !cloudEnabled || !synced) return;

    let unsub = () => {};
    let cancelled = false;

    void (async () => {
      try {
        unsub = await subscribeCloudHousehold(
          FAMILY_SYNC_ID,
          (remote) => {
            setData((prev) => {
              // Siempre unir tombstones; si hay borrados locales, forzar subida
              const { data: winner, shouldUpload } = pickLatest(prev, remote);
              if (!isRemoteNewer(prev, remote) && !shouldUpload) {
                return prev;
              }
              skipNextCloudSave.current = !shouldUpload;
              if (shouldUpload) flushSoon.current = true;
              return winner;
            });
            setSyncStatus("synced");
          },
          () => setSyncStatus("error"),
        );
      } catch {
        if (!cancelled) setSyncStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, [ready, cloudEnabled, synced, bootKey]);

  useEffect(() => {
    if (!ready || !cloudEnabled || !synced) return;
    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    const generation = ++saveGeneration.current;
    const snapshot = data;
    const delay = flushSoon.current ? 0 : 450;
    flushSoon.current = false;

    saveTimer.current = setTimeout(() => {
      void saveCloudHousehold(FAMILY_SYNC_ID, snapshot)
        .then((result) => {
          if (generation !== saveGeneration.current) return;
          if (result === "saved") setSyncStatus("synced");
        })
        .catch(() => {
          if (generation !== saveGeneration.current) return;
          setSyncStatus("error");
        });
    }, delay);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready, cloudEnabled, synced]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => touchData(fn(prev)));
  }, []);

  const updateAndFlush = useCallback((fn: (prev: AppData) => AppData) => {
    flushSoon.current = true;
    setData((prev) => touchData(fn(prev)));
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      ready,
      data,
      monthKey,
      setMonthKey,
      syncStatus,
      cloudEnabled,
      currentUser,
      setCurrentUser,
      retrySync,
      updateHousehold: (h) =>
        update((prev) => ({
          ...prev,
          household: { ...prev.household, ...h },
        })),
      addCard: (input) =>
        updateAndFlush((prev) => ({
          ...prev,
          cards: [
            ...prev.cards,
            {
              id: createId(),
              name: input.name,
              lastFour: input.lastFour,
              owner: input.owner,
              dueDay: input.dueDay,
              kind: input.kind ?? "credito",
              color: input.color ?? suggestCardColor(prev.cards),
              ...(currentUserRef.current
                ? { addedBy: currentUserRef.current }
                : {}),
            },
          ],
        })),
      updateCard: (id, patch) =>
        update((prev) => ({
          ...prev,
          cards: prev.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCard: (id) =>
        updateAndFlush((prev) => {
          const gonePurchases = prev.purchases.filter((p) => p.cardId === id);
          const gonePurchaseIds = new Set(gonePurchases.map((p) => p.id));
          const remainingPurchases = prev.purchases.filter(
            (p) => p.cardId !== id,
          );
          const remainingIds = new Set(remainingPurchases.map((p) => p.id));
          return {
            ...prev,
            deletedCardIds: Array.from(
              new Set([...(prev.deletedCardIds ?? []), id]),
            ),
            deletedPurchaseIds: Array.from(
              new Set([
                ...(prev.deletedPurchaseIds ?? []),
                ...gonePurchaseIds,
              ]),
            ),
            cards: prev.cards.filter((c) => c.id !== id),
            purchases: remainingPurchases,
            payments: prev.payments.filter((pay) =>
              remainingIds.has(pay.purchaseId),
            ),
          };
        }),
      addPurchase: (input) =>
        updateAndFlush((prev) => {
          const installmentAmount =
            input.installmentAmount ??
            Math.round(input.totalAmount / input.installments);
          const id = createId();
          const alreadyPaid = Math.max(
            0,
            Math.min(input.alreadyPaidCount ?? 0, input.installments),
          );
          const now = new Date().toISOString();
          const who = currentUserRef.current;
          const paidMarks = Array.from({ length: alreadyPaid }, (_, i) => ({
            purchaseId: id,
            installmentNumber: i + 1,
            paidAt: now,
            ...(who ? { markedBy: who } : {}),
          }));
          return {
            ...prev,
            purchases: [
              {
                id,
                description: input.description,
                totalAmount: input.totalAmount,
                installments: input.installments,
                installmentAmount,
                cardId: input.cardId,
                boughtBy: input.boughtBy,
                startMonth: input.startMonth,
                paymentDay: Math.min(
                  28,
                  Math.max(1, input.paymentDay ?? 10),
                ),
                createdAt: now,
                ...(input.notes ? { notes: input.notes } : {}),
                ...(who ? { addedBy: who } : {}),
              },
              ...prev.purchases,
            ],
            payments: [...prev.payments, ...paidMarks],
          };
        }),
      removePurchase: (id) =>
        updateAndFlush((prev) => ({
          ...prev,
          deletedPurchaseIds: Array.from(
            new Set([...(prev.deletedPurchaseIds ?? []), id]),
          ),
          purchases: prev.purchases.filter((p) => p.id !== id),
          payments: prev.payments.filter((p) => p.purchaseId !== id),
        })),
      togglePayment: (purchaseId, installmentNumber) =>
        update((prev) => {
          const exists = prev.payments.some(
            (p) =>
              p.purchaseId === purchaseId &&
              p.installmentNumber === installmentNumber,
          );
          if (exists) {
            return {
              ...prev,
              payments: prev.payments.filter(
                (p) =>
                  !(
                    p.purchaseId === purchaseId &&
                    p.installmentNumber === installmentNumber
                  ),
              ),
            };
          }
          const who = currentUserRef.current;
          return {
            ...prev,
            payments: [
              ...prev.payments,
              {
                purchaseId,
                installmentNumber,
                paidAt: new Date().toISOString(),
                ...(who ? { markedBy: who } : {}),
              },
            ],
          };
        }),
      exportJson: () => exportData(data),
      importJson: (json) => {
        flushSoon.current = true;
        setData(touchData(importData(json)));
      },
      resetAll: () => {
        flushSoon.current = true;
        setData(touchData(createDefaultData()));
      },
    }),
    [
      ready,
      data,
      monthKey,
      syncStatus,
      cloudEnabled,
      currentUser,
      setCurrentUser,
      retrySync,
      update,
      updateAndFlush,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance debe usarse dentro de FinanceProvider");
  return ctx;
}
