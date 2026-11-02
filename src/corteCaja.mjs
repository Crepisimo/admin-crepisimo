/** Cálculos de consulta de caja. No registra un cierre ni altera datos. */
export const ZONA_CAJA = 'America/Mexico_City';
export function fechaCaja(valor){
  if(!valor)return '';
  if(typeof valor==='string'){
    const s=valor.trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
    if(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s)&&!/(Z|[+\-]\d{2}:?\d{2})$/i.test(s))return s.slice(0,10);
  }
  const d=new Date(valor);
  if(!Number.isFinite(d.getTime()))return '';
  const partes=new Intl.DateTimeFormat('en-US',{timeZone:ZONA_CAJA,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const t=x=>partes.find(p=>p.type===x)?.value||'';
  return `${t('year')}-${t('month')}-${t('day')}`;
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
export function resumenCaja(ventas,gastos,tienda,fecha){
  const ventasDia=(ventas||[]).filter(v=>v.tienda===tienda&&fechaCaja(v.timestamp)===fecha&&String(v.estadoPago||v.estado_pago||'').toLowerCase()!=='reembolsado');
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
