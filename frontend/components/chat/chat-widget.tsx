"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useUser } from "@/components/dashboard/user-context";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface Msg {
  role: "assistant" | "user";
  content: string;
}

export function ChatWidget() {
  const { profile } = useUser();
  const firstName = profile.full_name?.split(" ")[0] || "there";

  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hi ${firstName}! 👋 I'm your AI assistant. I can help with plan details, billing questions, or subscription management. What can I help with?`,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setOpened(true);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newHistory: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post<{ reply: string }>("/chat", {
        message: text,
        conversation_history: messages,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="AI support chat"
          className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl animate-slide-up sm:max-h-[calc(100vh-8rem)]"
        >
          <header className="relative flex items-center justify-between gap-3 bg-sidebar-bg px-5 py-4 text-white">
            <div>
              <p className="font-display text-sm font-semibold">AI Support</p>
              <p className="flex items-center gap-1.5 text-xs text-sidebar-text">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Online
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-sidebar-text transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-5">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-white text-ink",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex max-w-[60%] items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce-dot rounded-full bg-ink-muted" />
                  <span className="h-2 w-2 animate-bounce-dot rounded-full bg-ink-muted [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce-dot rounded-full bg-ink-muted [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-3"
          >
            <input
              type="text"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about plans, billing…"
              className="flex-1 rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl transition-all duration-200 hover:bg-brand-hover hover:shadow-2xl",
          !opened && "before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-brand/40",
        )}
      >
        <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
          AI
        </span>
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
