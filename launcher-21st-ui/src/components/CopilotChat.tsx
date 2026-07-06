import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, MessageCircle, Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { AppIcon } from "@/components/AppIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LibraryItem } from "@/lib/library";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: LibraryItem[];
};

type CopilotChatProps = {
  items: LibraryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (id: string) => void;
};

const prompts = [
  "quiero programar",
  "modo gaming",
  "buscar rutas rotas",
  "mis proyectos recientes",
];

function scoreItem(item: LibraryItem, words: string[]) {
  const haystack = `${item.name} ${item.type} ${item.vendor} ${item.description} ${item.location}`.toLowerCase();
  return words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
}

function findByIntent(items: LibraryItem[], input: string) {
  const text = input.toLowerCase();

  if (text.includes("program") || text.includes("codigo") || text.includes("code")) {
    return items
      .filter((item) =>
        item.type === "Proyecto" ||
        scoreItem(item, ["code", "visual studio", "terminal", "powershell", "node", "react"]) > 0,
      )
      .slice(0, 6);
  }

  if (text.includes("gaming") || text.includes("jugar") || text.includes("juego")) {
    return items.filter((item) => item.type === "Juego").slice(0, 6);
  }

  if (text.includes("grabar") || text.includes("stream") || text.includes("obs")) {
    return items
      .filter((item) => scoreItem(item, ["obs", "studio", "record", "capture", "video"]) > 0)
      .slice(0, 5);
  }

  if (text.includes("proyecto") || text.includes("carpeta")) {
    return items.filter((item) => item.type === "Proyecto").slice(0, 6);
  }

  const words = text.split(/\s+/).filter((word) => word.length > 2);
  return items
    .map((item) => ({ item, score: scoreItem(item, words) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
    .slice(0, 6);
}

function buildAnswer(items: LibraryItem[], input: string) {
  const text = input.toLowerCase();
  const plan = findByIntent(items, input);
  const broken = items.filter((item) => item.status !== "Listo").length;
  const games = items.filter((item) => item.type === "Juego").length;
  const projects = items.filter((item) => item.type === "Proyecto").length;

  if (text.includes("rota") || text.includes("validar") || text.includes("mantenimiento")) {
    return {
      content: `Detecte ${broken} accesos marcados como pendientes o sin revisar. Puedo ayudarte a revisarlos por categoria antes de ejecutar cambios.`,
      plan: items.filter((item) => item.status !== "Listo").slice(0, 6),
    };
  }

  if (plan.length) {
    return {
      content: `Te prepare un plan con ${plan.length} accesos. No voy a abrir nada automaticamente; puedes enfocar cada elemento y luego decides si lo ejecutas.`,
      plan,
    };
  }

  return {
    content: `Tengo indexados ${items.length} accesos: ${games} juegos y ${projects} proyectos. Prueba con "quiero programar", "modo gaming" o el nombre de una app.`,
    plan: [],
  };
}

function resizeTextarea(target: HTMLTextAreaElement) {
  target.style.height = "0px";
  target.style.height = `${Math.min(target.scrollHeight, 144)}px`;
}

export function CopilotChat({ items, open, onOpenChange, onSelectItem }: CopilotChatProps) {
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Soy Nexus Copilot. Puedo buscar por intencion, preparar modos de actividad, revisar rutas y organizar tu biblioteca sin ejecutar nada sin permiso.",
    },
  ]);

  const stats = useMemo(() => {
    return {
      games: items.filter((item) => item.type === "Juego").length,
      projects: items.filter((item) => item.type === "Proyecto").length,
      programs: items.filter((item) => item.type === "Programa").length,
    };
  }, [items]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text) return;
    const answer = buildAnswer(items, text);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: crypto.randomUUID(), role: "assistant", content: answer.content, plan: answer.plan },
    ]);
    setInput("");
  }

  function runPrompt(prompt: string) {
    setInput(prompt);
    window.setTimeout(() => {
      const answer = buildAnswer(items, prompt);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "user", content: prompt },
        { id: crypto.randomUUID(), role: "assistant", content: answer.content, plan: answer.plan },
      ]);
      setInput("");
    }, 80);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden border-white/10 bg-black p-0 text-white shadow-[0_28px_120px_rgba(0,0,0,0.65)]">
        <div className="relative min-h-[720px] overflow-hidden bg-black">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_18%_70%,rgba(255,255,255,0.05),transparent_22%),linear-gradient(180deg,#050505_0%,#0c0c0d_48%,#030303_100%)]" />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-9 size-40 -translate-x-1/2 rounded-full border border-white/25 bg-white/75 shadow-[0_0_90px_rgba(255,255,255,0.42)]"
            animate={{ opacity: [0.72, 0.95, 0.72], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="pointer-events-none absolute left-1/2 top-9 size-40 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_34%_32%,#fff_0%,#f4f4f4_18%,#b7b7b7_55%,#6f6f6f_100%)] opacity-90" />
          <div className="pointer-events-none absolute left-[15%] top-[20%] size-1 rounded-full bg-white/70" />
          <div className="pointer-events-none absolute left-[80%] top-[24%] size-1 rounded-full bg-white/60" />
          <div className="pointer-events-none absolute left-[28%] top-[11%] size-0.5 rounded-full bg-white/80" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:82px_82px] opacity-20" />

          <DialogHeader className="relative z-10 items-center px-8 pt-52 text-center">
            <Badge className="mb-4 border-white/15 bg-white/10 text-white hover:bg-white/10">
              {stats.games} juegos / {stats.programs} programas / {stats.projects} proyectos
            </Badge>
            <DialogTitle className="text-4xl font-semibold tracking-normal text-white">
              Nexus Copilot
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-sm leading-6 text-neutral-300">
              Pregunta por una actividad y el launcher prepara una seleccion real de tus juegos,
              programas y proyectos. Nada se ejecuta sin que tu lo confirmes.
            </DialogDescription>
          </DialogHeader>

          <div className="relative z-10 mx-auto grid w-full max-w-3xl grid-rows-[1fr_auto] px-5 pb-6 pt-10">
            <ScrollArea className="h-[310px] rounded-2xl border border-white/10 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22 }}
                    className={message.role === "user" ? "ml-auto max-w-[78%]" : "mr-auto max-w-[90%]"}
                  >
                    <div
                      className={
                        message.role === "user"
                          ? "rounded-2xl border border-white/15 bg-white px-4 py-3 text-black shadow-[0_14px_40px_rgba(255,255,255,0.08)]"
                          : "rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-neutral-100"
                      }
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                        {message.role === "user" ? (
                          <MessageCircle className="size-3" />
                        ) : (
                          <Sparkles className="size-3" />
                        )}
                        {message.role === "user" ? "Tu" : "Copilot"}
                      </div>
                      <p className="text-sm leading-6">{message.content}</p>
                    </div>

                    {message.plan && message.plan.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {message.plan.map((item) => (
                          <motion.button
                            key={item.id}
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onSelectItem(item.id);
                              onOpenChange(false);
                            }}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left text-white transition-colors hover:border-white/30 hover:bg-white/[0.1]"
                          >
                            <AppIcon item={item} className="size-10" iconClassName="size-5" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold">{item.name}</div>
                              <div className="truncate text-xs text-neutral-400">
                                {item.type} / {item.vendor}
                              </div>
                            </div>
                            <CheckCircle2 className="size-4 text-neutral-400" />
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={endOfMessagesRef} />
              </div>
            </ScrollArea>

            <div className="mt-5">
              <form
                onSubmit={submitMessage}
                className="rounded-3xl border border-white/10 bg-white/[0.07] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
              >
                <div className="flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onInput={(event) => resizeTextarea(event.currentTarget)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        submitMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Pidele algo: modo gaming, quiero programar, busca Steam..."
                    className="min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-neutral-500"
                  />
                  <Button type="submit" className="size-12 rounded-full bg-white p-0 text-black hover:bg-neutral-200">
                    <Send className="size-4" />
                    <span className="sr-only">Enviar</span>
                  </Button>
                </div>
              </form>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => runPrompt(prompt)}
                    className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
