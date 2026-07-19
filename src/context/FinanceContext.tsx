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
  createCloudHousehold,
  fetchCloudHousehold,
  isFirebaseConfigured,
  saveCloudHousehold,
  subscribeCloudHousehold,
} from "@/lib/firebase";
import { pickRicherOrMerge } from "@/lib/merge";
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
  const applyingRemote = useRef(false);
  const skipNextCloudSave = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Carga local + nubeización (con merge para no pisar datos)
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

    void (async () => {
      try {
        saveHouseCode(FAMILY_SYNC_ID);
        const remote = await fetchCloudHousehold(FAMILY_SYNC_ID);
        if (cancelled) return;

        if (!remote) {
          await createCloudHousehold(FAMILY_SYNC_ID, local);
          setData(local);
        } else {
          const merged = pickRicherOrMerge(local, remote);
          applyingRemote.current = true;
          setData(merged);
          await saveCloudHousehold(FAMILY_SYNC_ID, merged);
          queueMicrotask(() => {
            applyingRemote.current = false;
          });
        }

        setSynced(true);
        setSyncStatus("synced");
      } catch {
        if (!cancelled) setSyncStatus("error");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudEnabled]);

  useEffect(() => {
    if (!ready) return;
    saveData(data);
  }, [data, ready]);

  useEffect(() => {
    if (!ready || !cloudEnabled || !synced) return;

    let unsub = () => {};

    try {
      unsub = subscribeCloudHousehold(
        FAMILY_SYNC_ID,
        (remote) => {
          setData((prev) => {
            const merged = pickRicherOrMerge(prev, remote);
            if (JSON.stringify(merged) === JSON.stringify(prev)) {
              return prev;
            }
            skipNextCloudSave.current = true;
            return merged;
          });
          setSyncStatus("synced");
        },
        () => setSyncStatus("error"),
      );
    } catch {
      setSyncStatus("error");
    }

    return () => unsub();
  }, [ready, cloudEnabled, synced]);

  useEffect(() => {
    if (!ready || !cloudEnabled || !synced) return;
    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }
    if (applyingRemote.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveCloudHousehold(FAMILY_SYNC_ID, data)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }, 450);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready, cloudEnabled, synced]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData(fn);
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
      updateHousehold: (h) =>
        update((prev) => ({
          ...prev,
          household: { ...prev.household, ...h },
        })),
      addCard: (input) =>
        update((prev) => ({
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
              addedBy: currentUserRef.current ?? undefined,
            },
          ],
        })),
      updateCard: (id, patch) =>
        update((prev) => ({
          ...prev,
          cards: prev.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCard: (id) =>
        update((prev) => ({
          ...prev,
          cards: prev.cards.filter((c) => c.id !== id),
          purchases: prev.purchases.filter((p) => p.cardId !== id),
          payments: prev.payments.filter((pay) => {
            const purchase = prev.purchases.find(
              (p) => p.id === pay.purchaseId,
            );
            return purchase?.cardId !== id;
          }),
        })),
      addPurchase: (input) =>
        update((prev) => {
          const installmentAmount =
            input.installmentAmount ??
            Math.round(input.totalAmount / input.installments);
          const id = createId();
          const alreadyPaid = Math.max(
            0,
            Math.min(input.alreadyPaidCount ?? 0, input.installments),
          );
          const now = new Date().toISOString();
          const who = currentUserRef.current ?? undefined;
          const paidMarks = Array.from({ length: alreadyPaid }, (_, i) => ({
            purchaseId: id,
            installmentNumber: i + 1,
            paidAt: now,
            markedBy: who,
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
                notes: input.notes,
                addedBy: who,
              },
              ...prev.purchases,
            ],
            payments: [...prev.payments, ...paidMarks],
          };
        }),
      removePurchase: (id) =>
        update((prev) => ({
          ...prev,
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
          return {
            ...prev,
            payments: [
              ...prev.payments,
              {
                purchaseId,
                installmentNumber,
                paidAt: new Date().toISOString(),
                markedBy: currentUserRef.current ?? undefined,
              },
            ],
          };
        }),
      exportJson: () => exportData(data),
      importJson: (json) => setData(importData(json)),
      resetAll: () => setData(createDefaultData()),
    }),
    [
      ready,
      data,
      monthKey,
      syncStatus,
      cloudEnabled,
      currentUser,
      setCurrentUser,
      update,
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
