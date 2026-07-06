import {
  Boxes,
  Code2,
  Folder,
  Gamepad2,
  MonitorPlay,
  TerminalSquare,
  type LucideIcon,
} from "lucide-react";

export type LibraryItem = {
  id: string;
  name: string;
  type: "Juego" | "Programa" | "Proyecto" | "Sistema";
  vendor: string;
  status: "Listo" | "Actualizando" | "Sin revisar";
  location: string;
  lastUsed: string;
  playtime: string;
  description: string;
  accent: string;
  icon: string;
  favorite?: boolean;
  version?: string;
  realPath?: string;
  installDate?: string;
  size?: string;
  source?: string;
  appId?: string;
  fileModified?: string;
  iconUrl?: string;
};

export const iconRegistry: Record<string, LucideIcon> = {
  boxes: Boxes,
  code: Code2,
  folder: Folder,
  gamepad: Gamepad2,
  monitor: MonitorPlay,
  terminal: TerminalSquare,
};

export const fallbackIcon = "gamepad";

export const seedLibrary: LibraryItem[] = [
  {
    id: "steam",
    name: "Steam",
    type: "Juego",
    vendor: "Valve",
    status: "Listo",
    location: "C:/Program Files (x86)/Steam/steam.exe",
    lastUsed: "Hoy",
    playtime: "312 h",
    description: "Biblioteca principal, Big Picture y juegos instalados.",
    accent: "bg-sky-200 text-sky-950",
    icon: "gamepad",
    favorite: true,
  },
  {
    id: "vscode",
    name: "VS Code",
    type: "Programa",
    vendor: "Microsoft",
    status: "Listo",
    location: "C:/Users/Jonathan/AppData/Local/Programs/Microsoft VS Code/Code.exe",
    lastUsed: "Hace 20 min",
    playtime: "91 h",
    description: "Editor principal para prototipos, scripts y launcher WPF.",
    accent: "bg-blue-200 text-blue-950",
    icon: "code",
    favorite: true,
  },
  {
    id: "terminal",
    name: "Terminal",
    type: "Sistema",
    vendor: "Windows",
    status: "Listo",
    location: "wt.exe",
    lastUsed: "Hace 1 h",
    playtime: "48 h",
    description: "PowerShell, node, git y comandos de mantenimiento.",
    accent: "bg-zinc-200 text-zinc-950",
    icon: "terminal",
  },
  {
    id: "nexus",
    name: "NexusLauncherWpf",
    type: "Proyecto",
    vendor: "Local",
    status: "Actualizando",
    location: "C:/Users/Jonathan/Documents/New project 2/NexusLauncherWpf",
    lastUsed: "Hoy",
    playtime: "18 h",
    description: "Version de escritorio real del launcher.",
    accent: "bg-stone-200 text-stone-950",
    icon: "boxes",
    favorite: true,
  },
  {
    id: "battlenet",
    name: "Battle.net",
    type: "Juego",
    vendor: "Blizzard",
    status: "Sin revisar",
    location: "C:/Program Files (x86)/Battle.net/Battle.net Launcher.exe",
    lastUsed: "Ayer",
    playtime: "74 h",
    description: "Acceso a juegos de Blizzard y actualizaciones.",
    accent: "bg-cyan-100 text-cyan-950",
    icon: "monitor",
  },
  {
    id: "projects",
    name: "Carpeta Proyectos",
    type: "Proyecto",
    vendor: "Local",
    status: "Listo",
    location: "C:/Users/Jonathan/Documents",
    lastUsed: "Hoy",
    playtime: "132 h",
    description: "Acceso rapido a proyectos activos y prototipos.",
    accent: "bg-amber-100 text-amber-950",
    icon: "folder",
  },
];

export function getIcon(name: string) {
  return iconRegistry[name] ?? iconRegistry[fallbackIcon];
}

export function createItemFromPath(targetPath: string, type: LibraryItem["type"]): LibraryItem {
  const normalized = targetPath.replaceAll("\\", "/");
  const rawName = normalized.split("/").pop() || "Nuevo acceso";
  const name = rawName.replace(/\.(exe|lnk|bat|cmd)$/i, "");
  const isProject = type === "Proyecto";
  const isSystem = type === "Sistema";
  return {
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
    name,
    type,
    vendor: "Local",
    status: "Sin revisar",
    location: targetPath,
    lastUsed: "Nuevo",
    playtime: "0 h",
    description: isProject
      ? "Carpeta o proyecto agregado manualmente."
      : "Programa o juego agregado manualmente.",
    accent: isProject ? "bg-amber-100 text-amber-950" : "bg-slate-200 text-slate-950",
    icon: isProject ? "folder" : isSystem ? "terminal" : "gamepad",
    favorite: false,
  };
}
