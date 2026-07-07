import { useEffect, useMemo, useRef, useState, type ComponentType, type UIEvent } from "react";
import {
  Activity,
  AppWindow,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  CommandIcon,
  Cpu,
  Download,
  FileText,
  Folder,
  HardDrive,
  ImageIcon,
  Layers3,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Newspaper,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Rss,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createItemFromPath,
  getIcon,
  seedLibrary,
  type LibraryItem,
} from "@/lib/library";
import {
  FocusDepthCard,
  OdysseyStatus,
  type ActionStatus,
} from "@/components/OdysseyFocus";
import { AppIcon } from "@/components/AppIcon";
import { CopilotChat } from "@/components/CopilotChat";
import { isDesktop, loadNativeLibrary, saveNativeLibrary } from "@/lib/native";
import { cn } from "@/lib/utils";
import type { NexusNote, SystemSnapshot } from "@/types/electron";

const filters = ["Todo", "Juego", "Programa", "Proyecto", "Sistema", "Archivo"];
const launcherBackgroundStorageKey = "nexus-launcher-background-preview";
const notesStorageKey = "nexus-launcher-notes-preview";
const appleEase = [0.22, 1, 0.36, 1] as const;
const appleSpring = {
  type: "spring",
  stiffness: 360,
  damping: 38,
  mass: 0.82,
} as const;
type NexusIcon = ComponentType<{ className?: string }>;

type LauncherBackground = {
  url: string;
  mediaType: "image" | "video" | null;
  name: string;
  opacity: number;
  blur: number;
  dim: number;
  fit: "cover" | "contain";
};

type Screen = "library" | "copilot" | "notes" | "system" | "news";

const defaultLauncherBackground: LauncherBackground = {
  url: "",
  mediaType: null,
  name: "Fondo Nexus",
  opacity: 0.48,
  blur: 0,
  dim: 0.42,
  fit: "cover",
};

const backgroundPresets: LauncherBackground[] = [
  defaultLauncherBackground,
  {
    url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=2400&q=85",
    mediaType: "image",
    name: "Orbita gris",
    opacity: 0.46,
    blur: 0,
    dim: 0.48,
    fit: "cover",
  },
  {
    url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2400&q=85",
    mediaType: "image",
    name: "Ciudad nocturna",
    opacity: 0.62,
    blur: 0,
    dim: 0.36,
    fit: "cover",
  },
  {
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=85",
    mediaType: "image",
    name: "Mapa orbital",
    opacity: 0.58,
    blur: 0,
    dim: 0.38,
    fit: "cover",
  },
];

