import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function FloatingChatbot() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (
    pathname.startsWith("/chatbot") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.includes("/network/room") ||
    (pathname.startsWith("/network/") && pathname !== "/network")
  ) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-1/2 z-50 w-full max-w-[640px] -translate-x-1/2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}
    >
      <div className="flex justify-end px-4">
        <Link
          to="/chatbot"
          aria-label="Open AI Assistant"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-elevated transition active:scale-95"
        >
          <Sparkles className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}
