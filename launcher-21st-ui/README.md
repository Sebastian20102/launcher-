# Nexus Launcher UI

Production UI and desktop runtime for Nexus Launcher.

This package contains the React application, Electron native bridge, launcher components, AI workspace and local import tools.

## Quick Start

```powershell
npm install
npm run desktop
```

For browser-only development:

```powershell
npm run dev
```

## Scripts

```powershell
npm run lint      # oxlint
npm run build     # TypeScript + Vite production build
npm run desktop   # build and run Electron
npm run dist:win  # create Windows build artifacts
```

## Runtime Data

Desktop data is stored outside the repo:

```powershell
%APPDATA%\Nexus Launcher\library.json
%APPDATA%\Nexus Launcher\ai-memory.json
%APPDATA%\Nexus Launcher\ai-settings.json
```

Generated local import files are ignored:

```powershell
public\library.generated.json
public\app-icons\
release\
dist\
```

## Local Import Pipeline

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\import-local-library.ps1
powershell -ExecutionPolicy Bypass -File .\tools\enrich-library-metadata.ps1
powershell -ExecutionPolicy Bypass -File .\tools\export-app-icons.ps1
powershell -ExecutionPolicy Bypass -File .\tools\dedupe-library.ps1
```

## Native Bridge

Electron exposes a limited `window.nexus` API through `electron/preload.cjs`:

- Load/save local library.
- Open and reveal paths.
- Validate paths.
- Pick executable/folder.
- Chat with configured AI provider.
- Control custom window buttons.

Renderer code should use `src/lib/native.ts` and the typed declarations in `src/types/electron.d.ts`.

## AI Providers

Nexus Copilot supports local-first workflows through LM Studio/Ollama and can be configured for OpenAI-compatible usage. Keep API keys in environment variables or AppData settings, never in Git.

Useful helper scripts:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\use-lm-studio-ai.ps1
powershell -ExecutionPolicy Bypass -File .\tools\install-local-ai.ps1
powershell -ExecutionPolicy Bypass -File .\tools\set-nexus-ai-key.ps1
```

## Repository Rules

Do not commit:

- `.env` or local settings.
- `dist/`, `release/`, installers or portable zips.
- `node_modules/`.
- `public/library.generated.json`.
- `public/app-icons/`.
- AppData files or user-specific generated libraries.
