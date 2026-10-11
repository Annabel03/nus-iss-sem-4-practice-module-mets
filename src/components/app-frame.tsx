"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Monogram } from "@/components/atoms/EntityChip";
import { Icon, type MetsIconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline">
      <Monogram color="#111827" className="size-7 text-[0.6rem]">
        M
      </Monogram>
      <div className="flex flex-col">
        <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
          METS
        </span>
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ink-3">
          Learning Hub
        </span>
      </div>
    </Link>
  );
}

export function DeskNav() {
  return (
    <>
      <NavLink href="/" icon="tutor">
        Tutor
      </NavLink>
      <NavLink href="/diagnostics" icon="question">
        Diagnostics
      </NavLink>
      <NavLink href="/evals" icon="evals">
        Evals
      </NavLink>
    </>
  );
}

export function NavLink({
  href,
  active,
  children,
  icon,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
  icon?: MetsIconName;
}) {
  const pathname = usePathname();
  const matched =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  const isActive = active ?? matched;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 border-b-2 px-1 py-2 text-sm no-underline transition-colors",
        isActive
          ? "border-ink font-medium text-ink"
          : "border-transparent text-ink-2 hover:text-ink",
      )}
    >
      {icon ? (
        <Icon
          icon={icon}
          size={14}
          className={isActive ? "text-ink" : "text-ink-3"}
        />
      ) : null}
      {children}
    </Link>
  );
}

export function AppFrame({
  nav,
  actions,
  sidebar,
  rail,
  children,
}: {
  nav?: ReactNode;
  actions?: ReactNode;
  sidebar?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (desktop.matches) setSidebarOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {sidebar ? (
        <>
          {sidebarOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-ink/20 lg:hidden"
              aria-label="Close student menu"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
          <aside
            id="student-sidebar"
            className={cn(
              "flex-col overflow-y-auto border-r border-line bg-surface px-5 py-6",
              "lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0",
              sidebarOpen ? "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw]" : "hidden",
            )}
          >
            {sidebar}
          </aside>
        </>
      ) : null}
      {sidebar ? (
        <button
          type="button"
          className="fixed top-3 left-4 z-[60] inline-flex size-9 items-center justify-center rounded-md border border-line bg-surface text-ink-2 transition-colors hover:bg-hover hover:text-ink lg:hidden"
          aria-label={sidebarOpen ? "Close student menu" : "Open student menu"}
          aria-expanded={sidebarOpen}
          aria-controls="student-sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <Icon icon={sidebarOpen ? "cancel" : "menu"} size={18} />
        </button>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-line bg-surface py-3",
            sidebar ? "pl-14 pr-6 sm:pl-16 sm:pr-8 lg:px-8" : "px-6 sm:px-8",
          )}
        >
          <div className="flex items-center gap-3 sm:gap-6">
            <BrandMark />
            <nav className="flex items-center gap-2">{nav}</nav>
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </header>
        <div className="flex min-h-0 min-w-0 flex-1">
          <main className="min-w-0 flex-1">{children}</main>
          {rail ? (
            <aside className="sticky top-0 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 flex-col overflow-y-auto border-l border-line bg-surface px-6 py-6 xl:flex">
              {rail}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
