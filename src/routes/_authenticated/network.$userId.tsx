import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { initials, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/network/$userId")({
  component: DMPage,
});

function DMPage() {
  const { userId: otherId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: other } = useQuery({
    queryKey: ["profile", otherId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", otherId).maybeSingle();
      return data;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["dms", user?.id, otherId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user!.id})`)
        .order("created_at");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`dm-${user.id}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const row = payload.new as { sender_id: string; recipient_id: string };
          const pair = [row.sender_id, row.recipient_id].sort().join("-");
          const me = [user.id, otherId].sort().join("-");
          if (pair === me) qc.invalidateQueries({ queryKey: ["dms", user.id, otherId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user) return;
    setInput("");
    await supabase.from("direct_messages").insert({
      sender_id: user.id,
      recipient_id: otherId,
      content: text,
    });
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col">
      <div className="rounded-b-[20px] bg-brand-gradient px-4 pb-3.5 pt-3 text-white shadow-sm">
        <button onClick={() => navigate({ to: "/network" })} className="mb-2 inline-flex items-center gap-1 text-sm text-white/80">
          <ArrowLeft className="h-4 w-4" /> Network
        </button>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-white/30">
            <AvatarImage src={other?.avatar_url ?? undefined} />
            <AvatarFallback>{initials(other?.display_name ?? "?")}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-base font-bold">{other?.display_name ?? "Attendee"}</h1>
            <p className="text-xs text-white/70">
              {[other?.title, other?.company].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No messages yet. Start the conversation 👋</p>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === user?.id;
          return (
            <div key={m.id} className={isMe ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[80%]">
                <div
                  className={
                    isMe
                      ? "rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                      : "rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-sm"
                  }
                >
                  {m.content}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{formatTime(m.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={send}
        className="border-t border-border bg-surface p-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <Button type="submit" size="icon" disabled={!input.trim()} className="h-10 w-10 rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
