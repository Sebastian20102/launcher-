# Nexus Launcher - Error Log

Este archivo registra errores encontrados durante el rediseño para no repetirlos.

## 2026-07-05

- Error: usar `SkewTransform` para simular 3D en cards.
  - Impacto: la card se deformaba y se sentia como gelatina.
  - Correccion: eliminar `SkewTransform`; usar escala y rotacion minima sin mover layout.

- Error: hacer `Path.Exists` / `File.Exists` desde getters usados por bindings.
  - Impacto: la UI podia congelarse al pintar cards, contar invalidos o cambiar vistas.
  - Correccion: cachear `IsLaunchTargetValid` en `LauncherItemViewModel` y refrescarlo solo en carga, edicion o validacion explicita.

- Error: extraer iconos/artwork sin cache desde `IValueConverter`.
  - Impacto: cambiar de apartado o repintar cards podia repetir trabajo caro sobre archivos `.exe`.
  - Correccion: agregar cache por `CoverImagePath`, `IconPath`, `Path` y modo de imagen.

- Error: usar `ItemsControl + WrapPanel` para muchas cards como si virtualizara.
  - Impacto: WPF crea demasiados elementos visuales si la biblioteca crece.
  - Correccion aplicada: paginacion de cards. Correccion futura: panel virtualizado real o vista compacta virtualizada.

- Error: dejar demasiados destinos principales en el command deck.
  - Impacto: el launcher se sentia como panel administrativo en vez de herramienta rapida.
  - Correccion: dejar destinos principales en Inicio, Biblioteca, Favoritos, Revision y Ajustes.

- Error de herramienta: buscar XAML con comillas y llaves usando `rg` sin `-F` o sin escapar correctamente.
  - Impacto: comandos fallidos y ruido.
  - Correccion: para patrones XAML literales usar `rg -F` o separar busquedas.

- Error de contexto: buscar `ObservableObject.cs` en `ViewModels` cuando vive en `Helpers`.
  - Impacto: perdida de tiempo.
  - Correccion: confirmar ubicaciones con `rg` antes de asumir rutas.