function App() {
  const [items, setItems] = useState<LibraryItem[]>(seedLibrary);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todo");
  const [selectedId, setSelectedId] = useState(seedLibrary[0].id);
  const [commandOpen, setCommandOpen] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [notice, setNotice] = useState("Listo para lanzar");
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [screen, setScreen] = useState<Screen>("library");
  const [launcherBackground, setLauncherBackground] = useState<LauncherBackground>(defaultLauncherBackground);
  const [notes, setNotes] = useState<NexusNote[]>([]);
  const [systemSnapshot, setSystemSnapshot] = useState<SystemSnapshot | null>(null);

  useEffect(() => {
    loadNativeLibrary(seedLibrary)
      .then((loadedItems) => {
        setItems(loadedItems);
        setSelectedId(loadedItems[0]?.id ?? seedLibrary[0].id);
      })
      .catch(() => setNotice("No pude cargar la biblioteca local"));
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(launcherBackgroundStorageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as LauncherBackground;
      setLauncherBackground({ ...defaultLauncherBackground, ...parsed });
    } catch {
      window.localStorage.removeItem(launcherBackgroundStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(launcherBackgroundStorageKey, JSON.stringify(launcherBackground));
  }, [launcherBackground]);

  useEffect(() => {
    if (window.nexus?.loadNotes) {
      window.nexus.loadNotes().then(setNotes).catch(() => setNotice("No pude cargar las notas"));
      return;
    }
    try {
      const stored = window.localStorage.getItem(notesStorageKey);
      setNotes(stored ? JSON.parse(stored) : []);
    } catch {
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    if (window.nexus?.getSystemSnapshot) {
      window.nexus.getSystemSnapshot().then(setSystemSnapshot).catch(() => setNotice("No pude analizar la PC"));
      return;
    }
    setSystemSnapshot({
      hostname: "Preview",
      platform: navigator.platform || "browser",
      release: "Navegador",
      arch: "No disponible",
      uptimeSeconds: 0,
      cpuModel: "Disponible en escritorio",
      cpuCores: navigator.hardwareConcurrency || 0,
      totalMemory: 0,
      freeMemory: 0,
      usedMemory: 0,
      rootDisk: null,
      homeDir: "Disponible en escritorio",
      appDataDir: "Disponible en escritorio",
      capturedAt: new Date().toISOString(),
    });
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesFilter = filter === "Todo" || item.type === filter;
      const matchesQuery = `${item.name} ${item.vendor} ${item.type}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, items, query]);

  const selected =
    items.find((item) => item.id === selectedId) ?? filteredItems[0] ?? items[0];

  async function updateItems(nextItems: LibraryItem[], message: string) {
    setItems(nextItems);
    await saveNativeLibrary(nextItems);
    setNotice(message);
  }

  function finishStatus(status: ActionStatus, message: string) {
    setActionStatus(status);
    setNotice(message);
    window.setTimeout(() => setActionStatus("idle"), 1800);
  }

  async function addFromPicker(kind: "Programa" | "Proyecto" | "Archivo") {
    if (!window.nexus) {
      setNotice("La seleccion nativa funciona al abrir con npm run desktop");
      return;
    }
    const targetPath =
      kind === "Proyecto"
        ? await window.nexus.pickFolder()
        : kind === "Archivo"
          ? await window.nexus.pickAnyFile()
        : await window.nexus.pickExecutable();
    if (!targetPath) return;
    setActionStatus("importing");
    const nextItem = createItemFromPath(targetPath, kind);
    const nextItems = [nextItem, ...items];
    await updateItems(nextItems, `${nextItem.name} agregado`);
    finishStatus("success", `${nextItem.name} agregado`);
    setSelectedId(nextItem.id);
  }

  async function openSelected() {
    if (!selected) return;
    if (!window.nexus) {
      finishStatus("error", "Para abrir rutas reales usa npm run desktop");
      return;
    }
    setActionStatus("opening");
    setNotice(`Abriendo ${selected.name}...`);
    const result = await window.nexus.openPath(selected.location);
    finishStatus(result.ok ? "success" : "error", result.ok ? `${selected.name} abierto` : result.message ?? "No se pudo abrir");
  }

  async function revealSelected() {
    if (!selected) return;
    if (!window.nexus) {
      setNotice("Para revelar carpetas reales usa npm run desktop");
      return;
    }
    const result = await window.nexus.revealPath(selected.location);
    setNotice(result.ok ? "Ubicacion abierta" : result.message ?? "No se pudo revelar");
  }

  async function validateSelected() {
    if (!selected || !window.nexus) {
      finishStatus("error", "Validacion nativa disponible en escritorio");
      return;
    }
    setActionStatus("validating");
    setNotice(`Validando ${selected.name}...`);
    const exists = await window.nexus.validatePath(selected.location);
    const status: LibraryItem["status"] = exists ? "Listo" : "Sin revisar";
    const nextItems = items.map((item) =>
      item.id === selected.id
        ? { ...item, status }
        : item,
    );
    await updateItems(nextItems, exists ? "Ruta validada" : "Ruta no encontrada");
    finishStatus(exists ? "success" : "error", exists ? "Ruta validada" : "Ruta no encontrada");
  }

  async function toggleFavorite(itemId: string) {
    const nextItems = items.map((item) =>
      item.id === itemId ? { ...item, favorite: !item.favorite } : item,
    );
    await updateItems(nextItems, "Favoritos actualizados");
  }

  async function persistNotes(nextNotes: NexusNote[], message = "Notas actualizadas") {
    const sortedNotes = [...nextNotes].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.updatedAt.localeCompare(a.updatedAt));
    setNotes(sortedNotes);
    if (window.nexus?.saveNotes) {
      await window.nexus.saveNotes(sortedNotes);
    } else {
      window.localStorage.setItem(notesStorageKey, JSON.stringify(sortedNotes));
    }
    setNotice(message);
  }

  async function createNote(linkedItemId = selected?.id ?? "") {
    const now = new Date().toISOString();
    const nextNote: NexusNote = {
      id: crypto.randomUUID(),
      title: linkedItemId && selected ? `Nota sobre ${selected.name}` : "Nueva nota",
      body: "",
      linkedItemId,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    await persistNotes([nextNote, ...notes], "Nota creada");
    setScreen("notes");
  }

  async function updateNote(noteId: string, patch: Partial<NexusNote>) {
    const now = new Date().toISOString();
    await persistNotes(notes.map((note) => note.id === noteId ? { ...note, ...patch, updatedAt: now } : note), "Nota guardada");
  }

  async function deleteNote(noteId: string) {
    await persistNotes(notes.filter((note) => note.id !== noteId), "Nota eliminada");
  }

  async function refreshSystemSnapshot() {
    if (!window.nexus?.getSystemSnapshot) {
      setNotice("Analisis completo disponible en la app de escritorio");
      return;
    }
    const snapshot = await window.nexus.getSystemSnapshot();
    setSystemSnapshot(snapshot);
    setNotice("Analisis de PC actualizado");
  }

  if (screen === "notes") {
    return (
      <TooltipProvider>
        <motion.main
          className="relative h-screen overflow-hidden bg-black text-foreground"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, ease: appleEase }}
        >
          <CopilotLauncherBackdrop background={launcherBackground} />
          <PageHeader
            eyebrow="Nexus workspace"
            title="Notas"
            icon={FileText}
            onBack={() => setScreen("library")}
          />
          <NotesWorkspace
            items={items}
            notes={notes}
            onCreate={() => createNote()}
            onCreateLinked={() => createNote(selected?.id ?? "")}
            onUpdate={updateNote}
            onDelete={deleteNote}
          />
        </motion.main>
      </TooltipProvider>
    );
  }

  if (screen === "system") {
    return (
      <TooltipProvider>
        <motion.main
          className="relative h-screen overflow-hidden bg-black text-foreground"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, ease: appleEase }}
        >
          <CopilotLauncherBackdrop background={launcherBackground} />
          <PageHeader
            eyebrow="Nexus diagnostics"
            title="Analisis de PC"
            icon={Cpu}
            onBack={() => setScreen("library")}
          />
          <SystemAnalysis snapshot={systemSnapshot} onRefresh={refreshSystemSnapshot} />
        </motion.main>
      </TooltipProvider>
    );
  }

  if (screen === "news") {
    return (
      <TooltipProvider>
        <motion.main
          className="relative h-screen overflow-hidden bg-black text-foreground"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, ease: appleEase }}
        >
          <CopilotLauncherBackdrop background={launcherBackground} />
          <PageHeader
            eyebrow="Nexus signals"
            title="Intereses y noticias"
            icon={Newspaper}
            onBack={() => setScreen("library")}
          />
          <NewsInterestPreview items={items} />
        </motion.main>
      </TooltipProvider>
    );
  }

  if (screen === "copilot") {
    return (
      <TooltipProvider>
        <motion.main
          className="relative h-screen overflow-hidden bg-background text-foreground"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, ease: appleEase }}
        >
          <header className={cn("relative z-10 flex h-[72px] items-center justify-between border-b border-border bg-card/75 px-6 backdrop-blur", isDesktop() && "app-drag")}>
            <div className="flex items-center gap-4">
              <div className="grid size-11 place-items-center rounded-md border border-border bg-secondary">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Nexus launcher
                </p>
                <h1 className="text-xl font-semibold tracking-normal">
                  Nexus Copilot
                </h1>
              </div>
            </div>
            <div className={cn("flex items-center gap-2", isDesktop() && "app-no-drag")}>
              <Button variant="secondary" onClick={() => setScreen("library")}>
                <ArrowLeft className="mr-2 size-4" />
                Biblioteca
              </Button>
              <WindowControls />
            </div>
          </header>
          <section className="relative z-10 h-[calc(100vh-72px)] min-h-0">
            <CopilotChat
              items={items}
              mode="page"
              onSelectItem={setSelectedId}
            />
          </section>
        </motion.main>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <motion.main
        className="relative h-screen overflow-hidden bg-black text-foreground"
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.32, ease: appleEase }}
      >
        <CopilotLauncherBackdrop background={launcherBackground} />
        <div className="nexus-fluid-resize relative z-10 grid h-screen grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <header className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.055] px-4 py-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl md:px-6", isDesktop() && "app-drag")}>
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.075] shadow-[0_16px_48px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] md:size-11">
                <Layers3 className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Nexus launcher
                </p>
                <h1 className="truncate text-lg font-semibold tracking-normal md:text-xl">
                  Biblioteca local
                </h1>
              </div>
            </div>

            <div className={cn("order-3 flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.065] px-4 py-2.5 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl lg:order-none lg:w-[420px]", isDesktop() && "app-no-drag")}>
              <Search className="size-4" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Buscar juegos, programas o proyectos"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd className="rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[11px]">
                /
              </kbd>
            </div>

            <div className={cn("flex max-w-full items-center gap-2 overflow-x-auto", isDesktop() && "app-no-drag")}>
              <Button variant="secondary" className="shrink-0" onClick={() => setScreen("notes")}>
                <FileText className="mr-2 size-4" />
                Notas
              </Button>
              <Button variant="secondary" className="shrink-0" onClick={() => setScreen("system")}>
                <Cpu className="mr-2 size-4" />
                PC
              </Button>
              <Button variant="secondary" className="shrink-0" onClick={() => setScreen("news")}>
                <Newspaper className="mr-2 size-4" />
                Noticias
              </Button>
              <Button variant="secondary" className="shrink-0 sm:hidden" onClick={() => setScreen("copilot")}>
                <Sparkles className="mr-2 size-4" />
                Copilot
              </Button>
              <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="icon">
                    <CommandIcon className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Paleta de comandos</DialogTitle>
                    <DialogDescription>
                      Busca y abre juegos, programas, proyectos o acciones del launcher.
                    </DialogDescription>
                  </DialogHeader>
                  <Command>
                    <CommandInput placeholder="Ejecutar accion o abrir acceso..." />
                    <CommandList>
                      <CommandEmpty>No encontre ese acceso.</CommandEmpty>
                      <CommandGroup heading="Accesos">
                        {items.map((item) => {
                          const Icon = getIcon(item.icon);
                          return (
                            <CommandItem
                              key={item.id}
                              onSelect={() => {
                                setSelectedId(item.id);
                                setCommandOpen(false);
                              }}
                            >
                              <Icon className="mr-2 size-4" />
                              {item.name}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </DialogContent>
              </Dialog>
              <Button variant="secondary" className="shrink-0" onClick={() => setCustomizationOpen(true)}>
                <Palette className="mr-2 size-4" />
                Personalizar
              </Button>
              <Button variant="secondary" size="icon">
                <Bell className="size-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <Settings className="size-4" />
              </Button>
              <WindowControls />
            </div>
          </header>
          <CustomizationDialog
            background={launcherBackground}
            open={customizationOpen}
            onOpenChange={setCustomizationOpen}
            onChange={setLauncherBackground}
          />

          <section className="grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-h-0 min-w-0 border-r border-white/10 bg-black/10">
              <Tabs value={filter} onValueChange={setFilter} className="flex h-full min-h-0 flex-col">
                <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-3 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between xl:px-6 xl:py-4">
                  <div className="min-w-0 overflow-x-auto">
                  <TabsList className="w-max">
                    {filters.map((entry) => (
                      <TabsTrigger key={entry} value={entry}>
                        {entry}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 overflow-x-auto xl:justify-end">
                    <Button variant="secondary" className="shrink-0" onClick={() => addFromPicker("Proyecto")}>
                      <Folder className="mr-2 size-4" />
                      Carpeta
                    </Button>
                    <Button className="shrink-0" onClick={() => addFromPicker("Programa")}>
                      <Plus className="mr-2 size-4" />
                      Programa
                    </Button>
                    <Button variant="secondary" className="shrink-0" onClick={() => addFromPicker("Archivo")}>
                      <FileText className="mr-2 size-4" />
                      Archivo
                    </Button>
                  </div>
                </div>

                {selected && (
                  <CompactLaunchPanel
                    item={selected}
                    status={actionStatus}
                    notice={notice}
                    onOpen={openSelected}
                    onReveal={revealSelected}
                    onValidate={validateSelected}
                  />
                )}

                <TabsContent
                  key={filter}
                  value={filter}
                  className="m-0 min-h-0 flex-1 overflow-hidden"
                >
                  {filteredItems.length ? (
                    <VirtualizedLibraryGrid
                      items={filteredItems}
                      selectedId={selected?.id ?? ""}
                      onSelect={setSelectedId}
                      onFavorite={toggleFavorite}
                    />
                  ) : (
                    <div className="h-full overflow-hidden p-4 md:p-5">
                      <EmptyLibraryState
                        hasQuery={Boolean(query.trim()) || filter !== "Todo"}
                        onAddProgram={() => addFromPicker("Programa")}
                        onAddFolder={() => addFromPicker("Proyecto")}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <aside className="hidden min-h-0 border-l border-white/10 bg-white/[0.045] backdrop-blur-2xl lg:block">
              <ScrollArea className="h-full">
                <AnimatePresence mode="wait" initial={false}>
                {selected && (
                  <motion.div
                    key={selected.id}
                    className="p-6"
                    initial={{ opacity: 0, x: 18, scale: 0.99 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 12, scale: 0.99 }}
                    transition={{ duration: 0.38, ease: appleEase }}
                  >
                    <motion.div
                      key={selected.id}
                      layout
                      transition={appleSpring}
                    >
                      <div className="space-y-4">
                        <FocusDepthCard item={selected} status={actionStatus} />

                        <div className="grid grid-cols-2 gap-3">
                          <Button className="col-span-2 h-12" onClick={openSelected} disabled={actionStatus === "opening"}>
                            <Play className="mr-2 size-4" />
                            {actionStatus === "opening" ? "Abriendo..." : "Abrir ahora"}
                          </Button>
                          <Button variant="secondary" onClick={revealSelected}>
                            <Folder className="mr-2 size-4" />
                            Carpeta
                          </Button>
                          <Button variant="secondary" onClick={validateSelected} disabled={actionStatus === "validating"}>
                            <Download className="mr-2 size-4" />
                            {actionStatus === "validating" ? "Validando" : "Validar"}
                          </Button>
                          <Button variant="secondary" className="col-span-2" onClick={() => createNote(selected.id)}>
                            <FileText className="mr-2 size-4" />
                            Crear nota sobre este acceso
                          </Button>
                        </div>

                        <OdysseyStatus status={actionStatus} message={notice} />
                      </div>

                      <div className="mb-4 mt-6 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Detalles
                          </p>
                          <h2 className="mt-1 text-lg font-semibold tracking-normal">
                            {selected.name}
                          </h2>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleFavorite(selected.id)}>
                              {selected.favorite ? "Quitar favorito" : "Marcar favorito"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={validateSelected}>
                              Validar ruta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={revealSelected}>
                              Abrir ubicacion
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="mb-4 text-sm leading-6 text-muted-foreground">
                        {selected.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <Metric label="Estado" value={selected.status} />
                        <Metric label="Tamano" value={selected.size || "No disponible"} />
                        <Metric label="Version" value={selected.version || "No disponible"} />
                        <Metric label="Origen" value={selected.vendor} />
                        <Metric label="Uso" value="Sin seguimiento real" />
                        <Metric label="Fuente" value={selected.source || "Local"} />
                        <Metric label="Modificado" value={selected.fileModified || selected.lastUsed} />
                        <Metric label="AppID" value={selected.appId || "No aplica"} />
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          Ruta real
                        </p>
                          <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-xs leading-5 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                          {selected.realPath || selected.location}
                        </div>
                        {selected.realPath && selected.realPath !== selected.location && (
                          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3 text-xs leading-5 text-muted-foreground">
                            Acceso original: {selected.location}
                          </div>
                        )}
                      </div>

                      <Card className="mt-6 border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Activity className="size-4" />
                            Actividad
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[notice, "Biblioteca persistente en AppData", "UI React lista para empaquetar", isDesktop() ? "Modo escritorio activo" : "Modo navegador activo"].map((entry) => (
                            <div key={entry} className="flex items-center gap-3 text-sm text-muted-foreground">
                              <CheckCircle2 className="size-4 text-white/70" />
                              {entry}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                )}
                </AnimatePresence>
              </ScrollArea>
            </aside>
          </section>

          <footer className="flex min-h-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.055] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-6">
            <div className="flex items-center gap-3 text-xs text-muted-foreground md:text-sm">
              <HardDrive className="size-4" />
              {items.length} accesos indexados
            </div>
            <div className="hidden sm:block">
              <AnimatedDock
                items={items}
                onSelect={setSelectedId}
                onOpenCopilot={() => setScreen("copilot")}
                selectedId={selected?.id ?? ""}
              />
            </div>
            <div className="hidden items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground lg:flex">
              Nexus Core Preview
            </div>
          </footer>
        </div>
      </motion.main>
    </TooltipProvider>
  );
}

function LauncherCard({
  item,
  index,
  active,
  onSelect,
  onFavorite,
}: {
  item: LibraryItem;
  index: number;
  active: boolean;
  onSelect: () => void;
  onFavorite: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.22, ease: appleEase, delay: Math.min(index * 0.006, 0.08) }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className={cn(
        "group relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left shadow-[0_18px_56px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl transition-[background,border-color,box-shadow] duration-200 ease-out will-change-transform",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_42%)] before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100",
        active && "border-white/35 bg-white/[0.10] shadow-[0_22px_70px_rgba(0,0,0,0.28),0_0_0_1px_rgba(255,255,255,0.10),inset_0_1px_0_rgba(255,255,255,0.09)]",
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white/35"
        initial={false}
        animate={{ opacity: active ? 0.8 : 0.28, scaleX: active ? 1 : 0.72 }}
        transition={{ duration: 0.34, ease: appleEase }}
      />
      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <AppIcon item={item} className="size-11 shrink-0 sm:size-12 xl:size-10 2xl:size-11" iconClassName="size-5" />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
          className="grid size-8 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
        >
          {item.favorite ? (
            <Star className="size-4 fill-current text-white" />
          ) : (
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </div>
      <div className="relative z-10 mb-2 flex min-w-0 items-center gap-2">
        <Badge variant={item.status === "Listo" ? "default" : "secondary"}>
          {item.status}
        </Badge>
        <span className="truncate text-xs text-muted-foreground">{item.type}</span>
      </div>
      <h3 className="relative z-10 line-clamp-2 text-base font-semibold leading-5 tracking-normal text-white xl:text-[15px] 2xl:text-base">
        {item.name}
      </h3>
      <p className="relative z-10 mt-2 line-clamp-1 text-xs leading-5 text-muted-foreground 2xl:text-sm">
        {item.version ? `Version ${item.version}` : item.size ? `Tamano: ${item.size}` : item.description}
      </p>
    </motion.button>
  );
}

function VirtualizedLibraryGrid({
  items,
  selectedId,
  onSelect,
  onFavorite,
}: {
  items: LibraryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onFavorite: (id: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateViewport = () => {
      setViewport({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };
    updateViewport();

    const observer = new ResizeObserver(updateViewport);
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (element) element.scrollTop = 0;
    setScrollTop(0);
  }, [items]);

  const metrics = useMemo(() => {
    const paddingX = viewport.width >= 768 ? 20 : 16;
    const paddingY = viewport.width >= 768 ? 20 : 16;
    const gap = 12;
    const availableWidth = Math.max(viewport.width - paddingX * 2, 1);
    const columns =
      availableWidth >= 1240
        ? 4
        : availableWidth >= 760
          ? 3
          : availableWidth >= 520
            ? 2
            : 1;
    const cardHeight = viewport.width >= 1280 ? 150 : viewport.width >= 640 ? 156 : 148;
    const columnWidth = (availableWidth - gap * (columns - 1)) / columns;
    const rowHeight = cardHeight + gap;
    const rowCount = Math.ceil(items.length / columns);
    return {
      paddingX,
      paddingY,
      gap,
      columns,
      cardHeight,
      columnWidth,
      rowHeight,
      rowCount,
      totalHeight: paddingY * 2 + rowCount * cardHeight + Math.max(rowCount - 1, 0) * gap,
    };
  }, [items.length, viewport.width]);

  const visibleRange = useMemo(() => {
    const overscanRows = 4;
    const startRow = Math.max(0, Math.floor((scrollTop - metrics.paddingY) / metrics.rowHeight) - overscanRows);
    const endRow = Math.min(
      metrics.rowCount - 1,
      Math.ceil((scrollTop + viewport.height - metrics.paddingY) / metrics.rowHeight) + overscanRows,
    );
    const startIndex = startRow * metrics.columns;
    const endIndex = Math.min(items.length, (endRow + 1) * metrics.columns);
    return { startIndex, endIndex };
  }, [items.length, metrics.columns, metrics.paddingY, metrics.rowCount, metrics.rowHeight, scrollTop, viewport.height]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const nextScrollTop = event.currentTarget.scrollTop;
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => setScrollTop(nextScrollTop));
  }

  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex);

  return (
    <div
      ref={viewportRef}
      className="h-full overflow-y-auto overflow-x-hidden"
      onScroll={handleScroll}
    >
      <div className="relative" style={{ height: metrics.totalHeight }}>
        {visibleItems.map((item, localIndex) => {
          const index = visibleRange.startIndex + localIndex;
          const row = Math.floor(index / metrics.columns);
          const column = index % metrics.columns;
          const top = metrics.paddingY + row * metrics.rowHeight;
          const left = metrics.paddingX + column * (metrics.columnWidth + metrics.gap);

          return (
            <div
              key={item.id}
              className="absolute"
              style={{
                top,
                left,
                width: metrics.columnWidth,
                height: metrics.cardHeight,
              }}
            >
              <LauncherCard
                item={item}
                index={localIndex}
                active={item.id === selectedId}
                onSelect={() => onSelect(item.id)}
                onFavorite={() => onFavorite(item.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompactLaunchPanel({
  item,
  status,
  notice,
  onOpen,
  onReveal,
  onValidate,
}: {
  item: LibraryItem;
  status: ActionStatus;
  notice: string;
  onOpen: () => void;
  onReveal: () => void;
  onValidate: () => void;
}) {
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: appleEase }}
      className="mx-4 mt-4 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl lg:hidden"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <AppIcon item={item} className="size-12 shrink-0" iconClassName="size-6" />
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant={item.status === "Listo" ? "default" : "secondary"}>
                {item.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{item.type}</span>
            </div>
            <h2 className="truncate text-base font-semibold text-white md:text-lg">
              {item.name}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {status === "idle" ? item.description : notice}
            </p>
          </div>
        </div>

        <div className="grid w-full min-w-0 max-w-full grid-cols-3 gap-2 overflow-hidden sm:grid-cols-[minmax(160px,1fr)_auto_auto] md:flex md:w-auto md:shrink-0">
          <Button className="h-10 w-full min-w-0 px-2 sm:px-4" onClick={onOpen} disabled={status === "opening"} aria-label={status === "opening" ? "Abriendo" : "Abrir"}>
            <Play className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">{status === "opening" ? "Abriendo" : "Abrir"}</span>
          </Button>
          <Button variant="secondary" className="h-10 w-full min-w-0 px-2 sm:px-4" onClick={onReveal} aria-label="Carpeta">
            <Folder className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Carpeta</span>
          </Button>
          <Button variant="secondary" className="h-10 w-full min-w-0 px-2 sm:px-4" onClick={onValidate} disabled={status === "validating"} aria-label={status === "validating" ? "Validando" : "Validar"}>
            <Download className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">{status === "validating" ? "Validando" : "Validar"}</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyLibraryState({
  hasQuery,
  onAddProgram,
  onAddFolder,
}: {
  hasQuery: boolean;
  onAddProgram: () => void;
  onAddFolder: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(8px)" }}
      transition={appleSpring}
      className="col-span-full grid min-h-[420px] place-items-center rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"
    >
      <div className="max-w-xl">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Plus className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-normal">
          {hasQuery ? "No encontre accesos con ese filtro" : "Construye tu biblioteca local"}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {hasQuery
            ? "Cambia la busqueda o vuelve a Todo para ver tus accesos disponibles."
            : "Esta instalacion empieza limpia. Cada PC guarda sus propios juegos, programas y proyectos en AppData local."}
        </p>
        {!hasQuery && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={onAddProgram}>
              <Plus className="mr-2 size-4" />
              Agregar programa
            </Button>
            <Button variant="secondary" onClick={onAddFolder}>
              <Folder className="mr-2 size-4" />
              Agregar carpeta
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PageHeader({
  eyebrow,
  title,
  icon: Icon,
  onBack,
}: {
  eyebrow: string;
  title: string;
  icon: NexusIcon;
  onBack: () => void;
}) {
  return (
    <header className={cn("relative z-10 flex h-[72px] items-center justify-between border-b border-white/10 bg-white/[0.055] px-6 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl", isDesktop() && "app-drag")}>
      <div className="flex items-center gap-4">
        <div className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.075] shadow-[0_16px_48px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Icon className="size-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
        </div>
      </div>
      <div className={cn("flex items-center gap-2", isDesktop() && "app-no-drag")}>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          Biblioteca
        </Button>
        <WindowControls />
      </div>
    </header>
  );
}

function NotesWorkspace({
  items,
  notes,
  onCreate,
  onCreateLinked,
  onUpdate,
  onDelete,
}: {
  items: LibraryItem[];
  notes: NexusNote[];
  onCreate: () => void;
  onCreateLinked: () => void;
  onUpdate: (noteId: string, patch: Partial<NexusNote>) => void;
  onDelete: (noteId: string) => void;
}) {
  const itemById = new Map(items.map((item) => [item.id, item]));

  return (
    <section className="relative z-10 h-[calc(100vh-72px)] overflow-hidden">
      <ScrollArea className="h-full">
        <div className="mx-auto grid max-w-7xl gap-6 p-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Sistema de notas</p>
            <h2 className="mt-2 text-2xl font-semibold">Ideas, bugs y tareas</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Notas locales para organizar decisiones del launcher, recordar ajustes o documentar accesos.
            </p>
            <div className="mt-5 grid gap-3">
              <Button onClick={onCreate}>
                <Plus className="mr-2 size-4" />
                Nueva nota
              </Button>
              <Button variant="secondary" onClick={onCreateLinked}>
                <FileText className="mr-2 size-4" />
                Nota del acceso seleccionado
              </Button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric label="Notas" value={String(notes.length)} />
              <Metric label="Fijadas" value={String(notes.filter((note) => note.pinned).length)} />
            </div>
          </div>

          <div className="grid gap-4">
            {notes.length ? notes.map((note) => {
              const linkedItem = note.linkedItemId ? itemById.get(note.linkedItemId) : null;
              return (
                <motion.article
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <input
                        value={note.title}
                        onChange={(event) => onUpdate(note.id, { title: event.target.value })}
                        className="w-full bg-transparent text-xl font-semibold outline-none"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Actualizada {new Date(note.updatedAt).toLocaleString()}</span>
                        {linkedItem && <Badge variant="secondary">{linkedItem.name}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant={note.pinned ? "default" : "secondary"} size="icon" onClick={() => onUpdate(note.id, { pinned: !note.pinned })}>
                        <Star className="size-4" />
                      </Button>
                      <Button variant="secondary" size="icon" onClick={() => onDelete(note.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={note.body}
                    onChange={(event) => onUpdate(note.id, { body: event.target.value })}
                    placeholder="Escribe una nota, decision, pendiente o bug..."
                    className="min-h-40 w-full resize-y rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white outline-none placeholder:text-muted-foreground"
                  />
                </motion.article>
              );
            }) : (
              <div className="grid min-h-[420px] place-items-center rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-center">
                <div>
                  <FileText className="mx-auto mb-4 size-10 text-white/70" />
                  <h2 className="text-2xl font-semibold">Todavia no hay notas</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Crea la primera nota para empezar a organizar ideas del launcher.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}

function formatBytes(value: number) {
  if (!value) return "No disponible";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number) {
  if (!seconds) return "No disponible";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days ? `${days} d ${hours} h` : `${hours} h`;
}

function SystemAnalysis({
  snapshot,
  onRefresh,
}: {
  snapshot: SystemSnapshot | null;
  onRefresh: () => void;
}) {
  return (
    <section className="relative z-10 h-[calc(100vh-72px)] overflow-hidden">
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Analisis local</p>
                <h2 className="mt-2 text-3xl font-semibold">Estado real de esta PC</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Primer modulo de diagnostico. Lee datos locales basicos del sistema sin subir informacion a internet.
                </p>
              </div>
              <Button onClick={onRefresh}>
                <RotateCcw className="mr-2 size-4" />
                Actualizar
              </Button>
            </div>
          </div>

          {snapshot ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Equipo" value={snapshot.hostname} />
              <Metric label="Sistema" value={`${snapshot.platform} ${snapshot.release}`} />
              <Metric label="Arquitectura" value={snapshot.arch} />
              <Metric label="Encendido" value={formatDuration(snapshot.uptimeSeconds)} />
              <Metric label="CPU" value={snapshot.cpuModel} />
              <Metric label="Nucleos" value={String(snapshot.cpuCores)} />
              <Metric label="RAM usada" value={formatBytes(snapshot.usedMemory)} />
              <Metric label="RAM total" value={formatBytes(snapshot.totalMemory)} />
              <Metric label="Disco libre" value={formatBytes(snapshot.rootDisk?.free ?? 0)} />
              <Metric label="Disco total" value={formatBytes(snapshot.rootDisk?.total ?? 0)} />
              <Metric label="Home" value={snapshot.homeDir} />
              <Metric label="AppData Nexus" value={snapshot.appDataDir} />
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-center text-muted-foreground">
              Cargando analisis de PC...
            </div>
          )}
        </div>
      </ScrollArea>
    </section>
  );
}

function NewsInterestPreview({ items }: { items: LibraryItem[] }) {
  const interests = useMemo(() => {
    const hasGames = items.some((item) => item.type === "Juego");
    const hasProjects = items.some((item) => item.type === "Proyecto");
    const hasPrograms = items.some((item) => item.type === "Programa");
    const detected = [
      hasGames && { label: "Gaming PC", source: "Steam, GOG, Battle.net, patch notes" },
      hasProjects && { label: "Desarrollo", source: "GitHub, engines, frameworks" },
      hasPrograms && { label: "Herramientas", source: "updates, changelogs, release notes" },
      { label: "Hardware", source: "drivers, componentes, rendimiento" },
    ].filter(Boolean) as { label: string; source: string }[];
    return detected;
  }, [items]);

  const newsPreview = [
    {
      title: "Actualizaciones de tus launchers y tiendas",
      detail: "RSS o fuentes oficiales para Steam, GOG, Battle.net y herramientas instaladas.",
      status: "Fuente real",
    },
    {
      title: "Cambios importantes para tus proyectos",
      detail: "Noticias de engines, librerias y repos que coincidan con tus carpetas locales.",
      status: "Filtrado local",
    },
    {
      title: "Alertas de sistema y drivers",
      detail: "Senales relacionadas con GPU, Windows, almacenamiento y rendimiento.",
      status: "Opt-in",
    },
  ];

  return (
    <section className="relative z-10 h-[calc(100vh-72px)] overflow-hidden">
      <ScrollArea className="h-full">
        <div className="mx-auto grid max-w-7xl gap-6 p-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
              <div className="mb-5 grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.075]">
                <Rss className="size-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Noticias reales
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Curadas por intereses</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                La IA local no necesita subir tus conversaciones. Puede guardar intereses en AppData y usarlos para filtrar fuentes reales configuradas por el usuario.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Intereses detectados
              </p>
              <div className="mt-4 space-y-3">
                {interests.map((interest) => (
                  <div key={interest.label} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                    <div className="font-semibold">{interest.label}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{interest.source}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {newsPreview.map((entry, index) => (
              <motion.article
                key={entry.title}
                layout
                initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...appleSpring, delay: index * 0.04 }}
                className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="secondary">{entry.status}</Badge>
                    <h3 className="mt-4 text-2xl font-semibold">{entry.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {entry.detail}
                    </p>
                  </div>
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/25">
                    <Newspaper className="size-5" />
                  </div>
                </div>
              </motion.article>
            ))}

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              Proxima fase: conectar RSS reales, cache local, fuentes por categoria y un filtro de IA local que explique por que una noticia aparece.
            </div>
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}

function CopilotLauncherBackdrop({
  background,
}: {
  background: LauncherBackground;
}) {
  const hasCustomBackground = Boolean(background.url && background.mediaType);
  const mediaStyle = {
    opacity: background.opacity,
    filter: `blur(${background.blur}px)`,
    transform: background.blur > 0 ? "scale(1.04)" : "scale(1)",
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {hasCustomBackground && background.mediaType === "image" && (
          <motion.img
            key={background.url}
            alt=""
            src={background.url}
            className={cn("absolute inset-0 h-full w-full", background.fit === "cover" ? "object-cover" : "object-contain")}
            style={mediaStyle}
            initial={{ opacity: 0, scale: 1.04, filter: `blur(${background.blur + 10}px)` }}
            animate={{ opacity: background.opacity, scale: background.blur > 0 ? 1.04 : 1, filter: `blur(${background.blur}px)` }}
            exit={{ opacity: 0, scale: 1.02, filter: `blur(${background.blur + 10}px)` }}
            transition={{ duration: 0.72, ease: appleEase }}
          />
        )}
        {hasCustomBackground && background.mediaType === "video" && (
          <motion.video
            key={background.url}
            src={background.url}
            className={cn("absolute inset-0 h-full w-full", background.fit === "cover" ? "object-cover" : "object-contain")}
            style={mediaStyle}
            autoPlay
            muted
            loop
            playsInline
            initial={{ opacity: 0, scale: 1.04, filter: `blur(${background.blur + 10}px)` }}
            animate={{ opacity: background.opacity, scale: background.blur > 0 ? 1.04 : 1, filter: `blur(${background.blur}px)` }}
            exit={{ opacity: 0, scale: 1.02, filter: `blur(${background.blur + 10}px)` }}
            transition={{ duration: 0.72, ease: appleEase }}
          />
        )}
      </AnimatePresence>
      {hasCustomBackground && (
        <div className="absolute inset-0 bg-black" style={{ opacity: background.dim }} />
      )}
      <div className={cn("absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_18%_72%,rgba(255,255,255,0.055),transparent_24%),linear-gradient(180deg,#050505_0%,#0c0c0d_48%,#030303_100%)]", hasCustomBackground && "opacity-40")} />
      <div className="absolute left-[14%] top-[19%] size-1 rounded-full bg-white/70" />
      <div className="absolute left-[82%] top-[25%] size-1 rounded-full bg-white/55" />
      <div className="absolute left-[28%] top-[11%] size-0.5 rounded-full bg-white/80" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:82px_82px] opacity-20" />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

function CustomizationDialog({
  background,
  open,
  onOpenChange,
  onChange,
}: {
  background: LauncherBackground;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (background: LauncherBackground) => void;
}) {
  function updateBackground(partial: Partial<LauncherBackground>) {
    onChange({ ...background, ...partial });
  }

  function handleUrlChange(value: string) {
    const cleanValue = value.trim();
    const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(cleanValue);
    updateBackground({
      url: cleanValue,
      mediaType: cleanValue ? (isVideo ? "video" : "image") : null,
      name: cleanValue ? "URL personalizada" : "Fondo Nexus",
      opacity: cleanValue ? 0.72 : defaultLauncherBackground.opacity,
      blur: 0,
      dim: cleanValue ? 0.3 : defaultLauncherBackground.dim,
    });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    if (mediaType === "video") {
      updateBackground({
        url: URL.createObjectURL(file),
        mediaType,
        name: file.name,
        opacity: 0.72,
        blur: 0,
        dim: 0.3,
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      updateBackground({
        url: reader.result,
        mediaType,
        name: file.name,
        opacity: 0.72,
        blur: 0,
        dim: 0.3,
      });
    });
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden border-white/10 bg-black/70 p-0 text-white shadow-[0_28px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_0%,rgba(255,255,255,0.14),transparent_34%)]" />
        <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="mb-3 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.075]">
                <Palette className="size-5" />
              </div>
              <DialogTitle className="text-2xl">Personalizacion visual</DialogTitle>
              <DialogDescription>
                Prueba wallpapers estaticos, GIFs o video sin salir del preview.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <label className="group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.045] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/[0.075]">
                <Upload className="mb-3 size-6 text-white/80" />
                <span className="text-sm font-semibold">Subir wallpaper local</span>
                <span className="mt-1 text-xs text-muted-foreground">Imagen, GIF, MP4 o WebM</span>
                <input
                  type="file"
                  accept="image/*,.gif,video/mp4,video/webm,video/ogg"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>

              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  URL de fondo
                </label>
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <ImageIcon className="size-4 text-white/70" />
                  <input
                    value={background.url.startsWith("data:") || background.url.startsWith("blob:") ? "" : background.url}
                    onChange={(event) => handleUrlChange(event.target.value)}
                    placeholder="https://.../wallpaper.gif"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {backgroundPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => onChange(preset)}
                    className={cn(
                      "group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-2 text-left transition-colors hover:bg-white/[0.075]",
                      background.name === preset.name && "border-white/35 bg-white/[0.10]",
                    )}
                  >
                    <div className="relative h-24 overflow-hidden rounded-xl bg-black/50">
                      {preset.url ? (
                        <img alt="" src={preset.url} className="h-full w-full object-cover opacity-80 transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(180deg,#121212,#030303)]" />
                      )}
                    </div>
                    <div className="px-1 pt-2 text-sm font-medium">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-l border-white/10 bg-white/[0.045] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Fondo activo
                </p>
                <h3 className="mt-1 font-semibold">{background.name}</h3>
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => onChange(defaultLauncherBackground)}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>

            <div className="relative mb-6 h-44 overflow-hidden rounded-3xl border border-white/10 bg-black">
              {background.url && background.mediaType === "image" && (
                <img alt="" src={background.url} className="h-full w-full object-cover" />
              )}
              {background.url && background.mediaType === "video" && (
                <video src={background.url} className="h-full w-full object-cover" autoPlay muted loop playsInline />
              )}
              {!background.url && (
                <div className="h-full w-full bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(180deg,#121212,#030303)]" />
              )}
              <div className="absolute inset-0 bg-black" style={{ opacity: background.dim }} />
              <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-2 text-xs text-white backdrop-blur-xl">
                Glass readability preview
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Claridad
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Nitido", values: { opacity: 0.78, dim: 0.22, blur: 0 } },
                    { label: "Glass", values: { opacity: 0.62, dim: 0.34, blur: 1 } },
                    { label: "Foco", values: { opacity: 0.48, dim: 0.48, blur: 2 } },
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      variant="secondary"
                      onClick={() => updateBackground(preset.values)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <RangeControl
                label="Opacidad del fondo"
                value={background.opacity}
                min={0.12}
                max={0.9}
                step={0.01}
                onChange={(value) => updateBackground({ opacity: value })}
              />
              <RangeControl
                label="Oscurecer"
                value={background.dim}
                min={0}
                max={0.82}
                step={0.01}
                onChange={(value) => updateBackground({ dim: value })}
              />
              <RangeControl
                label="Blur"
                value={background.blur}
                min={0}
                max={12}
                step={1}
                onChange={(value) => updateBackground({ blur: value })}
              />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Ajuste
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["cover", "contain"] as const).map((fit) => (
                    <Button
                      key={fit}
                      variant={background.fit === fit ? "default" : "secondary"}
                      onClick={() => updateBackground({ fit })}
                    >
                      {fit === "cover" ? "Cubrir" : "Completo"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(value * (max <= 1 ? 100 : 1))}{max <= 1 ? "%" : "px"}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-white"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}

function AnimatedDock({
  selectedId,
  items,
  onSelect,
  onOpenCopilot,
}: {
  selectedId: string;
  items: LibraryItem[];
  onSelect: (id: string) => void;
  onOpenCopilot: () => void;
}) {
  const dockItems = items.filter((item) => item.favorite).slice(0, 6);

  return (
    <motion.div layout className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2 shadow-[0_20px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
      {dockItems.map((item) => {
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <motion.button
                layout
                whileHover={{ y: -8, scale: 1.12 }}
                whileTap={{ scale: 0.96 }}
                transition={appleSpring}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "grid size-11 place-items-center rounded-xl border border-white/10 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors",
                  selectedId === item.id && "border-white/35 bg-white/90 text-black shadow-[0_0_34px_rgba(255,255,255,0.18)]",
                )}
              >
                <AppIcon item={item} className="size-7 rounded-sm bg-transparent" iconClassName="size-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>{item.name}</TooltipContent>
          </Tooltip>
        );
      })}
      <Separator orientation="vertical" className="mx-1 h-8" />
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            layout
            whileHover={{ y: -8, scale: 1.12 }}
            whileTap={{ scale: 0.96 }}
            transition={appleSpring}
            onClick={onOpenCopilot}
            className="grid size-11 place-items-center rounded-xl border border-white/30 bg-white/90 text-black shadow-[0_0_34px_rgba(255,255,255,0.18)]"
          >
            <Sparkles className="size-5" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>Nexus Copilot</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            layout
            whileHover={{ y: -8, scale: 1.12 }}
            whileTap={{ scale: 0.96 }}
            transition={appleSpring}
            className="grid size-11 place-items-center rounded-xl border border-white/10 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <AppWindow className="size-5" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>Vista ventanas</TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

function WindowControls() {
  if (!isDesktop()) return null;

  const controls = [
    {
      label: "Minimizar",
      icon: Minimize2,
      onClick: () => window.nexus?.minimizeWindow(),
      className: "hover:bg-white/10 hover:text-foreground",
    },
    {
      label: "Maximizar",
      icon: Maximize2,
      onClick: () => window.nexus?.maximizeWindow(),
      className: "hover:bg-white/10 hover:text-foreground",
    },
    {
      label: "Cerrar",
      icon: X,
      onClick: () => window.nexus?.closeWindow(),
      className: "hover:bg-red-500/90 hover:text-white",
    },
  ];

  return (
    <div className="app-no-drag ml-2 flex items-center gap-0.5 rounded-full border border-white/8 bg-white/[0.035] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_34px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      {controls.map((control) => {
        const Icon = control.icon;
        return (
          <Tooltip key={control.label}>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                aria-label={control.label}
                whileHover={{ y: -1, scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={control.onClick}
                className={cn(
                  "grid size-7 place-items-center rounded-full text-muted-foreground/80 transition-colors",
                  control.className,
                )}
              >
                <Icon className="size-3.5 stroke-[1.8]" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>{control.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default App;
