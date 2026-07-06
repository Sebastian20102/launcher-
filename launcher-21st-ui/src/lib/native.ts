import type { LibraryItem } from "@/lib/library";

export const isDesktop = () => Boolean(window.nexus);

export async function loadNativeLibrary(fallback: LibraryItem[]) {
  if (!window.nexus) {
    try {
      const response = await fetch("/library.generated.json", { cache: "no-store" });
      if (response.ok) {
        const generated = (await response.json()) as LibraryItem[];
        if (generated.length) return generated;
      }
    } catch {
      return fallback;
    }
    return fallback;
  }
  const stored = await window.nexus.loadLibrary();
  if (!stored.length) {
    await window.nexus.saveLibrary(fallback);
    return fallback;
  }
  return stored;
}

export async function saveNativeLibrary(items: LibraryItem[]) {
  if (!window.nexus) return items;
  return window.nexus.saveLibrary(items);
}
