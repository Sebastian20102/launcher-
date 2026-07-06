import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AppWindow,
  Bell,
  CheckCircle2,
  ChevronRight,
  CommandIcon,
  Download,
  Folder,
  HardDrive,
  Layers3,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

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
import { Input } from "@/components/ui/input";
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
import { isDesktop, loadNativeLibrary, saveNativeLibrary } from "@/lib/native";
import { cn } from "@/lib/utils";

const filters = ["Todo", "Juego", "Programa", "Proyecto", "Sistema"];

function App() {
  const [items, setItems] = useState<LibraryItem[]>(seedLibrary);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todo");
  const [selectedId, setSelectedId] = useState(seedLibrary[0].id);
  const [commandOpen, setCommandOpen] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const [notice, setNotice] = useState("Listo para lanzar");
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [screen, setScreen] = useState<"library" | "motion">("library");
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    loadNativeLibrary(seedLibrary)
      .then((loadedItems) => {
        setItems(loadedItems);
        setSelectedId(loadedItems[0]?.id ?? seedLibrary[0].id);
      })
      .catch(() => setNotice("No pude cargar la biblioteca local"));
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

  async function addManualPath() {
    if (!manualPath.trim()) return;
    setActionStatus("importing");
    const nextItem = createItemFromPath(manualPath.trim(), "Programa");
    const nextItems = [nextItem, ...items];
    await updateItems(nextItems, `${nextItem.name} agregado manualmente`);
    finishStatus("success", `${nextItem.name} agregado manualmente`);
    setManualPath("");
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
        <main className="relative min-h-screen bg-background text-foreground">
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

  return (
    <TooltipProvider>
      <main className="relative min-h-screen bg-background text-foreground">
        <OdysseyBackdrop intensity={actionStatus === "idle" ? "calm" : "active"} />
        <div className="relative z-10 grid min-h-screen grid-rows-[72px_1fr_84px]">
          <CopilotChat
            items={items}
            open={copilotOpen}
            onOpenChange={setCopilotOpen}
            onSelectItem={setSelectedId}
          />
          <header className={cn("flex items-center justify-between border-b border-border bg-card/75 px-6 backdrop-blur", isDesktop() && "app-drag")}>
            <div className="flex items-center gap-4">
              <div className="grid size-11 place-items-center rounded-md border border-border bg-secondary">
                <Layers3 className="size-5" />
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

            <div className={cn("hidden w-[460px] items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-muted-foreground lg:flex", isDesktop() && "app-no-drag")}>
              <Search className="size-4" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Buscar juegos, programas o proyectos"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd className="rounded border border-border bg-card px-2 py-1 text-[11px]">
                /
              </kbd>
            </div>

            <div className={cn("flex items-center gap-2", isDesktop() && "app-no-drag")}>
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
              <Button variant="secondary" size="icon">
                <Bell className="size-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <Settings className="size-4" />
              </Button>
              <WindowControls />
            </div>
          </header>

          <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_390px] gap-0 max-lg:grid-cols-1">
            <div className="min-w-0 border-r border-border">
              <Tabs value={filter} onValueChange={setFilter} className="h-full">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
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
                    className="m-0 h-[calc(100vh-157px)]"
                  >
                    <ScrollArea className="h-full">
                      <div className="grid gap-4 p-6 xl:grid-cols-2 2xl:grid-cols-3">
                        {filteredItems.map((item, index) => (
                          <LauncherCard
                            key={item.id}
                            item={item}
                            index={index}
                            active={item.id === selected?.id}
                            onSelect={() => setSelectedId(item.id)}
                            onFavorite={() => toggleFavorite(item.id)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <aside className="hidden min-h-0 bg-card/80 backdrop-blur lg:block">
              <ScrollArea className="h-[calc(100vh-156px)]">
                {selected && (
                  <div className="p-6">
                    <motion.div
                      key={selected.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
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
                        <div className="rounded-md border border-border bg-secondary p-3 text-xs leading-5 text-muted-foreground">
                          {selected.realPath || selected.location}
                        </div>
                        {selected.realPath && selected.realPath !== selected.location && (
                          <div className="rounded-md border border-border bg-card/70 p-3 text-xs leading-5 text-muted-foreground">
                            Acceso original: {selected.location}
                          </div>
                        )}
                      </div>

                      <Card className="mt-6 bg-card/80">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Activity className="size-4" />
                            Actividad
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[notice, "Biblioteca persistente en AppData", "UI React lista para empaquetar", isDesktop() ? "Modo escritorio activo" : "Modo navegador activo"].map((entry) => (
                            <div key={entry} className="flex items-center gap-3 text-sm text-muted-foreground">
                              <CheckCircle2 className="size-4 text-emerald-300" />
                              {entry}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )}
              </ScrollArea>
            </aside>
          </section>

          <footer className="flex items-center justify-between border-t border-border bg-card/75 px-6 backdrop-blur">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <HardDrive className="size-4" />
              {items.length} accesos indexados
            </div>
            <AnimatedDock
              items={items}
              onSelect={setSelectedId}
              onOpenCopilot={() => setCopilotOpen(true)}
              selectedId={selected?.id ?? ""}
            />
            <div className="flex items-center gap-2">
              <Input
                className="h-9 w-56"
                placeholder="Pegar ruta..."
                value={manualPath}
                onChange={(event) => setManualPath(event.target.value)}
              />
              <Button variant="secondary" onClick={addManualPath}>
                Importar
              </Button>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.24 }}
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className={cn(
        "group rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors",
        active && "border-primary bg-secondary",
      )}
    >
      <div className="mb-5 flex items-start justify-between">
        <motion.div layoutId={`launcher-icon-${item.id}`}>
          <AppIcon item={item} className="size-12" iconClassName="size-6" />
        </motion.div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
        >
          {item.favorite ? (
            <Star className="size-4 fill-current text-primary" />
          ) : (
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <Badge variant={item.status === "Listo" ? "default" : "secondary"}>
          {item.status}
        </Badge>
        <span className="text-xs text-muted-foreground">{item.type}</span>
      </div>
      <h3 className="mb-1 text-lg font-semibold tracking-normal">{item.name}</h3>
      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
        {item.version ? `Version ${item.version}` : item.description}
      </p>
    </motion.button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary p-3">
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
    <div className="flex items-end gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
      {dockItems.map((item) => {
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ y: -8, scale: 1.12 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "grid size-11 place-items-center rounded-md border border-border bg-card transition-colors",
                  selectedId === item.id && "border-primary bg-primary text-primary-foreground",
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
            whileHover={{ y: -8, scale: 1.12 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenCopilot}
            className="grid size-11 place-items-center rounded-md border border-border bg-card"
          >
            <Sparkles className="size-5" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>Nexus Copilot</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ y: -8, scale: 1.12 }}
            className="grid size-11 place-items-center rounded-md border border-border bg-card"
          >
            <AppWindow className="size-5" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>Vista ventanas</TooltipContent>
      </Tooltip>
    </div>
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
      className: "hover:border-red-400/40 hover:bg-red-500/85 hover:text-white",
    },
  ];

  return (
    <div className="app-no-drag ml-2 flex items-center gap-1 rounded-md border border-white/10 bg-black/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_rgba(0,0,0,0.22)]">
      {controls.map((control) => {
        const Icon = control.icon;
        return (
          <Tooltip key={control.label}>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                aria-label={control.label}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={control.onClick}
                className={cn(
                  "grid size-8 place-items-center rounded-sm border border-transparent text-muted-foreground transition-colors",
                  control.className,
                )}
              >
                <Icon className="size-4" />
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
