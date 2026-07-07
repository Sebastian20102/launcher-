import type { LibraryItem, PathAnalysis } from "@/lib/library";

export type NativeResult = {
  ok: boolean;
  message?: string;
};

export type AiChatResponse = {
  ok: boolean;
  content: string;
  provider?: "openai" | "ollama" | "lmstudio";
  model?: string;
  needsKey?: boolean;
  remembered?: number;
};

export type AiMemory = {
  messages: Array<{ role: "user" | "assistant"; content: string; createdAt?: string }>;
  facts: Array<{ id: string; text: string; createdAt: string }>;
};

export type NexusNote = {
  id: string;
  title: string;
  body: string;
  linkedItemId?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SystemSnapshot = {
  hostname: string;
  platform: string;
  release: string;
  arch: string;
  uptimeSeconds: number;
  cpuModel: string;
  cpuCores: number;
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  rootDisk: null | { total: number; free: number; available: number };
  homeDir: string;
  appDataDir: string;
  capturedAt: string;
};

declare global {
  interface Window {
    nexus?: {
      loadLibrary: () => Promise<LibraryItem[]>;
      saveLibrary: (items: LibraryItem[]) => Promise<LibraryItem[]>;
      validatePath: (targetPath: string) => Promise<boolean>;
      analyzePath: (targetPath: string) => Promise<PathAnalysis | null>;
      openPath: (targetPath: string) => Promise<NativeResult>;
      revealPath: (targetPath: string) => Promise<NativeResult>;
      pickExecutable: () => Promise<string | null>;
      pickAnyFile: () => Promise<string | null>;
      pickFolder: () => Promise<string | null>;
      chatWithAi: (payload: { message: string; items: LibraryItem[] }) => Promise<AiChatResponse>;
      loadAiMemory: () => Promise<AiMemory>;
      clearAiMemory: () => Promise<AiMemory>;
      loadNotes: () => Promise<NexusNote[]>;
      saveNotes: (notes: NexusNote[]) => Promise<NexusNote[]>;
      getSystemSnapshot: () => Promise<SystemSnapshot>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
    };
  }
}
