/** Cálculos de consulta de caja. No registra un cierre ni altera datos. */
/**
 * Fecha operativa de Oaxaca. Admite tanto ISO 8601 como la salida textual
 * de PostgreSQL timestamptz::text (p. ej. 2026-11-02 01:00:00+00).
 * NUNCA se deduce la zona del navegador para timestamps con offset.
 */
export const ZONA_CAJA = 'America/Mexico_City';

function marcaTemporal(valor){
  if(valor==null || valor==='')return null;
  if(valor instanceof Date){return Number.isFinite(valor.getTime())?{date:valor,fechaLocal:null,horaLocal:null}:null;}
  if(typeof valor==='string'){
    const s=valor.trim();
    const soloFecha=/^\d{4}-\d{2}-\d{2}$/.exec(s);
    if(soloFecha)return {date:null,fechaLocal:s,horaLocal:null};
    const m=/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?)(Z|[+-]\d{2}(?::?\d{2})?)?$/i.exec(s);
    if(m){
      if(!m[3])return {date:null,fechaLocal:m[1],horaLocal:m[2].slice(0,5)};
      let zona=m[3].toUpperCase();
      if(/^[+-]\d{2}$/.test(zona))zona+=':00';
      else if(/^[+-]\d{4}$/.test(zona))zona=zona.slice(0,3)+':'+zona.slice(3);
      const d=new Date(m[1]+'T'+m[2]+zona);
      return Number.isFinite(d.getTime())?{date:d,fechaLocal:null,horaLocal:null}:null;
    }
    // Formato desconocido: no se clasifica usando solo los primeros diez
    // caracteres, pues podría ser una hora UTC del día anterior en Oaxaca.
    const d=new Date(s);
    return Number.isFinite(d.getTime())?{date:d,fechaLocal:null,horaLocal:null}:null;
  }
  const d=new Date(valor);
  return Number.isFinite(d.getTime())?{date:d,fechaLocal:null,horaLocal:null}:null;
}

function partesOaxaca(d,opciones){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:ZONA_CAJA,...opciones}).formatToParts(d);
  const p=(tipo)=>parts.find(x=>x.type===tipo)?.value||'';
  return {year:p('year'),month:p('month'),day:p('day'),hour:p('hour'),minute:p('minute')};
}

export function fechaCaja(valor){
  const t=marcaTemporal(valor);
  if(!t)return '';
  if(t.fechaLocal)return t.fechaLocal;
  const p=partesOaxaca(t.date,{year:'numeric',month:'2-digit',day:'2-digit'});
  return `${p.year}-${p.month}-${p.day}`;
}

export function horaCaja(valor){
  const t=marcaTemporal(valor);
  if(!t)return '--:--';
  if(t.horaLocal)return t.horaLocal;
  if(!t.date)return '--:--';
  const p=partesOaxaca(t.date,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  return `${p.hour}:${p.minute}`;
}

export function fechaHoraCaja(valor){
  const fecha=fechaCaja(valor);
  if(!fecha)return '';
  return `${fecha} ${horaCaja(valor)}`;
}
export const importe=(v)=>{const n=Number(v);return Number.isFinite(n)?n:0;};
const redondear=n=>Math.round((n+Number.EPSILON)*100)/100;
const sumar=(arr,key)=>redondear(arr.reduce((s,x)=>s+importe(typeof key==='function'?key(x):x[key]),0));
export function etiquetaGasto(g){
  if(g.tipo==='insumo')return `Compra: ${g.insumoNombre||g.insumo_nombre||g.desc||'Insumo'}${g.cantidad?' ('+g.cantidad+' '+(g.unidad||'')+')':''}`;
  if(g.tipo==='colaborador')return `Colaborador: ${g.desc||'Pago'}`;
  if(g.tipo==='operativo')return `Operativo: ${g.desc||'Gasto'}`;
  if(g.tipo==='personal')return `Personal: ${g.desc||'Gasto'}`;
  if(g.tipo==='otro')return g.desc||'Otro gasto';
  return g.desc||g.insumoNombre||g.tipo||'Gasto';
}
export function metodoGasto(g){
  const m=String(g.metodoPago??g.metodo_pago??'').trim().toLowerCase();
  if(m==='efectivo')return 'efectivo';
  if(m==='tarjeta_migue'||m==='tarjeta_angel'||m==='clip'||m==='tarjeta')return 'tarjeta';
  if(m==='transferencia')return 'transferencia';
  if(!m)return 'sin_especificar';
  return 'otro';
}
/** Fuente única del filtrado diario. Pedidos y resúmenes usan las mismas ventas. */
export function ventasDeFecha(ventas,tienda,fecha,{incluirReembolsadas=false}={}){
  return (ventas||[]).filter(v=>(!tienda||tienda==='todas'||v.tienda===tienda)
    &&fechaCaja(v.timestamp)===fecha
    &&(incluirReembolsadas||String(v.estadoPago||v.estado_pago||'').toLowerCase()!=='reembolsado'));
}
/** Actualiza la fecha actual tras medianoche sin borrar el día histórico seleccionado. */
export function siguienteFechaAutomatica(anterior,seleccionada,actual){
  return seleccionada===anterior?actual:seleccionada;
}
export function resumenCaja(ventas,gastos,tienda,fecha){
  const ventasDia=ventasDeFecha(ventas,tienda,fecha);
  const gastosDia=(gastos||[]).filter(g=>g.tienda===tienda&&g.seccion==='caja'&&fechaCaja(g.timestamp)===fecha&&g.tipo!=='transf_tarjeta'&&g.tipo!=='ajuste_saldo');
  const porMetodo=(m)=>ventasDia.filter(v=>v.metodo===m);
  const efectivo=porMetodo('efectivo');
  const clip=porMetodo('clip');
  const gastosEfectivo=gastosDia.filter(g=>metodoGasto(g)==='efectivo');
  // Los gastos antiguos sin método se reportan por separado, no se clasifican arbitrariamente.
  const gastosPendientes=gastosDia.filter(g=>metodoGasto(g)==='sin_especificar');
  const netoClip= clip.map(v=>{
    const n=v.netoRecibido??v.neto_recibido;
    return n!==null&&n!==undefined&&n!==''?importe(n):importe(v.total)-importe(v.comisionClip??v.comision_clip);
  });
  const sumaClip=redondear(netoClip.reduce((a,b)=>a+b,0));
  return {
    fecha,tienda,ventas:ventasDia,gastos:gastosDia,
    tickets:ventasDia.length,ventasBrutas:sumar(ventasDia,'total'),
    efectivoVentas:sumar(efectivo,'total'),transferencias:sumar(porMetodo('transferencia'),'total'),
    clipBruto:sumar(clip,'total'),clipNeto:sumaClip,clipComision:redondear(sumar(clip,'total')-sumaClip),
    otrosMetodos:sumar(ventasDia.filter(v=>!['efectivo','transferencia','clip'].includes(v.metodo)),'total'),
    gastosTotales:sumar(gastosDia,'monto'),gastosEnEfectivo:sumar(gastosEfectivo,'monto'),
    gastosSinMetodo:sumar(gastosPendientes,'monto'),
    gastosConOtroMedio:sumar(gastosDia.filter(g=>!['efectivo','sin_especificar'].includes(metodoGasto(g))),'monto'),
    efectivoNeto: redondear(sumar(efectivo,'total')-sumar(gastosEfectivo,'monto')),
    movimientosSinMetodo:gastosPendientes.length
  };
}
