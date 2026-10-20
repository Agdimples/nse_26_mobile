import { useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Port of NseTitleHeader (lib/core/widgets/nse_ui.dart): navy brand gradient
 * band with rounded bottom, brand coin, page title and subtitle. Optional
 * back navigation, mirroring the APK's inner-page headers.
 *
 * Back behaviour:
 *   - If there is a browser history entry to go back to, uses router.history.back()
 *     so it feels like the OS back button (preserves scroll position, state, etc.)
 *   - Otherwise falls back to navigating to the `backTo` path, so direct-link
 *     arrivals always land somewhere sensible.
 */
export function NsePageHeader({
  title,
  subtitle,
  backTo,
  children,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const navigate = useNavigate();

  function handleBack() {
    if (!backTo) return;
    // If the user arrived via in-app navigation there will be history to go back
    // to. window.history.length > 1 is unreliable (includes browser tabs), so
    // we check TanStack Router's own history index instead.
    const canGoBack =
      typeof window !== "undefined" &&
      (router.history as unknown as { index?: number }).index != null
        ? (router.history as unknown as { index: number }).index > 0
        : window.history.length > 1;

    if (canGoBack) {
      router.history.back();
    } else {
      navigate({ to: backTo as never });
    }
  }

  return (
    <header className="relative overflow-hidden rounded-b-[24px] bg-brand-gradient px-4 pb-5 pt-4 text-white">
      <div className="hero-sheen pointer-events-none absolute inset-0" />
      <div className="relative">
        {backTo && (
          <button
            onClick={handleBack}
            className="mb-2 inline-flex items-center gap-1 text-sm text-white/80 transition hover:text-white active:opacity-70"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        <div className="flex items-center gap-3">
          <img
            src="/nse_crest.png"
            alt="NSE crest"
            className="h-10 w-10 shrink-0 rounded-full bg-white p-1 shadow-lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold leading-tight">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-white/70">{subtitle}</p>
            )}
          </div>
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </header>
  );
}
