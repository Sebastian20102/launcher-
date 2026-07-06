import type { LibraryItem } from "@/lib/library";

export type NativeResult = {
  ok: boolean;
  message?: string;
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
    };
  }
}
