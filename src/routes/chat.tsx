import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  API,
  TENANT_ID,
  authHeaders,
  getToken,
  PageShell,
  Card,
} from "@/components/minddesk";

import chatIllus from "@/assets/illus-chat.png";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

type Msg = {
  id: number;
  type: "ai" | "user";
  text: string;
};

function ChatPage() {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 1,
      type: "ai",
      text: "Olá! Sou o assistente virtual da MindDesk. Como posso ajudar com dúvidas de RH hoje?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Msg = {
      id: Date.now(),
      type: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);

    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API}/chat/perguntar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          query: userMsg.text,
          tenant_id: TENANT_ID,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text:
            data.answer ||
            "Não foi possível gerar uma resposta.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text:
            "Desculpe, ocorreu um erro. Tente novamente.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    if (window.confirm("Iniciar uma nova conversa?")) {
      setMessages([
        {
          id: Date.now(),
          type: "ai",
          text: "Olá! Sou o assistente virtual da MindDesk. Como posso ajudar com dúvidas de RH hoje?",
        },
      ]);
    }
  };

  return (
    <PageShell>
      <div className="min-h-screen grid place-items-center p-4 md:p-6">
        <Card className="w-full max-w-[920px] h-[calc(100vh-3rem)] max-h-[760px] flex flex-col overflow-hidden border border-border/50 bg-card backdrop-blur-sm shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-5 min-h-[72px] bg-primary text-primary-foreground border-b border-border/40">
            <button
              onClick={() => navigate({ to: "/manager" })}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/15 border border-white/20 hover:bg-white/25 transition-colors"
            >
              ← Voltar
            </button>

            <div className="flex items-center gap-2.5 font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-accent md-dot" />
              MindDesk Assistant
            </div>

            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/15 border border-white/20 hover:bg-white/25 transition-colors"
            >
              + Nova conversa
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-background">

            {messages.length === 1 && (
              <div className="flex justify-center mb-2">
                <img
                  src={chatIllus}
                  alt=""
                  width={160}
                  height={160}
                  loading="lazy"
                  className="w-40 h-auto opacity-90"
                />
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-2 w-full ${
                  m.type === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {m.type === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold flex-shrink-0 shadow-md">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-colors ${
                    m.type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card text-card-foreground rounded-bl-sm border border-border/60"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold shadow-md">
                  AI
                </div>

                <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full md-dot" />
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full md-dot"
                    style={{ animationDelay: ".2s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full md-dot"
                    style={{ animationDelay: ".4s" }}
                  />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 p-4 border-t border-border bg-card"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo sobre RH..."
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 border-[1.5px] border-border bg-background text-foreground rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />

            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
            >
              Enviar
            </button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}