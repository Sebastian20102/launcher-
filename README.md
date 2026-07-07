# Nexus Launcher

Nexus Launcher is a Windows desktop launcher for organizing local games, programs, projects, folders and tools in one clean command center.

> Alpha software: Nexus Launcher is usable, but still evolving fast.

## Download

The public Windows build is distributed through GitHub Releases:

[Download the latest release](https://github.com/Sebastian20102/launcher-/releases/latest)

Use the installer or portable `.exe` attached to the latest release. Normal users do not need to run a local server.

## Highlights

- Local library for games, apps, projects and folders.
- Real desktop launching through Electron.
- Search, filters, favorites, dock actions and details panel.
- Glass UI with smooth motion and dynamic wallpapers.
- Custom backgrounds: images, GIFs and videos.
- Nexus Copilot with local memory and support for LM Studio, Ollama or OpenAI-compatible setups.
- Clean distribution: every user gets their own local library and AI memory.

## Privacy And Local Data

Nexus Launcher stores user data on each PC, outside the repository:

```text
%APPDATA%\Nexus Launcher\library.json
%APPDATA%\Nexus Launcher\ai-memory.json
%APPDATA%\Nexus Launcher\ai-settings.json
```

The release build does not include the creator's local programs, generated library, icons, AI memory, API keys or AppData files.

## Development

```powershell
cd launcher-21st-ui
npm install
npm run dev
```

Run the desktop app locally:

```powershell
cd launcher-21st-ui
npm run desktop
```

Create Windows release artifacts:

```powershell
cd launcher-21st-ui
npm run dist:win
```

Artifacts are written to `launcher-21st-ui/release/` and should be uploaded to GitHub Releases, not committed to the repo.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives
- Framer Motion
- Electron

## Roadmap

- `v0.2`: notes system, remove test lab, deeper personalization and stronger brand identity.
- `v0.3`: better recognition for executables, images, videos and text files.
- `v0.4`: real usage-time tracking and more accurate app/file metadata.
- `v0.5`: stronger AI assistant with file analysis and library organization abilities.
- `v0.6`: PC analysis, hardware specifications, smarter notifications and desktop panel.
- `v1.0`: fast startup, refined architecture, download website and stable release.

## Repository Hygiene

Do not commit:

- `.env` files or API keys.
- `dist/`, `release/`, installers or portable builds.
- `node_modules/`.
- `public/library.generated.json`.
- `public/app-icons/`.
- AppData files or personal generated libraries.
