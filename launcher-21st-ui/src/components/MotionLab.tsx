import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Crosshair, Folder, Loader2, Play, Sparkles, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIcon, type LibraryItem } from "@/lib/library";
import { cn } from "@/lib/utils";

type MotionLabProps = {
  items: LibraryItem[];
};

const spring = {
  type: "spring" as const,
  stiffness: 360,
  damping: 28,
  mass: 0.7,
};

export function MotionLab({ items }: MotionLabProps) {
  const playableItems = useMemo(() => items.slice(0, 12), [items]);
  const gameItems = useMemo(
    () => items.filter((item) => item.type === "Juego").slice(0, 10),
    [items],
  );
  const [selectedId, setSelectedId] = useState(playableItems[0]?.id ?? "");
  const [focusId, setFocusId] = useState(gameItems[0]?.id ?? playableItems[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const selected =
    playableItems.find((item) => item.id === selectedId) ?? playableItems[0];
  const focusItem =
    gameItems.find((item) => item.id === focusId) ?? gameItems[0] ?? selected;

  function runStatusDemo(next: typeof status) {
    setStatus("loading");
    window.setTimeout(() => setStatus(next), 900);
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-background">
      <section className="border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Motion Lab
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">
              Variantes dinamicas para el launcher
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            Interacciones reales con Framer Motion
          </div>
        </div>
      </section>

      <Tabs defaultValue="precision" className="px-6 py-5">
        <TabsList className="mb-5">
          <TabsTrigger value="precision">3D Precision</TabsTrigger>
          <TabsTrigger value="console">Console Focus</TabsTrigger>
          <TabsTrigger value="fluid">Fluid Library</TabsTrigger>
        </TabsList>

        <TabsContent value="precision" className="m-0">
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <Card>
              <CardHeader>
                <CardTitle>Cards 3D siguiendo el mouse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {playableItems.slice(0, 6).map((item, index) => (
                    <TiltCard
                      key={item.id}
                      item={item}
                      active={item.id === selectedId}
                      index={index}
                      onSelect={() => setSelectedId(item.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <motion.aside
              key={selected?.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={spring}
              className="rounded-lg border border-border bg-card p-5"
            >
              {selected && <DetailPreview item={selected} />}
            </motion.aside>
          </div>
        </TabsContent>

        <TabsContent value="console" className="m-0">
          <div className="grid min-h-[650px] gap-5 xl:grid-cols-[390px_1fr]">
            <div className="space-y-3">
              {gameItems.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <motion.button
                    key={item.id}
                    layout
                    transition={spring}
                    onClick={() => setFocusId(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors",
                      item.id === focusId && "border-primary bg-secondary",
                    )}
                  >
                    <motion.div layoutId={`console-icon-${item.id}`} className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.075] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                      <Icon className="size-5" />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{item.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{item.location}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="relative overflow-hidden rounded-lg border border-border bg-card p-7">
              <AnimatePresence mode="wait">
                {focusItem && (
                  <motion.div
                    key={focusItem.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={spring}
                    className="relative z-10 grid h-full content-between"
                  >
                    <div>
                      <div className="mb-7 flex items-start justify-between">
                        <motion.div layoutId={`console-icon-${focusItem.id}`} className="grid size-24 place-items-center rounded-2xl border border-white/10 bg-white/[0.075] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                          {(() => {
                            const Icon = getIcon(focusItem.icon);
                            return <Icon className="size-12" />;
                          })()}
                        </motion.div>
                        <Badge variant="secondary">{focusItem.type}</Badge>
                      </div>
                      <motion.h3 layout className="max-w-3xl text-5xl font-semibold tracking-normal">
                        {focusItem.name}
                      </motion.h3>
                      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Transicion compartida card a panel: el icono viaja, el foco cambia y el resto de la interfaz baja intensidad.
                      </p>
                    </div>
                    <div className="mt-8 flex items-center gap-3">
                      <Button size="lg">
                        <Play className="mr-2 size-4" />
                        Abrir foco
                      </Button>
                      <Button variant="secondary" size="lg">
                        <Folder className="mr-2 size-4" />
                        Ubicacion
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fluid" className="m-0">
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <Card>
              <CardHeader>
                <CardTitle>Layouts animados + estados</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div layout className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {playableItems.slice(0, 9).map((item) => (
                    <motion.button
                      layout
                      key={item.id}
                      transition={spring}
                      whileHover={{ y: -5, scale: 1.015 }}
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "rounded-lg border border-border bg-card p-4 text-left",
                        item.id === selectedId && "border-primary bg-secondary",
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Badge variant="secondary">{item.type}</Badge>
                        <Zap className="size-4 text-primary" />
                      </div>
                      <div className="text-sm font-semibold">{item.name}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{item.status}</div>
                    </motion.button>
                  ))}
                </motion.div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de accion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatusStage status={status} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => runStatusDemo("success")}>
                      Exito
                    </Button>
                    <Button variant="secondary" onClick={() => runStatusDemo("error")}>
                      Error
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Skeleton loading</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[0, 1, 2].map((item) => (
                    <motion.div
                      key={item}
                      animate={{ opacity: [0.45, 1, 0.45] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: item * 0.18 }}
                      className="h-12 rounded-md bg-secondary"
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TiltCard({
  item,
  active,
  index,
  onSelect,
}: {
  item: LibraryItem;
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50 });
  const Icon = getIcon(item.icon);

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.04 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const px = x / rect.width;
        const py = y / rect.height;
        setTilt({
          rx: (0.5 - py) * 14,
          ry: (px - 0.5) * 18,
          px: px * 100,
          py: py * 100,
        });
      }}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0, px: 50, py: 50 })}
      onClick={onSelect}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
      className={cn(
        "relative min-h-52 overflow-hidden rounded-lg border border-border bg-card p-4 text-left transition-colors will-change-transform",
        active && "border-primary bg-secondary",
      )}
    >
      <div
        className="pointer-events-none absolute size-32 rounded-full bg-primary/10 blur-2xl"
        style={{ left: `${tilt.px}%`, top: `${tilt.py}%`, transform: "translate(-50%, -50%)" }}
      />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="grid size-14 place-items-center rounded-xl border border-white/10 bg-white/[0.075] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <Icon className="size-7" />
        </div>
        <div>
          <Badge variant="secondary" className="mb-3">{item.type}</Badge>
          <h3 className="text-xl font-semibold tracking-normal">{item.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {item.description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function DetailPreview({ item }: { item: LibraryItem }) {
  const Icon = getIcon(item.icon);

  return (
    <div>
      <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.075] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <Icon className="size-8" />
      </div>
      <Badge variant="secondary">{item.status}</Badge>
      <h3 className="mt-4 text-3xl font-semibold tracking-normal">{item.name}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
      <div className="mt-6 rounded-md border border-border bg-secondary p-3 text-xs leading-5 text-muted-foreground">
        {item.location}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button>
          <Play className="mr-2 size-4" />
          Abrir
        </Button>
        <Button variant="secondary">
          <Crosshair className="mr-2 size-4" />
          Foco
        </Button>
      </div>
    </div>
  );
}

function StatusStage({ status }: { status: "idle" | "loading" | "success" | "error" }) {
  return (
    <div className="rounded-lg border border-border bg-secondary p-5">
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
            <Clock3 className="size-5 text-muted-foreground" />
            <span className="text-sm">Esperando accion</span>
          </motion.div>
        )}
        {status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-sm">Validando ruta...</span>
          </motion.div>
        )}
        {status === "success" && (
          <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-300" />
            <span className="text-sm">Accion completada</span>
          </motion.div>
        )}
        {status === "error" && (
          <motion.div key="error" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -6, 6, 0] }} exit={{ opacity: 0 }} className="flex items-center gap-3">
            <Zap className="size-5 text-red-300" />
            <span className="text-sm">Ruta no disponible</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
