import React,{useState,useEffect,useRef} from 'react';
import {fechaCaja,resumenCaja,etiquetaGasto,metodoGasto,ZONA_CAJA,siguienteFechaAutomatica} from './corteCaja.mjs';
import './corteResumenAdmin.css';
const e=React.createElement;
const formato=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n)||0);
const comercios=[['centro','Crepísimo Centro'],['sanantonio','Crepísimo San Antonio'],['amburger','AM-Burgers'],['tichi','Tichi']];
const medios={efectivo:'Efectivo',tarjeta:'Tarjeta',transferencia:'Transferencia',sin_especificar:'Sin especificar',otro:'Otro'};
export default function CorteResumenAdmin({ventas=[],gastos=[],fechaSeleccionada,onFechaSeleccionada}){
  const [tienda,setTienda]=useState('centro');
  const [fechaInterna,setFechaInterna]=useState(fechaCaja(new Date()));
  const fecha=fechaSeleccionada||fechaInterna;
  const setFecha=onFechaSeleccionada||setFechaInterna;
  const hoyRef=useRef(fechaCaja(new Date()));
  useEffect(()=>{
    const revisar=()=>{
      const ahora=fechaCaja(new Date());const anterior=hoyRef.current;
      if(ahora!==anterior){setFecha(selected=>siguienteFechaAutomatica(anterior,selected,ahora));hoyRef.current=ahora;}
    };
    const interval=window.setInterval(revisar,15000);
    window.addEventListener('focus',revisar);document.addEventListener('visibilitychange',revisar);
    return ()=>{window.clearInterval(interval);window.removeEventListener('focus',revisar);document.removeEventListener('visibilitychange',revisar);};
  },[]);
  const [abierto,setAbierto]=useState(false);
  const r=resumenCaja(ventas,gastos,tienda,fecha);
  const fila=(texto,valor)=>e('div',{className:'cra-row',key:texto},e('span',null,texto),e('strong',null,formato(valor)));
  return e('section',{className:'cra', 'aria-label':'Consulta del corte de caja'},
    e('button',{type:'button',className:'cra-toggle',onClick:()=>setAbierto(!abierto),'aria-expanded':abierto},e('span',null,'🧾 Corte por sucursal',e('small',null,'Consulta gastos, cobros y efectivo sin modificar los registros')),e('span',null,abierto?'Ocultar −':'Consultar +')),
    abierto&&e('div',{className:'cra-body'},
      e('div',{className:'cra-filters'},e('label',null,'Sucursal',e('select',{value:tienda,onChange:ev=>setTienda(ev.target.value)},comercios.map(([id,nombre])=>e('option',{value:id,key:id},nombre)))),
        e('label',null,'Fecha (Oaxaca)',e('input',{type:'date',max:fechaCaja(new Date()),value:fecha,onChange:ev=>setFecha(ev.target.value)}))),
      e('div',{className:'cra-summary'},fila('Ventas',r.ventasBrutas),fila('Gastos de caja',r.gastosTotales),fila('Efectivo neto (sin fondo inicial)',r.efectivoNeto)),
      e('div',{className:'cra-cols'},
        e('div',null,e('h4',null,'Ventas por método'),fila('Efectivo',r.efectivoVentas),fila('Transferencias',r.transferencias),fila('Clip bruto',r.clipBruto),fila('Clip comisión estimada',r.clipComision),fila('Clip neto estimado',r.clipNeto),r.otrosMetodos!==0&&fila('Otros / plataformas',r.otrosMetodos)),
        e('div',null,e('h4',null,'Gastos por forma de pago'),fila('Efectivo',r.gastosEnEfectivo),fila('Tarjeta y otros medios',r.gastosConOtroMedio),r.movimientosSinMetodo>0&&fila('Sin método registrado',r.gastosSinMetodo),fila('Total',r.gastosTotales))
      ),
      e('h4',null,`Detalle de gastos (${r.gastos.length})`),
      r.gastos.length?e('div',{className:'cra-list'},r.gastos.slice().sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)).map((g,i)=>e('div',{className:'cra-expense',key:g._dbId||i},
        e('div',null,e('b',null,etiquetaGasto(g)),e('small',null,`${new Intl.DateTimeFormat('es-MX',{timeZone:ZONA_CAJA,hour:'2-digit',minute:'2-digit'}).format(new Date(g.timestamp))} · ${medios[metodoGasto(g)]||'Otro'}`)),e('strong',null,formato(g.monto))
      ))):e('p',{className:'cra-muted'},'Sin gastos de caja para esta fecha y sucursal.'),
      r.movimientosSinMetodo>0&&e('p',{className:'cra-warning'},'Hay gastos sin método registrado. No se restaron del efectivo. Revisa su forma de pago.'),
      e('p',{className:'cra-muted'},'Consulta por fecha de venta, no por fecha de depósito. No sustituye un cierre de turno conciliado con banco ni guarda el efectivo contado.')
    )
  );
}
