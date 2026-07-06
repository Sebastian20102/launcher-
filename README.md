# Nexus Launcher

Launcher de escritorio para Windows con biblioteca de juegos, programas, proyectos y herramientas del sistema.

La version principal actual esta en:

```powershell
launcher-21st-ui
```

## Version recomendada

```powershell
cd launcher-21st-ui
npm run desktop
```

Tambien puedes abrir el ejecutable desempaquetado:

```powershell
launcher-21st-ui\release\win-unpacked\Nexus Launcher.exe
```

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Radix / shadcn style components
- Framer Motion
- Electron
- PowerShell importers for local Windows data

## Funciones actuales

- Biblioteca local con juegos, programas, proyectos y sistema.
- Busqueda y filtros.
- Panel de foco con acciones arriba.
- Abrir programas, juegos, carpetas y protocolos como `steam://`.
- Validar rutas.
- Agregar programas o carpetas.
- Persistencia local en AppData.
- Informacion real detectada desde Windows, archivos, accesos directos y Steam.
- Iconos reales extraidos desde ejecutables cuando existen.
- Fallback visual especializado por tipo cuando no hay icono real.
- Odyssey global background y estados animados.

## Datos locales

La app de escritorio guarda su biblioteca aqui:

```powershell
%APPDATA%\Nexus Launcher\library.json
```

Para refrescar programas, datos reales e iconos:

```powershell
cd launcher-21st-ui
powershell -ExecutionPolicy Bypass -File .\tools\import-local-library.ps1
powershell -ExecutionPolicy Bypass -File .\tools\enrich-library-metadata.ps1
powershell -ExecutionPolicy Bypass -File .\tools\export-app-icons.ps1
```

## IA futura

La app todavia no integra IA. La arquitectura queda preparada para agregarla como capa separada: indexacion local, busqueda semantica, resumen de programas/proyectos y acciones asistidas.

