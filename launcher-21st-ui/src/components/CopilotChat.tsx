import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
};

type CopilotChatProps = {
  items: LibraryItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectItem: (id: string) => void;
  mode?: "dialog" | "page";
};

const aiUiTimeoutMs = 26000;

function resizeTextarea(target: HTMLTextAreaElement) {
  target.style.height = "0px";
  target.style.height = `${Math.min(target.scrollHeight, 144)}px`;
}

function localPreviewResponse(items: LibraryItem[]) {
  const games = items.filter((item) => item.type === "Juego").length;
  const projects = items.filter((item) => item.type === "Proyecto").length;
  return `Estoy en modo preview porque esta ventana no tiene el puente nativo de Electron. En el .exe puedo usar una IA real con memoria si configuras OPENAI_API_KEY o NEXUS_OPENAI_API_KEY. Tu biblioteca cargada ahora tiene ${items.length} accesos, incluyendo ${games} juegos y ${projects} proyectos.`;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/([a-z])\1{2,}/g, "$1")
    .replace(/[^a-z0-9.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getOpenTarget(message: string, items: LibraryItem[]) {
  const normalized = normalizeText(message);
  const hasOpenVerb = /\b(abre|abrir|abreme|ejecuta|ejecutar|lanza|lanzar|inicia|iniciar|arranca|arrancar)\b/.test(normalized);
  if (!hasOpenVerb) return "";

  const runnableItems = items.filter((item) => item.type !== "Proyecto" || /\.(exe|lnk|bat|cmd)$/i.test(item.location));
  const namedItem = [...runnableItems]
    .sort((a, b) => normalizeText(b.name).length - normalizeText(a.name).length)
    .find((item) => {
      const name = normalizeText(item.name);
      const id = normalizeText(item.id);
      return (name.length > 2 && normalized.includes(name)) || (id.length > 2 && normalized.includes(id));
    });
  if (namedItem) return namedItem.name;

  const match = normalized.match(/\b(?:abre|abrir|abreme|ejecuta|ejecutar|lanza|lanzar|inicia|iniciar|arranca|arrancar)\s+(.+)$/);
  return (match?.[1] ?? "")
    .replace(/\b(ahora|si|porfa|porfavor|por favor|tu|dale|ya|mismo)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findLaunchItem(items: LibraryItem[], target: string) {
  const normalizedTarget = normalizeText(target);
  if (!normalizedTarget) return null;
  const runnableItems = items.filter((item) => item.type !== "Proyecto" || /\.(exe|lnk|bat|cmd)$/i.test(item.location));
  return (
    runnableItems.find((item) => normalizeText(item.name) === normalizedTarget) ??
    runnableItems.find((item) => normalizeText(item.id) === normalizedTarget) ??
    runnableItems.find((item) => normalizeText(item.name).includes(normalizedTarget)) ??
    runnableItems.find((item) => normalizedTarget.includes(normalizeText(item.name))) ??
    null
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timer));
  });
}

export function CopilotChat({ items, open = false, onOpenChange, onSelectItem, mode = "dialog" }: CopilotChatProps) {
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Estoy aqui. Hablame normal: puedo recordar cosas, entender tu launcher y ayudarte a pensar decisiones sin convertirlo todo en botones.",
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

  useEffect(() => {
    if (mode === "dialog" && !open) return;
    if (!window.nexus?.loadAiMemory) return;
    window.nexus.loadAiMemory().then((memory) => setMemoryCount(memory.facts.length)).catch(() => {});
  }, [mode, open]);

  async function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isThinking) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((current) => [
      ...current,
      userMessage,
    ]);
    setInput("");
    setIsThinking(true);

    try {
      const openTarget = getOpenTarget(text, items);
      if (openTarget) {
        const launchItem = findLaunchItem(items, openTarget);
        if (!window.nexus?.openPath) {
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: "Puedo detectar lo que quieres abrir, pero esta vista esta en modo navegador. Para lanzar programas reales abre el .exe de Nexus Launcher.",
            },
          ]);
          return;
        }
        if (!launchItem) {
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `No encontre "${openTarget}" en tu biblioteca. Agregalo al launcher o dime el nombre exacto del programa.`,
            },
          ]);
          return;
        }
        onSelectItem(launchItem.id);
        const result = await window.nexus.openPath(launchItem.realPath || launchItem.location, {
          itemId: launchItem.id,
          name: launchItem.name,
        });
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.ok
              ? `Listo, abri ${launchItem.name}.`
              : `Encontre ${launchItem.name}, pero no pude abrirlo: ${result.message ?? "la ruta no respondio"}.`,
          },
        ]);
        return;
      }

      const response = window.nexus?.chatWithAi
        ? await withTimeout(
            window.nexus.chatWithAi({ message: text, items }),
            aiUiTimeoutMs,
            "La IA tardo demasiado en responder. Corte la espera para que el chat no se quede pensando infinito.",
          )
        : { ok: false, content: localPreviewResponse(items) };
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.content,
        },
      ]);
      if (typeof response.remembered === "number") setMemoryCount(response.remembered);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `No pude conectar con la IA ahora mismo. ${message}`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  const heading = (
    <>
      <Badge className="mb-4 border-white/15 bg-white/10 text-white hover:bg-white/10">
        {stats.games} juegos / {stats.programs} programas / {stats.projects} proyectos / {memoryCount} recuerdos
      </Badge>
      {mode === "page" ? (
        <>
          <h2 className="text-4xl font-semibold tracking-normal text-white">
            Nexus Copilot
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-neutral-300">
            IA conversacional con contexto de tu biblioteca y memoria local. Puede hablar contigo
            como asistente personal; no ejecuta acciones sin confirmacion.
          </p>
        </>
      ) : (
        <>
          <DialogTitle className="text-4xl font-semibold tracking-normal text-white">
            Nexus Copilot
          </DialogTitle>
          <DialogDescription className="max-w-2xl text-sm leading-6 text-neutral-300">
            IA conversacional con contexto de tu biblioteca y memoria local. Puede hablar contigo
            como asistente personal; no ejecuta acciones sin confirmacion.
          </DialogDescription>
        </>
      )}
    </>
  );

  const chatSurface = (
    <div className={mode === "page" ? "relative flex h-full min-h-0 flex-col overflow-hidden bg-black" : "relative min-h-[720px] overflow-hidden bg-black"}>
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
          {mode === "page" ? (
            <div className="relative z-10 shrink-0 px-8 pt-[14vh] text-center">
              {heading}
              <div className="mx-auto mt-8 max-w-4xl">
                <CopilotMorphLine />
              </div>
            </div>
          ) : (
            <DialogHeader className="relative z-10 items-center px-8 pt-52 text-center">
              {heading}
            </DialogHeader>
          )}

          <div className={mode === "page" ? "relative z-10 mx-auto grid min-h-0 w-full max-w-5xl flex-1 grid-rows-[minmax(0,1fr)_auto] px-6 pb-6 pt-8" : "relative z-10 mx-auto grid w-full max-w-3xl grid-rows-[1fr_auto] px-5 pb-6 pt-10"}>
            <ScrollArea className={mode === "page" ? "h-full rounded-2xl border border-white/10 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md" : "h-[310px] rounded-2xl border border-white/10 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"}>
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

                  </motion.div>
                ))}
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mr-auto max-w-[90%] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-neutral-100"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                      <Sparkles className="size-3" />
                      Copilot
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                      <Loader2 className="size-4 animate-spin" />
                      Pensando...
                    </div>
                  </motion.div>
                )}
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
                    placeholder="Escribeme como si estuvieras hablando conmigo..."
                    className="min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-neutral-500"
                  />
                  <Button
                    type="submit"
                    disabled={isThinking}
                    className="size-12 rounded-full bg-white p-0 text-black hover:bg-neutral-200"
                  >
                    {isThinking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    <span className="sr-only">Enviar</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
  );

  if (mode === "page") return chatSurface;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden border-white/10 bg-black p-0 text-white shadow-[0_28px_120px_rgba(0,0,0,0.65)]">
        {chatSurface}
      </DialogContent>
    </Dialog>
  );
}

function CopilotMorphLine() {
  const words = ["Think", "Launch", "Remember", "Organize"];
  const [activeWord, setActiveWord] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveWord((current) => (current + 1) % words.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [words.length]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.075] px-8 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.22),transparent_42%)]" />
      <svg className="absolute size-0">
        <filter id="copilot-goo">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="7" />
          <feColorMatrix
            in="blur"
            result="goo"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>
      <div className="relative flex flex-col items-center justify-center gap-2 text-neutral-300 sm:flex-row sm:gap-4">
        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
          <Sparkles className="size-4 text-white" />
          <span>Nexus Copilot can</span>
        </div>
        <span className="relative inline-grid h-14 min-w-60 place-items-center text-4xl font-semibold tracking-normal text-white" style={{ filter: "url(#copilot-goo)" }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={words[activeWord]}
              initial={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -18, scale: 0.96, filter: "blur(12px)" }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
            >
              {words[activeWord]}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </div>
  );
}
