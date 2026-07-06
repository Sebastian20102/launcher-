import type { LibraryItem } from "@/lib/library";

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

declare global {
  interface Window {
    nexus?: {
      loadLibrary: () => Promise<LibraryItem[]>;
      saveLibrary: (items: LibraryItem[]) => Promise<LibraryItem[]>;
      validatePath: (targetPath: string) => Promise<boolean>;
      openPath: (targetPath: string) => Promise<NativeResult>;
      revealPath: (targetPath: string) => Promise<NativeResult>;
      pickExecutable: () => Promise<string | null>;
      pickFolder: () => Promise<string | null>;
      chatWithAi: (payload: { message: string; items: LibraryItem[] }) => Promise<AiChatResponse>;
      loadAiMemory: () => Promise<AiMemory>;
      clearAiMemory: () => Promise<AiMemory>;
    };
  }
}
