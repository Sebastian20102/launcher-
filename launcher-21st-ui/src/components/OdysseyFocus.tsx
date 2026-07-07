import { CheckCircle2, Loader2, Play, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { getIcon, type LibraryItem } from "@/lib/library";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/AppIcon";

export type ActionStatus = "idle" | "opening" | "validating" | "importing" | "success" | "error";

type OdysseyFocusProps = {
  item: LibraryItem;
  status: ActionStatus;
  message: string;
};

type OdysseyBackdropProps = {
  intensity?: "calm" | "active";
};

const statusCopy: Record<ActionStatus, { label: string; icon: typeof Play; tone: string }> = {
  idle: { label: "En foco", icon: Zap, tone: "text-white" },
  opening: { label: "Abriendo", icon: Loader2, tone: "text-white" },
  validating: { label: "Validando", icon: Loader2, tone: "text-white" },
  importing: { label: "Importando", icon: Loader2, tone: "text-white" },
  success: { label: "Completado", icon: CheckCircle2, tone: "text-white" },
  error: { label: "Atencion", icon: XCircle, tone: "text-red-300" },
};

const arcs = [
  "M22 108 C74 20 164 24 218 104 S352 192 414 94",
  "M18 170 C104 116 160 230 236 160 S348 76 424 158",
  "M54 48 C142 122 170 24 244 90 S322 206 398 44",
];

const backgroundArcs = [
  "M-80 150 C180 -40 360 20 540 180 S900 410 1180 80 S1500 -80 1700 220",
  "M-40 520 C180 390 330 620 560 460 S960 210 1240 420 S1500 650 1740 360",
  "M120 20 C300 260 470 -30 690 160 S960 520 1260 90 S1540 -40 1760 250",
  "M-120 760 C120 570 380 720 620 620 S990 390 1260 610 S1510 800 1760 560",
];

export function OdysseyBackdrop({ intensity = "calm" }: OdysseyBackdropProps) {
  const active = intensity === "active";

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      <motion.div
        className="absolute inset-[-8%]"
        animate={{ opacity: active ? [0.42, 0.68, 0.42] : [0.2, 0.34, 0.2] }}
        transition={{ duration: active ? 1.4 : 5.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg className="h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          {backgroundArcs.map((path, index) => (
            <motion.path
              key={path}
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth={index === 1 ? 1.2 : 0.8}
              className={index % 2 === 0 ? "text-white/28" : "text-muted-foreground/28"}
              strokeLinecap="round"
              initial={{ pathLength: 0.1, opacity: 0 }}
              animate={{
                pathLength: active ? [0.1, 1, 0.2] : [0.16, 0.82, 0.3],
                opacity: active ? [0.28, 0.96, 0.22] : [0.18, 0.62, 0.2],
              }}
              transition={{
                duration: active ? 1.25 + index * 0.12 : 6.5 + index * 0.45,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.35,
              }}
            />
          ))}
        </svg>
      </motion.div>
      <div className="absolute inset-0 bg-background/48" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.26)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:84px_84px] opacity-35" />
      <div className="absolute left-6 top-24 hidden rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 backdrop-blur-xl xl:block">
        Odyssey Field
      </div>
    </div>
  );
}

export function OdysseyFocus({ item, status, message }: OdysseyFocusProps) {
  const Icon = getIcon(item.icon);
  const statusMeta = statusCopy[status];
  const StatusIcon = statusMeta.icon;
  const isBusy = status === "opening" || status === "validating" || status === "importing";

  return (
    <div className="relative mb-6 overflow-hidden rounded-lg border border-border bg-secondary p-4">
      <div className="absolute inset-0 opacity-70">
        <svg className="h-full w-full" viewBox="0 0 440 240" preserveAspectRatio="none" aria-hidden="true">
          {arcs.map((path, index) => (
            <motion.path
              key={path}
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth={index === 1 ? 1.8 : 1.1}
              className={index === 1 ? "text-white/45" : "text-muted-foreground/25"}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0.18, 1, 0.38],
                opacity: isBusy ? [0.15, 0.9, 0.2] : [0.08, 0.35, 0.12],
              }}
              transition={{
                duration: isBusy ? 1.1 : 3.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.25,
              }}
            />
          ))}
        </svg>
      </div>

      <motion.div
        className="absolute inset-6 rounded-lg border border-white/10"
        animate={{ opacity: isBusy ? [0.2, 0.8, 0.2] : [0.12, 0.28, 0.12] }}
        transition={{ duration: isBusy ? 0.9 : 3, repeat: Infinity }}
      />

      <div className="relative z-10">
        <div className="mb-10 flex items-start justify-between">
          <motion.div
            layoutId={`launcher-icon-${item.id}`}
            className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.075] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
          >
            <Icon className="size-8" />
          </motion.div>
          <Badge variant="secondary" className="border-white/10">
            Odyssey Focus
          </Badge>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {item.type}
            </p>
            <h3 className="truncate text-2xl font-semibold tracking-normal">{item.name}</h3>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold"
            >
              <StatusIcon className={cn("size-4", statusMeta.tone, isBusy && "animate-spin")} />
              {statusMeta.label}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-4 min-h-5 text-sm leading-6 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function OdysseyStatus({
  status,
  message,
}: {
  status: ActionStatus;
  message: string;
}) {
  const statusMeta = statusCopy[status];
  const StatusIcon = statusMeta.icon;
  const isBusy = status === "opening" || status === "validating" || status === "importing";

  return (
    <div className="rounded-lg border border-border bg-secondary/85 p-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={status + message}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="flex items-center gap-3"
        >
          <div className="grid size-9 place-items-center rounded-md border border-border bg-card">
            <StatusIcon className={cn("size-4", statusMeta.tone, isBusy && "animate-spin")} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {statusMeta.label}
            </div>
            <div className="truncate text-sm">{message}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function FocusDepthCard({
  item,
  status,
}: {
  item: LibraryItem;
  status: ActionStatus;
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, x: 50, y: 50 });
  const isActive = status === "opening" || status === "validating" || status === "importing";

  return (
    <motion.div
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const px = x / rect.width;
        const py = y / rect.height;
        setTilt({
          rx: (0.5 - py) * 8,
          ry: (px - 0.5) * 10,
          x: px * 100,
          y: py * 100,
        });
      }}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0, x: 50, y: 50 })}
      animate={{ opacity: isActive ? [0.72, 1, 0.78] : 1 }}
      transition={{ duration: 1.6, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
      className="relative overflow-hidden rounded-lg border border-border bg-secondary/85 p-4 will-change-transform"
    >
      <div
        className="pointer-events-none absolute size-40 rounded-full bg-white/10 blur-2xl"
        style={{ left: `${tilt.x}%`, top: `${tilt.y}%`, transform: "translate(-50%, -50%)" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 border border-white/10"
        animate={{ opacity: isActive ? [0.12, 0.5, 0.12] : [0.06, 0.16, 0.06] }}
        transition={{ duration: isActive ? 0.9 : 3, repeat: Infinity }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <motion.div
          layoutId={`launcher-icon-${item.id}`}
        >
          <AppIcon item={item} className="size-14 rounded-lg shadow-sm" iconClassName="size-8" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{item.type}</Badge>
            <span className="text-xs text-muted-foreground">{item.status}</span>
          </div>
          <h3 className="mt-2 truncate text-xl font-semibold tracking-normal">{item.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {item.version ? `Version ${item.version}` : item.size ? `Tamano ${item.size}` : item.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
