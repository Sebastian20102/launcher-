# MVP launcher gamer - datos simulados

`mvp-data.js` expone `window.MVP_DATA = {...}` dentro de una IIFE para que pueda cargarse desde una etiqueta `<script>` sin depender de bundlers.

## Estructura principal

- `meta`: version del esquema, sincronizacion y perfil del usuario activo.
- `platforms`: cuentas conectadas para Steam, GOG, Battle.net, Xbox, Epic, Riot y apps locales.
- `games`: biblioteca cruzada con IDs de plataforma, estado de instalacion, rutas, tamanos, tiempo jugado, guardado cloud, favoritos y etiquetas.
- `friends`: presencia social, plataforma principal, juego actual, party abierta y juegos en comun.
- `activity`: feed temporal con sesiones, logros, descargas, sincronizacion cloud y actividad social.
- `downloads`: cola de instalaciones, parches y hotfixes con progreso, velocidad, ETA y prioridad.
- `newsAndEvents`: noticias, rebajas, eventos, temporadas y reclamos por plataforma.
- `achievements`: logros desbloqueados y pendientes con progreso, rareza y puntos.
- `settings`: preferencias simuladas de apariencia, biblioteca, descargas, social, integraciones y privacidad.
- `quickActions`: acciones directas para reanudar juego, unirse a party, pausar descargas y escanear apps locales.

## Convenciones

- Los campos `platformId`, `gameId`, `friendId` y `actorId` permiten cruzar datos entre secciones.
- Las fechas estan en ISO 8601 con zona horaria `-04:00`, coherente con `America/La_Paz`.
- Los assets (`covers/...`, `avatars/...`) son rutas placeholder para prototipado visual.
- Los estados principales previstos son `ready`, `updating`, `queued` y `not_installed` para juegos, y `downloading`, `queued` y `completed` para descargas.
