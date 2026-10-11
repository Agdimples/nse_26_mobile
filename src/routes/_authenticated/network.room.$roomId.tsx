import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Hash } from "lucide-react";
import { initials, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/network/room/$roomId")({
  component: RoomChatPage,
});

function RoomChatPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: room } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const { data } = await supabase.from("chat_rooms").select("*").eq("id", roomId).maybeSingle();
      return data;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["room-messages", roomId],
    queryFn: async () => {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at");
      if (!msgs || msgs.length === 0) return [];
      const userIds = [...new Set(msgs.map((m) => m.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      return msgs.map((m) => ({ ...m, profile: byId.get(m.user_id) ?? null }));
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["room-messages", roomId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user) return;
    setInput("");
    await supabase.from("chat_messages").insert({ room_id: roomId, user_id: user.id, content: text });
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col">
      <div className="rounded-b-[20px] bg-brand-gradient px-4 pb-3.5 pt-3 text-white shadow-sm">
        <button onClick={() => navigate({ to: "/network" })} className="mb-2 inline-flex items-center gap-1 text-sm text-white/80">
          <ArrowLeft className="h-4 w-4" /> Network
        </button>
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          <h1 className="text-base font-bold">{room?.name ?? "Chat"}</h1>
        </div>
        {room?.description && <p className="text-xs text-white/70">{room.description}</p>}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No messages yet. Say hi! 👋</p>
        )}
        {messages.map((m) => {
          const isMe = m.user_id === user?.id;
          const profile = m.profile;
          return (
            <div key={m.id} className={isMe ? "flex justify-end" : "flex gap-2"}>
              {!isMe && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {initials(profile?.display_name ?? "?")}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={isMe ? "max-w-[80%]" : "max-w-[80%]"}>
                {!isMe && (
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    {profile?.display_name ?? "Attendee"} · {formatTime(m.created_at)}
                  </p>
                )}
                <div
                  className={
                    isMe
                      ? "rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                      : "rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-sm"
                  }
                >
                  {m.content}
                </div>
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
            placeholder={`Message #${room?.name ?? "room"}`}
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
