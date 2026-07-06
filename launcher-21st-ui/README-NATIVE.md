# Nexus Launcher Desktop

Esta version convierte la UI React en una app de escritorio con Electron.

## Ejecutar como app instalada/desempaquetada

Abrir:

```powershell
.\release\win-unpacked\Nexus Launcher.exe
```

Desde la carpeta principal del proyecto tambien puedes usar:

```powershell
..\iniciar_nexus_launcher_21st.bat
```

## Ejecutar desde codigo

```powershell
npm run desktop
```

Este comando compila la UI y abre Electron sin servidor local.

## Funciones nativas conectadas

- Cargar y guardar biblioteca en AppData.
- Agregar programas, juegos y carpetas con dialogos nativos.
- Abrir rutas locales.
- Revelar rutas en el explorador.
- Validar si una ruta existe.
- Mantener favoritos y biblioteca persistente.

## Paquete portable

El ZIP portable queda en:

```powershell
.\release\Nexus-Launcher-portable.zip
```

