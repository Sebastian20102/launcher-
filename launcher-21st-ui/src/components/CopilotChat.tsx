import { useMemo, useState, type FormEvent } from "react";
import { Bot, CheckCircle2, MessageCircle, Send, Sparkles } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

export function CopilotChat({ items, open, onOpenChange, onSelectItem }: CopilotChatProps) {
  const [input, setInput] = useState("");
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
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md border border-border bg-secondary">
                <Bot className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Nexus Copilot</DialogTitle>
                <DialogDescription>
                  Chatbot local para planes, busqueda inteligente y mantenimiento.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary">
              {stats.games} juegos / {stats.programs} programas / {stats.projects} proyectos
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid min-h-[560px] grid-rows-[1fr_auto] bg-background">
          <ScrollArea className="h-[560px]">
            <div className="space-y-4 p-5">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={message.role === "user" ? "ml-auto max-w-[78%]" : "mr-auto max-w-[88%]"}
                >
                  <div className={message.role === "user" ? "rounded-lg bg-primary px-4 py-3 text-primary-foreground" : "rounded-lg border border-border bg-card px-4 py-3"}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
                      {message.role === "user" ? <MessageCircle className="size-3" /> : <Sparkles className="size-3" />}
                      {message.role === "user" ? "Tu" : "Copilot"}
                    </div>
                    <p className="text-sm leading-6">{message.content}</p>
                  </div>

                  {message.plan && message.plan.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {message.plan.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectItem(item.id);
                            onOpenChange(false);
                          }}
                          className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-left transition-colors hover:border-primary"
                        >
                          <AppIcon item={item} className="size-10" iconClassName="size-5" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{item.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {item.type} / {item.vendor}
                            </div>
                          </div>
                          <CheckCircle2 className="size-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <Button key={prompt} variant="secondary" size="sm" onClick={() => runPrompt(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
            <Separator className="mb-3" />
            <form onSubmit={submitMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pidele algo: modo gaming, quiero programar, busca Steam..."
              />
              <Button type="submit">
                <Send className="mr-2 size-4" />
                Enviar
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
