import {
  Boxes,
  Code2,
  FileText,
  Folder,
  Gamepad2,
  Image,
  MonitorPlay,
  TerminalSquare,
  Video,
  type LucideIcon,
} from "lucide-react";

export type PathAnalysis = {
  path: string;
  exists: boolean;
  isDirectory: boolean;
  extension: string;
  sizeBytes: number | null;
  modifiedAt: string | null;
  createdAt: string | null;
  inferredType: LibraryItem["type"];
  icon: string;
  name: string;
  description: string;
  source: string;
};

export type LibraryItem = {
  id: string;
  name: string;
  type: "Juego" | "Programa" | "Proyecto" | "Sistema" | "Archivo";
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
  image: Image,
  monitor: MonitorPlay,
  terminal: TerminalSquare,
  text: FileText,
  video: Video,
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
    accent: "bg-white/10 text-white",
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
    accent: "bg-white/10 text-white",
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
    accent: "bg-white/10 text-white",
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
    accent: "bg-white/10 text-white",
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
    accent: "bg-white/10 text-white",
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
    accent: "bg-white/10 text-white",
    icon: "folder",
  },
];

export function getIcon(name: string) {
  return iconRegistry[name] ?? iconRegistry[fallbackIcon];
}

const imageExtensions = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "ico"];
const videoExtensions = ["mp4", "webm", "mov", "mkv", "avi", "m4v"];
const textExtensions = ["txt", "md", "json", "csv", "log", "xml", "yml", "yaml", "ini", "toml"];
const documentExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "rtf"];
const codeExtensions = ["js", "jsx", "ts", "tsx", "py", "cs", "cpp", "c", "html", "css", "scss", "java", "go", "rs", "php"];
const executableExtensions = ["exe", "lnk", "bat", "cmd", "msi", "appref-ms"];
const gameLaunchers = ["steam", "epic games", "battle.net", "gog", "riot", "rockstar", "ubisoft", "ea app", "roblox"];
const developerTools = ["code", "visual studio", "cursor", "zed", "git", "node", "python", "unity", "unreal", "blender"];

function cleanItemName(rawName: string) {
  return rawName
    .replace(/\.(exe|lnk|bat|cmd|msi|appref-ms|png|jpg|jpeg|webp|gif|bmp|svg|ico|mp4|webm|mov|mkv|avi|m4v|txt|md|json|csv|log|xml|yml|yaml|ini|toml|pdf|docx?|xlsx?|pptx?|rtf)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Nuevo acceso";
}

function formatBytes(value: number | null) {
  if (!value) return undefined;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`;
}

function formatDate(value: string | null) {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function inferTypeFromNameAndExtension(name: string, extension: string, fallbackType: LibraryItem["type"]) {
  const lowerName = name.toLowerCase();
  if (fallbackType === "Proyecto") return "Proyecto";
  if (imageExtensions.includes(extension) || videoExtensions.includes(extension) || textExtensions.includes(extension) || documentExtensions.includes(extension) || codeExtensions.includes(extension)) {
    return "Archivo";
  }
  if (gameLaunchers.some((entry) => lowerName.includes(entry))) return "Juego";
  if (developerTools.some((entry) => lowerName.includes(entry))) return "Programa";
  if (executableExtensions.includes(extension)) return fallbackType === "Archivo" ? "Programa" : fallbackType;
  return fallbackType;
}

function inferIcon(type: LibraryItem["type"], extension: string) {
  if (type === "Proyecto") return "folder";
  if (type === "Sistema") return "terminal";
  if (imageExtensions.includes(extension)) return "image";
  if (videoExtensions.includes(extension)) return "video";
  if (textExtensions.includes(extension) || documentExtensions.includes(extension) || codeExtensions.includes(extension)) return "text";
  if (type === "Juego") return "gamepad";
  if (type === "Programa") return "monitor";
  return "text";
}

function buildDescription(type: LibraryItem["type"], extension: string, isDirectory = false) {
  if (isDirectory || type === "Proyecto") return "Carpeta o proyecto local agregado manualmente.";
  if (imageExtensions.includes(extension)) return "Imagen local agregada a la biblioteca.";
  if (videoExtensions.includes(extension)) return "Video local agregado a la biblioteca.";
  if (documentExtensions.includes(extension)) return "Documento local agregado a la biblioteca.";
  if (codeExtensions.includes(extension)) return "Archivo de codigo agregado a la biblioteca.";
  if (textExtensions.includes(extension)) return "Archivo de texto o datos agregado a la biblioteca.";
  if (type === "Juego") return "Juego o launcher de juegos agregado manualmente.";
  if (type === "Programa") return "Programa local agregado manualmente.";
  return "Archivo local agregado manualmente.";
}

export function createItemFromPath(targetPath: string, type: LibraryItem["type"]): LibraryItem {
  const normalized = targetPath.replaceAll("\\", "/");
  const rawName = normalized.split("/").pop() || "Nuevo acceso";
  const name = cleanItemName(rawName);
  const extension = rawName.split(".").pop()?.toLowerCase() ?? "";
  const inferredType = inferTypeFromNameAndExtension(name, extension, type);
  const inferredIcon = inferIcon(inferredType, extension);
  return {
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
    name,
    type: inferredType,
    vendor: "Local",
    status: "Sin revisar",
    location: targetPath,
    lastUsed: "Nuevo",
    playtime: "Sin seguimiento",
    description: buildDescription(inferredType, extension, type === "Proyecto"),
    accent: "bg-white/10 text-white",
    icon: inferredIcon,
    favorite: false,
    source: "Archivo local",
  };
}

export function createItemFromAnalysis(analysis: PathAnalysis, fallbackType: LibraryItem["type"]): LibraryItem {
  const normalized = analysis.path.replaceAll("\\", "/");
  const rawName = normalized.split("/").pop() || analysis.name || "Nuevo acceso";
  const name = cleanItemName(analysis.name || rawName);
  const extension = analysis.extension.replace(/^\./, "").toLowerCase();
  const inferredType = analysis.inferredType || inferTypeFromNameAndExtension(name, extension, fallbackType);
  const icon = analysis.icon || inferIcon(inferredType, extension);
  const size = formatBytes(analysis.sizeBytes);
  const fileModified = formatDate(analysis.modifiedAt);
  return {
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
    name,
    type: inferredType,
    vendor: "Local",
    status: analysis.exists ? "Listo" : "Sin revisar",
    location: analysis.path,
    lastUsed: fileModified || "Nuevo",
    playtime: "Sin seguimiento",
    description: analysis.description || buildDescription(inferredType, extension, analysis.isDirectory),
    accent: "bg-white/10 text-white",
    icon,
    favorite: false,
    size,
    fileModified,
    source: analysis.source || "Archivo local",
    installDate: formatDate(analysis.createdAt),
  };
}
