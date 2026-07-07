# Nexus Launcher Desktop Runtime

This package contains the production React/Electron app for Nexus Launcher.

## Scripts

```powershell
npm run dev       # browser preview
npm run build     # TypeScript + Vite production build
npm run desktop   # build and run Electron
npm run lint      # oxlint
npm run dist:win  # Windows installer + portable artifacts
```

## Release Build

```powershell
npm run dist:win
```

Release artifacts are generated in `release/`. Upload the installer/portable `.exe` files to GitHub Releases. Do not commit generated builds.

The Vite build removes local library artifacts from `dist/`:

```text
dist/library.generated.json
dist/app-icons/
```

Electron also ignores bundled generated libraries unless `NEXUS_INCLUDE_BUNDLED_LIBRARY=1` is explicitly set.

## Runtime Data

Each Windows user gets separate local data:

```text
%APPDATA%\Nexus Launcher\library.json
%APPDATA%\Nexus Launcher\ai-memory.json
%APPDATA%\Nexus Launcher\ai-settings.json
```

These files must never be committed or packaged as default user data.

## AI Providers

Nexus Copilot supports:

- LM Studio at `http://127.0.0.1:1234/v1`
- Ollama at `http://127.0.0.1:11434`
- OpenAI-compatible API keys through environment variables or local AppData settings

The chat has backend and frontend timeouts so provider failures do not leave the UI stuck in a permanent thinking state.

## Native Bridge

Electron exposes a limited `window.nexus` API through `electron/preload.cjs`:

- Load/save local library.
- Open, reveal and validate paths.
- Pick executable/folder.
- Chat with configured AI provider.
- Control custom window buttons.

Renderer code should use `src/lib/native.ts` and the typed declarations in `src/types/electron.d.ts`.
