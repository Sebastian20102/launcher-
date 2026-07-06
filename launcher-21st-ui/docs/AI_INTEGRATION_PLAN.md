# AI Integration Plan

Objetivo: integrar IA sin contaminar el nucleo del launcher.

## Principios

- La IA no debe bloquear abrir programas.
- La biblioteca local sigue funcionando offline.
- Los datos privados deben quedarse locales salvo permiso explicito.
- Las acciones de IA deben ser reversibles y visibles.

## Fases

1. Busqueda inteligente local
   - Normalizar nombres, rutas, tags y categorias.
   - Permitir preguntas como "abre mi editor" o "muestra proyectos de React".

2. Asistente de organizacion
   - Sugerir categorias.
   - Detectar duplicados.
   - Recomendar favoritos.

3. Contexto de proyectos
   - Leer metadatos seguros de carpetas.
   - Detectar framework, lenguaje y scripts.
   - Mostrar resumen del proyecto.

4. Acciones asistidas
   - Abrir grupo de apps.
   - Crear perfiles: programar, jugar, grabar, estudiar.
   - Preparar entorno con una sola accion.

## Modulos previstos

- `src/lib/ai/intent-router.ts`
- `src/lib/ai/local-index.ts`
- `src/lib/ai/project-scanner.ts`
- `electron/ai-actions.cjs`

## Seguridad

- Confirmar antes de abrir multiples apps.
- No borrar ni modificar archivos sin confirmacion.
- No enviar rutas privadas a servicios externos por defecto.
