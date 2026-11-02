# Administrativo Crepísimo — Dashboard con fechas y sumatorias corregidas

## Qué se modificó

- Selector compartido de fecha y sucursal para **Inicio (dashboard)**, **Ventas** y **Compras y gastos**: Hoy, Ayer, Últimos 7 días, Esta semana, Este mes, Mes anterior o Elegir fechas.
- Criterio de fecha único basado en la zona **America/Mexico_City (Oaxaca)**. Las fechas inicial y final están incluidas. ISO con Z se convierte desde UTC; registros antiguos sin zona se interpretan como hora local.
- Dashboard: ventas vigentes (excluidas ventas reembolsadas), gastos registrados (excluidos ajustes de saldo y transferencias internas) y diferencia simple. **La diferencia no es utilidad contable**.
- Tarjetas del dashboard comparan el **mismo periodo**. Clip separa bruto, comisión guardada y neto esperado por fecha de venta, **no por fecha de depósito**.
- Ventas: arreglo del agrupamiento por fecha, exclusión de reembolsos en desgloses y agrupación por todos los métodos de pago, incluida transferencia.
- Compras/gastos: total se obtiene de la suma de todos los gastos registrados del periodo y sucursal; elimina la mezcla de comisiones de marketplace inferidas como si fueran gastos ya asentados.
- Resumen semanal, productos y gráficos: corrección de agrupamiento por fecha y manejo de devoluciones. Un 1 de noviembre ya no se mezcla con otro año.
- Botón **Actualizar datos** para volver a cargar desde Supabase si se registraron ventas después de abrir el administrativo.

## Instalación

1. Conserva una copia del ZIP previo del administrativo.
2. Descomprime el ZIP y reemplaza en el repositorio de GitHub **solo el proyecto administrativo**, no el punto de venta.
3. Confirma que Vercel compile y marque **Ready**.
4. Ingresa como administrador; compara, en el mismo rango y sucursal, la tarjeta Ventas del dashboard contra Ventas, y Egresos contra Compras y gastos.

**No requiere SQL, nuevas tablas ni variables de entorno.** No modifica ventas, gastos ni inventario en Supabase; el cambio se limita a presentación y lógica de reportes.

## Límites importantes

- El reporte no corrige datos históricos incorrectos, ventas sin registrar o gastos mal clasificados.
- Los saldos bancarios de Clip NO están conciliados por este cambio. El neto mostrado es el esperado según comisión y neto guardados; el depósito puede ocurrir otro día.
- La pantalla **Finanzas y Clip** conserva su propio selector de mes y lógica de saldos acumulados, distinta al periodo de Inicio/Ventas/Compras. Esta diferencia se indica en la interfaz.
- Solo se ha comprobado sintaxis JavaScript/JSX y pruebas unitarias simuladas del cálculo y fechas; no se pudo compilar con Vite ni probar contra el Supabase real desde este entorno.
