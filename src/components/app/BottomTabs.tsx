import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/conference", label: "Conference", icon: CalendarDays },
  { to: "/more", label: "More", icon: Menu },
] as const;

export function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const conferencePaths = ["/conference", "/schedule", "/speakers"];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[640px] -translate-x-1/2 border-t border-border bg-surface/95 backdrop-blur-lg supports-[backdrop-filter]:bg-surface/80"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.25rem)" }}
    >
      <ul className="grid grid-cols-3">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active =
            pathname === to ||
            (to === "/conference" && conferencePaths.some((path) => pathname.startsWith(path))) ||
            (to !== "/home" && to !== "/conference" && pathname.startsWith(to));
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary-soft",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
