# Nexus Launcher

Nexus Launcher is a desktop command center for Windows: one place to organize, search, launch and inspect local games, programs, projects and system tools.

It is built as a real desktop app, not a local web page. The current production code lives in `launcher-21st-ui`.

```powershell
cd launcher-21st-ui
npm install
npm run desktop
```

## What It Does

- Indexes local games, programs, projects and system tools.
- Opens real apps, folders and protocols such as `steam://`.
- Keeps a persistent local library in AppData.
- Supports search, filters, favorites, dock actions and a focus/details panel.
- Imports real Windows metadata from files, shortcuts, Steam and local folders.
- Uses extracted app icons when available, with stable fallbacks when icons fail.
- Includes Nexus Copilot, an AI workspace with local memory and launcher-aware actions.

## Desktop First

Nexus Launcher is designed for desktop use:

- Frameless Electron window with custom controls.
- Native file/folder pickers.
- Native path validation and launch actions.
- Local-only user library storage.
- No required localhost server for normal use.

During development, the unpacked executable is generated here:

```powershell
launcher-21st-ui\release\win-unpacked\Nexus Launcher.exe
```

`release/` is ignored because it is generated output.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives
- Framer Motion
- Electron
- PowerShell import tools

## Project Structure

```text
.
+-- launcher-21st-ui/
|   +-- electron/          # Electron main/preload bridge
|   +-- src/               # React app
|   +-- src/components/    # Launcher UI, Copilot, motion surfaces
|   +-- src/lib/           # Library/native helpers
|   +-- tools/             # Local import/enrichment scripts
|   +-- docs/              # Planning and integration notes
+-- README.md
+-- .gitignore
```

## Useful Commands

```powershell
cd launcher-21st-ui
npm run lint
npm run build
npm run desktop
```

Import/enrich local launcher data:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\import-local-library.ps1
powershell -ExecutionPolicy Bypass -File .\tools\enrich-library-metadata.ps1
powershell -ExecutionPolicy Bypass -File .\tools\export-app-icons.ps1
```

## Local Data

User data is intentionally stored outside the repository:

```powershell
%APPDATA%\Nexus Launcher\library.json
%APPDATA%\Nexus Launcher\ai-memory.json
%APPDATA%\Nexus Launcher\ai-settings.json
```

Generated import data and icons are also ignored:

```powershell
launcher-21st-ui\public\library.generated.json
launcher-21st-ui\public\app-icons\
```

## AI

Nexus Copilot can use local providers such as LM Studio/Ollama or an OpenAI-compatible setup. It can answer normally, remember local preferences and trigger launcher actions such as opening apps from the indexed library.

Secrets must stay local. Do not commit API keys, `.env` files, AppData files, generated libraries or icon exports.

## Repository Hygiene

This repository tracks the production Electron/React launcher source only. Build outputs, generated libraries, app icons, local settings, installers and legacy prototypes are excluded from Git.
