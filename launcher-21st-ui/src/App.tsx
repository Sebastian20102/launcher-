import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AppWindow,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  CommandIcon,
  Download,
  Folder,
  HardDrive,
  ImageIcon,
  Layers3,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
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
import { MotionLab } from "@/components/MotionLab";
import {
  FocusDepthCard,
  OdysseyBackdrop,
  OdysseyStatus,
  type ActionStatus,
} from "@/components/OdysseyFocus";
import { AppIcon } from "@/components/AppIcon";
import { CopilotChat } from "@/components/CopilotChat";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { isDesktop, loadNativeLibrary, saveNativeLibrary } from "@/lib/native";
import { cn } from "@/lib/utils";

const filters = ["Todo", "Juego", "Programa", "Proyecto", "Sistema"];
const launcherBackgroundStorageKey = "nexus-launcher-background-preview";
const appleEase = [0.22, 1, 0.36, 1] as const;
const appleSpring = {
  type: "spring",
  stiffness: 320,
  damping: 34,
  mass: 0.82,
} as const;

type LauncherBackground = {
  url: string;
  mediaType: "image" | "video" | null;
  name: string;
  opacity: number;
  blur: number;
  dim: number;
  fit: "cover" | "contain";
};

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
  const [screen, setScreen] = useState<"library" | "motion" | "copilot" | "identity">("library");
  const [launcherBackground, setLauncherBackground] = useState<LauncherBackground>(defaultLauncherBackground);

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

  async function addFromPicker(kind: "Programa" | "Proyecto") {
    if (!window.nexus) {
      setNotice("La seleccion nativa funciona al abrir con npm run desktop");
      return;
    }
    const targetPath =
      kind === "Proyecto"
        ? await window.nexus.pickFolder()
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

  if (screen === "motion") {
    return (
      <TooltipProvider>
        <main className="relative h-screen overflow-hidden bg-background text-foreground">
          <OdysseyBackdrop intensity={actionStatus === "idle" ? "calm" : "active"} />
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
                  Motion Lab
                </h1>
              </div>
            </div>
            <div className={cn("flex items-center gap-2", isDesktop() && "app-no-drag")}>
              <Button variant="secondary" onClick={() => setScreen("library")}>
                Volver a biblioteca
              </Button>
              <WindowControls />
            </div>
          </header>
          <div className="relative z-10">
            <MotionLab items={items} />
          </div>
        </main>
      </TooltipProvider>
    );
  }

  if (screen === "copilot") {
    return (
      <TooltipProvider>
        <main className="relative h-screen overflow-hidden bg-background text-foreground">
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
        </main>
      </TooltipProvider>
    );
  }

  if (screen === "identity") {
    return (
      <TooltipProvider>
        <main className="relative h-screen overflow-hidden bg-background text-foreground">
          <OdysseyBackdrop intensity="calm" />
          <header className={cn("relative z-10 flex h-[72px] items-center justify-between border-b border-border bg-card/75 px-6 backdrop-blur", isDesktop() && "app-drag")}>
            <div className="flex items-center gap-4">
              <div className="grid size-11 place-items-center rounded-md border border-border bg-secondary">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Nexus Core
                </p>
                <h1 className="text-xl font-semibold tracking-normal">
                  Laboratorio de identidad
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
          <IdentityPreview items={items} />
        </main>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <main className="relative h-screen overflow-hidden bg-black text-foreground">
        <CopilotLauncherBackdrop background={launcherBackground} />
        <div className="relative z-10 grid h-screen grid-rows-[72px_minmax(0,1fr)_84px] overflow-hidden">
          <header className={cn("flex items-center justify-between border-b border-white/10 bg-white/[0.055] px-6 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl", isDesktop() && "app-drag")}>
            <div className="flex items-center gap-4">
              <div className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.075] shadow-[0_16px_48px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]">
                <Layers3 className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Nexus launcher
                </p>
                <h1 className="text-xl font-semibold tracking-normal">
                  Biblioteca local
                </h1>
              </div>
            </div>

            <div className={cn("hidden w-[460px] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.065] px-4 py-2.5 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl lg:flex", isDesktop() && "app-no-drag")}>
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

            <div className={cn("flex items-center gap-2", isDesktop() && "app-no-drag")}>
              <Button variant="secondary" onClick={() => setScreen("identity")}>
                <Sparkles className="mr-2 size-4" />
                Identidad
              </Button>
              <Button variant="secondary" onClick={() => setScreen("motion")}>
                <Sparkles className="mr-2 size-4" />
                Motion Lab
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
              <Button variant="secondary" onClick={() => setCustomizationOpen(true)}>
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

          <section className="grid min-h-0 overflow-hidden grid-cols-[minmax(0,1fr)_390px] gap-0 max-lg:grid-cols-1">
            <div className="min-h-0 min-w-0 border-r border-white/10 bg-black/10">
              <Tabs value={filter} onValueChange={setFilter} className="flex h-full min-h-0 flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.025] px-6 py-4 backdrop-blur-xl">
                  <TabsList>
                    {filters.map((entry) => (
                      <TabsTrigger key={entry} value={entry}>
                        {entry}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => addFromPicker("Proyecto")}>
                      <Folder className="mr-2 size-4" />
                      Carpeta
                    </Button>
                    <Button onClick={() => addFromPicker("Programa")}>
                      <Plus className="mr-2 size-4" />
                      Programa
                    </Button>
                  </div>
                </div>

                {filters.map((entry) => (
                  <TabsContent
                    key={entry}
                    value={entry}
                    className="m-0 min-h-0 flex-1 overflow-hidden"
                  >
                    <ScrollArea className="h-full">
                      <motion.div layout className="grid gap-4 p-6 xl:grid-cols-2 2xl:grid-cols-3">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {filteredItems.length ? (
                            filteredItems.map((item, index) => (
                              <LauncherCard
                                key={item.id}
                                item={item}
                                index={index}
                                active={item.id === selected?.id}
                                onSelect={() => setSelectedId(item.id)}
                                onFavorite={() => toggleFavorite(item.id)}
                              />
                            ))
                          ) : (
                            <EmptyLibraryState
                              key="empty-library"
                              hasQuery={Boolean(query.trim()) || filter !== "Todo"}
                              onAddProgram={() => addFromPicker("Programa")}
                              onAddFolder={() => addFromPicker("Proyecto")}
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <aside className="hidden min-h-0 border-l border-white/10 bg-white/[0.045] backdrop-blur-2xl lg:block">
              <ScrollArea className="h-full">
                <AnimatePresence mode="wait" initial={false}>
                {selected && (
                  <motion.div
                    key={selected.id}
                    className="p-6"
                    initial={{ opacity: 0, x: 24, scale: 0.985, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 18, scale: 0.985, filter: "blur(10px)" }}
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
                        <Metric label="Tamano" value={selected.size ?? selected.playtime} />
                        <Metric label="Version" value={selected.version || "No disponible"} />
                        <Metric label="Origen" value={selected.vendor} />
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

          <footer className="flex min-h-0 items-center justify-between border-t border-white/10 bg-white/[0.055] px-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <HardDrive className="size-4" />
              {items.length} accesos indexados
            </div>
            <AnimatedDock
              items={items}
              onSelect={setSelectedId}
              onOpenCopilot={() => setScreen("copilot")}
              selectedId={selected?.id ?? ""}
            />
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Nexus Core Preview
            </div>
          </footer>
        </div>
      </main>
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
      layout
      initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(8px)" }}
      transition={{ ...appleSpring, delay: Math.min(index * 0.014, 0.16) }}
      whileHover={{ y: -7, scale: 1.012 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-left shadow-[0_20px_70px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-[background,border-color,box-shadow] duration-300 ease-out will-change-transform",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_42%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        active && "border-white/35 bg-white/[0.105] shadow-[0_26px_90px_rgba(0,0,0,0.30),0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.10)]",
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/35"
        initial={false}
        animate={{ opacity: active ? 0.8 : 0.28, scaleX: active ? 1 : 0.72 }}
        transition={{ duration: 0.34, ease: appleEase }}
      />
      <div className="relative z-10 mb-5 flex items-start justify-between">
        <motion.div layoutId={`launcher-icon-${item.id}`}>
          <AppIcon item={item} className="size-12" iconClassName="size-6" />
        </motion.div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
          className="grid size-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
        >
          {item.favorite ? (
            <Star className="size-4 fill-current text-white" />
          ) : (
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </div>
      <div className="relative z-10 mb-3 flex items-center gap-2">
        <Badge variant={item.status === "Listo" ? "default" : "secondary"}>
          {item.status}
        </Badge>
        <span className="text-xs text-muted-foreground">{item.type}</span>
      </div>
      <h3 className="relative z-10 mb-1 text-lg font-semibold tracking-normal text-white">{item.name}</h3>
      <p className="relative z-10 line-clamp-2 text-sm leading-6 text-muted-foreground">
        {item.version ? `Version ${item.version}` : item.description}
      </p>
    </motion.button>
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

function IdentityPreview({ items }: { items: LibraryItem[] }) {
  const featured = items.filter((item) => item.favorite).slice(0, 8);
  const carouselItems = featured.length ? featured : items.slice(0, 8);

  return (
    <section className="relative z-10 h-[calc(100vh-72px)] overflow-hidden">
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <DynamicIdentityBanner />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <div className="space-y-6">
              <UpdateBannerPreview />
              <IconPackPreview />
            </div>
            <div className="space-y-6">
              <LogoCarousel items={carouselItems} />
              <MicroLoaderPreview />
            </div>
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}

function DynamicIdentityBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-lg border border-white/10 bg-[#111215] px-8 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.09),transparent_35%,rgba(255,255,255,0.075))]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-1/2 size-72 -translate-y-1/2 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-xl">
            <span className="size-1.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.45)]" />
            Identity preview
          </div>
          <h2 className="max-w-4xl text-5xl font-semibold tracking-normal text-foreground">
            Nexus Core
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Un centro de mando sobrio para abrir, organizar y entender todo lo que vive en tu PC.
          </p>
        </div>
        <div className="grid min-w-72 gap-2 rounded-md border border-white/10 bg-black/24 p-4">
          {["Launcher", "Copilot", "Library"].map((label, index) => (
            <motion.div
              key={label}
              className="flex items-center justify-between rounded-sm bg-white/[0.035] px-3 py-2 text-sm"
              animate={{ opacity: [0.58, 1, 0.58] }}
              transition={{ duration: 2.4, delay: index * 0.3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="text-white">Online</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function UpdateBannerPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-card/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Update banner
          </p>
          <h3 className="mt-1 text-xl font-semibold">Actualizar banner</h3>
        </div>
        <Badge variant="secondary">21st style</Badge>
      </div>
      <UpgradeBanner />
    </div>
  );
}

function LogoCarousel({ items }: { items: LibraryItem[] }) {
  const loopItems = [...items, ...items];

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-card/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Logo carousel
        </p>
        <h3 className="mt-1 text-xl font-semibold">Ecosistema conectado</h3>
      </div>
      <div className="relative overflow-hidden rounded-md border border-white/8 bg-black/30 py-6 [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]">
        <div className="nexus-logo-track flex w-max gap-8 px-4">
          {loopItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex min-w-40 items-center justify-center gap-3 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
            >
              <AppIcon item={item} className="size-9 bg-white/[0.04]" iconClassName="size-4" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{item.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconPackPreview() {
  const iconItems = [
    { label: "Games", icon: Play },
    { label: "Apps", icon: AppWindow },
    { label: "Projects", icon: Folder },
    { label: "System", icon: HardDrive },
    { label: "Copilot", icon: Sparkles },
    { label: "Command", icon: CommandIcon },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-card/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Icon pack
        </p>
        <h3 className="mt-1 text-xl font-semibold">Categorias Nexus</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {iconItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              whileHover={{ y: -3 }}
              className="rounded-md border border-white/8 bg-black/24 p-4"
            >
              <div className="mb-4 grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-white backdrop-blur-xl">
                <Icon className="size-5" />
              </div>
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">Core glyph</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MicroLoaderPreview() {
  return (
    <div className="rounded-lg border border-white/10 bg-card/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Animated micro-loaders
        </p>
        <h3 className="mt-1 text-xl font-semibold">Estados de sistema</h3>
      </div>
      <div className="grid gap-3">
        <MicroLoader label="Indexando biblioteca" tone="primary" />
        <MicroLoader label="Validando ruta" tone="muted" />
        <MicroLoader label="Abriendo programa" tone="success" />
      </div>
    </div>
  );
}

function MicroLoader({ label, tone }: { label: string; tone: "primary" | "muted" | "success" }) {
  const color =
    tone === "success"
      ? "bg-white"
      : tone === "primary"
        ? "bg-white/80"
        : "bg-muted-foreground";

  return (
    <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/24 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className={cn("size-2 rounded-full", color)}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 0.9, delay: dot * 0.12, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
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
