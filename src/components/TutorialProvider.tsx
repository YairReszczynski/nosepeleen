"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Tutorial } from "@/components/Tutorial";
import { clearTutorialSeen, hasSeenTutorial } from "@/lib/tutorial";

type TutorialContextValue = {
  openTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [session, setSession] = useState(0);

  useEffect(() => {
    if (!hasSeenTutorial()) setVisible(true);
  }, []);

  const openTutorial = useCallback(() => {
    clearTutorialSeen();
    setSession((s) => s + 1);
    setVisible(true);
  }, []);

  return (
    <TutorialContext.Provider value={{ openTutorial }}>
      {children}
      {visible && (
        <Tutorial key={session} onClose={() => setVisible(false)} />
      )}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial dentro de TutorialProvider");
  return ctx;
}
