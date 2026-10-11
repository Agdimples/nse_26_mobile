import { createFileRoute } from "@tanstack/react-router";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, HelpCircle } from "lucide-react";
import { faqsByCategory, searchFaqs, type FaqItem } from "@/lib/reference";

export const Route = createFileRoute("/_authenticated/faq")({
  component: FaqPage,
});

/** Renders **bold** spans in FAQ answers (the data uses markdown-style emphasis). */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
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
            <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function FaqPage() {
  const [query, setQuery] = useState("");
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

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Conference Guide"
        subtitle={`${searchFaqs("").length} answers to common questions`}
        backTo="/home"
      />

      <div className="px-4 pt-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the guide — wifi, badge, shuttle…"
          className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-xs outline-none shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mt-4 space-y-5">
        {grouped.map(([category, faqs]) => (
          <section key={category}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wide">
                {category}
              </Badge>
              <span className="text-xs text-muted-foreground">({faqs.length})</span>
            </div>
            <div className="space-y-2.5">
              {faqs.map((f) => (
                <Card key={f.id} className="border-0 bg-surface rounded-2xl p-4 shadow-card transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <h4 className="text-sm font-bold leading-snug">{f.question}</h4>
                  </div>
                  <div className="mt-2 pl-6">
                    <AnswerText text={f.answer} />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
        {grouped.length === 0 && (
          <Card className="border-0 p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              Nothing matches "{query}" — try "wifi", "badge", or "shuttle".
            </p>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}
