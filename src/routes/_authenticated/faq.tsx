import { createFileRoute } from "@tanstack/react-router";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  Wifi,
  Bus,
  BadgeCheck,
  UtensilsCrossed,
  Shield,
  Shirt,
  HelpCircle,
  Building2,
  X,
} from "lucide-react";
import { searchFaqs, type FaqItem } from "@/lib/reference";

export const Route = createFileRoute("/_authenticated/faq")({
  component: FaqPage,
});

// ── Category metadata ─────────────────────────────────────────────────────────
const CATEGORY_META: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  Registration: {
    icon: BadgeCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  Transport: {
    icon: Bus,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  "Wi-Fi & Tech": {
    icon: Wifi,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  Catering: {
    icon: UtensilsCrossed,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  Security: {
    icon: Shield,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  Dress: {
    icon: Shirt,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
  Venue: {
    icon: Building2,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
};

function categoryMeta(category: string) {
  return (
    CATEGORY_META[category] ?? {
      icon: HelpCircle,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20",
    }
  );
}

// ── Rich answer renderer (handles **bold** and `code`) ───────────────────────
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <p className="text-[15px] leading-relaxed text-muted-foreground">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ── Single accordion FAQ item ─────────────────────────────────────────────────
function FaqAccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface transition-shadow",
        isOpen ? "shadow-md border-primary/20" : "shadow-card border-border",
      )}
    >
      {/* Question row */}
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
            isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 text-[15px] font-semibold leading-snug text-foreground">
          {faq.question}
        </span>
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Answer panel */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="border-t border-border px-4 pb-4 pt-3">
          <AnswerText text={faq.answer} />
          {faq.keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {faq.keywords.slice(0, 5).map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function FaqPage() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const allFaqs = useMemo(() => searchFaqs(""), []);
  const results = useMemo(() => searchFaqs(query), [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const f of results) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return [...map.entries()];
  }, [results]);

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="pb-28">
      <NsePageHeader
        title="Conference Guide"
        subtitle={`${allFaqs.length} answers · tap any question`}
        backTo="/home"
      />

      <div className="px-4 pt-5 space-y-5">
        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — wifi, badge, shuttle, meals…"
            className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-10 text-[15px] shadow-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── Result count pill when searching ────────────────────────── */}
        {query.trim() && (
          <p className="text-sm text-muted-foreground">
            {results.length === 0
              ? "No results found"
              : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
          </p>
        )}

        {/* ── Category sections ────────────────────────────────────────── */}
        {grouped.map(([category, faqs]) => {
          const meta = categoryMeta(category);
          const Icon = meta.icon;
          return (
            <section key={category} className="space-y-2">
              {/* Category header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl border",
                    meta.bg,
                    meta.border,
                  )}
                >
                  <Icon className={cn("h-4 w-4", meta.color)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-bold text-foreground">{category}</h2>
                  <Badge
                    variant="secondary"
                    className="h-5 rounded-full px-2 text-[11px] font-semibold"
                  >
                    {faqs.length}
                  </Badge>
                </div>
              </div>

              {/* FAQ items */}
              <div className="space-y-2">
                {faqs.map((f) => (
                  <FaqAccordionItem
                    key={f.id}
                    faq={f}
                    isOpen={openId === f.id}
                    onToggle={() => toggle(f.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {grouped.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">Nothing found</p>
            <p className="text-[14px] text-muted-foreground">
              Try "wifi", "badge", "meals", or "shuttle".
            </p>
            <button
              onClick={() => setQuery("")}
              className="mt-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Clear search
            </button>
          </div>
        )}

        {/* ── Footer note ──────────────────────────────────────────────── */}
        {grouped.length > 0 && !query && (
          <p className="pb-2 text-center text-[13px] text-muted-foreground">
            Can't find what you need? Visit the{" "}
            <span className="font-semibold text-primary">Help Desk</span> at the ICC Main Lobby.
          </p>
        )}
      </div>
    </div>
  );
}
