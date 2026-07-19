"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const sideLinks = [
  { href: "/", label: "Mes", icon: CalendarIcon },
  { href: "/compras", label: "Compras", icon: BagIcon },
  { href: "/tarjetas", label: "Tarjetas", icon: CardIcon },
  { href: "/zen", label: "Zen", icon: HeartIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const sumarActive =
    pathname === "/nueva" || pathname.startsWith("/nueva/");

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))]"
      aria-label="Navegación"
    >
      <div className="pointer-events-auto relative mx-auto flex max-w-lg items-end justify-center">
        <div className="flex w-full items-center gap-1 rounded-[1.65rem] border border-white/60 bg-[rgba(255,248,240,0.88)] px-1.5 py-1.5 shadow-[0_12px_40px_-12px_rgba(26,39,68,0.35)] backdrop-blur-xl">
          <NavItem
            href={sideLinks[0].href}
            label={sideLinks[0].label}
            icon={sideLinks[0].icon}
            active={pathname === "/"}
          />
          <NavItem
            href={sideLinks[1].href}
            label={sideLinks[1].label}
            icon={sideLinks[1].icon}
            active={
              pathname === "/compras" || pathname.startsWith("/compras/")
            }
          />

          <div className="relative -mt-7 mb-0.5 flex w-[4.5rem] shrink-0 flex-col items-center">
            <Link
              href="/nueva"
              aria-label="Sumar compra"
              className={`flex h-14 w-14 items-center justify-center rounded-full shadow-[0_10px_28px_-8px_rgba(26,39,68,0.45)] transition-transform active:scale-95 ${
                sumarActive
                  ? "bg-[var(--ink)] text-white"
                  : "bg-[var(--accent)] text-[var(--ink)]"
              }`}
            >
              <PlusIcon />
            </Link>
            <span
              className={`mt-1 text-[10px] font-bold tracking-wide ${
                sumarActive ? "text-[var(--ink)]" : "text-[var(--muted)]"
              }`}
            >
              Sumar
            </span>
          </div>

          <NavItem
            href={sideLinks[2].href}
            label={sideLinks[2].label}
            icon={sideLinks[2].icon}
            active={
              pathname === "/tarjetas" || pathname.startsWith("/tarjetas/")
            }
          />
          <NavItem
            href={sideLinks[3].href}
            label={sideLinks[3].label}
            icon={sideLinks[3].icon}
            active={pathname === "/zen" || pathname.startsWith("/zen/")}
          />
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: (p: { active: boolean }) => ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 transition-colors ${
        active ? "text-[var(--ink)]" : "text-[var(--muted)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          active ? "bg-[var(--ink)]/8" : "bg-transparent"
        }`}
      >
        <Icon active={active} />
      </span>
      <span className="truncate text-[10px] font-bold tracking-wide">
        {label}
      </span>
      <span
        className={`h-1 w-1 rounded-full transition-opacity ${
          active ? "bg-[var(--accent-hot)] opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
    </Link>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  const w = active ? 2.1 : 1.7;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth={w} />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
}

function BagIcon({ active }: { active: boolean }) {
  const w = active ? 2.1 : 1.7;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8z" stroke="currentColor" strokeWidth={w} strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function CardIcon({ active }: { active: boolean }) {
  const w = active ? 2.1 : 1.7;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth={w} />
      <path d="M2 10h20" stroke="currentColor" strokeWidth={w} />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  const w = active ? 2.1 : 1.7;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"
        stroke="currentColor"
        strokeWidth={w}
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}
