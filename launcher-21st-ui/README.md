# Nexus Launcher UI

Aplicacion principal de Nexus Launcher: una experiencia de escritorio para organizar, buscar y abrir juegos, programas, proyectos y herramientas locales en Windows.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives
- Framer Motion
- Electron

## Desarrollo

```powershell
npm install
npm run dev
```

## Escritorio

```powershell
npm run desktop
```

El ejecutable desempaquetado usado durante desarrollo queda en:

```powershell
release\win-unpacked\Nexus Launcher.exe
```

`release/` no se sube al repo porque es un artefacto generado.

## Datos Locales

La biblioteca real del usuario vive fuera del repo:

```powershell
%APPDATA%\Nexus Launcher\library.json
```

Los datos e iconos generados por importacion local tambien quedan ignorados:

```powershell
public\library.generated.json
public\app-icons\
```

## Scripts Utiles

```powershell
npm run lint
npm run build
powershell -ExecutionPolicy Bypass -File .\tools\import-local-library.ps1
powershell -ExecutionPolicy Bypass -File .\tools\enrich-library-metadata.ps1
powershell -ExecutionPolicy Bypass -File .\tools\export-app-icons.ps1
```

## IA

Nexus Copilot puede funcionar con proveedores locales como LM Studio/Ollama o con OpenAI mediante variables de entorno/local settings. Las claves reales no deben subirse al repo.
