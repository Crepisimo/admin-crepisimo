# Corrección verificada del calendario de ventas — POS y Administrativo

Versión: 2026-11-02 · Corrección del texto `timestamptz::text` de PostgreSQL.

## Problema reproducido

En Supabase, la función SQL `app_registrar_venta` almacena el instante con un `::timestamptz` que convierte a `::text`. PostgreSQL puede devolver textos como `2026-11-02 01:00:00+00`, sin minutos en el indicador de zona horaria. La función previa `fechaCaja` reconocía `Z` o `+00:00`, pero NO `+00`, y por eso cortaba el texto a `2026-11-02` incorrectamente. En Oaxaca ese instante corresponde al 1 de noviembre a las 19:00.

## Correcciones

- `src/corteCaja.mjs` de ambas aplicaciones ahora interpreta `Z`, `+00`, `+0000`, `+00:00`, zonas negativas y microsegundos. Las marcas con zona se convierten explícitamente a `America/Mexico_City`.
- Cadenas históricas SIN zona quedan interpretadas como hora local escrita, sin modificar registros históricos.
- El POS y el admin usan esa misma conversión para el corte, los tickets y el total diario.
- Las etiquetas de hora de los tickets se presentan en el mismo calendario de Oaxaca.
- Las gráficas de 7 días, semanas y meses del POS ya no dependen del calendario UTC del navegador.

## Pruebas disponibles

`prueba_timestamps.mjs` se ejecutó en las zonas horarias UTC, Mexico City, Los Angeles y Auckland y comprobó los casos de los días 1 y 2 de noviembre, descuentos por reembolso y aislamiento por sucursal.

## Instalación

1. Descomprime el ZIP del POS en el repositorio del punto de venta y el del admin en el repositorio administrativo; sustituye los archivos correspondientes.
2. Comprueba los despliegues nuevos de ambos proyectos en Vercel. Recarga las pestañas abiertas y, si están instaladas como PWA, cierra y vuelve a abrir cada app.
3. Selecciona 1 de noviembre de 2026 y comprueba el detalle de tickets y su total para una misma sucursal. Repite con el 2 de noviembre.
4. En el POS, abre el corte y despliega «Ver ventas sumadas»; en el admin, abre «Ver las ventas que forman el total».

**No ejecutar SQL.** Estos archivos no modifican la base de datos, los PIN ni las ventas existentes.

## Limitación de verificación

Se comprobó la sintaxis y el algoritmo usando casos sintéticos. No se validó la compilación completa de Vite ni el total real de Supabase: no hay acceso de consulta a las tablas productivas desde este entorno.
