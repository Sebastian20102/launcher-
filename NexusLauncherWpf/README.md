# Nexus Launcher

Launcher nativo de escritorio para Windows hecho con C# + WPF + .NET.

## Funciones principales

- Biblioteca de juegos, programas, carpetas, URLs y comandos.
- Busqueda global, categorias y vistas de favoritos, recientes, herramientas y revision.
- Agregar, editar, duplicar, eliminar y abrir ubicacion de accesos.
- Perfil rapido para abrir un grupo de accesos.
- Deteccion automatica de accesos de Windows desde Escritorio y Menu Inicio.
- Validacion de rutas rotas.
- Importar/exportar biblioteca JSON.
- Guardado atomico con backups automaticos y backups manuales.
- Iconos reales de ejecutables y visuales personalizados por acceso.
- Design Lab para editar tema, acentos y densidad sin recompilar.
- Atajos: Ctrl+F, Ctrl+N, Ctrl+E, Enter, F5, Delete y Esc.

## Ejecutar en desarrollo

Desde esta carpeta:

```powershell
dotnet run --project .\NexusLauncherWpf.csproj
```

Tambien puedes usar:

```powershell
.\run-wpf.bat
```

## Build rapido

```powershell
dotnet build .\NexusLauncherWpf.csproj
```

## Smoke test

Valida build, archivos clave, JSON local, backups/exports, release y arranque rapido:

```powershell
powershell -ExecutionPolicy Bypass -File .\smoke-test.ps1
```

## Crear release portable

Genera una build portable win-x64 framework-dependent, una carpeta limpia y un ZIP.

Nota: esta variante requiere tener instalado .NET Desktop Runtime 10 en la PC destino, pero genera un release mucho mas liviano.

```powershell
powershell -ExecutionPolicy Bypass -File .\build-release.ps1
```

O usa:

```powershell
.\publish-wpf.bat
```

Salida:

```text
dist\NexusLauncher-win-x64\
dist\NexusLauncher-win-x64.zip
```

El script renombra el ejecutable portable a:

```text
dist\NexusLauncher-win-x64\NexusLauncher.exe
```

## Datos locales

La biblioteca se guarda en:

```text
%APPDATA%\NexusLauncher\launcher-data.json
```

Los exports se guardan en:

```text
%APPDATA%\NexusLauncher\exports\
```

Los backups se guardan en:

```text
%APPDATA%\NexusLauncher\backups\
```

El launcher conserva backups automaticos recientes y puede crear backups manuales desde Ajustes.

Si el archivo de datos no existe, el launcher crea datos demo automaticamente.

## Tema editable

El tema se guarda en:

```text
%APPDATA%\NexusLauncher\theme.json
```

Puedes editarlo manualmente o desde la vista `Design Lab` dentro del launcher.

Campos principales:

```json
{
  "name": "Nexus Gold",
  "background": "#090A0D",
  "surface": "#12151B",
  "accent": "#C8A96A",
  "accent2": "#8F9C8A",
  "density": "Comfortable",
  "animations": true
}
```

Densidades soportadas:

```text
Compact
Comfortable
Spacious
```
