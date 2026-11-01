import React, {useState, useEffect} from 'react';

// Identidad interna: el empleado nunca tiene que registrar correo personal.
// La dirección sintética solo es el identificador técnico para Supabase Auth.
export const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ctsijalwjuzmingdxozi.supabase.co';
export const SB_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_LJZo3cGXe7hhzajWSogATw_A8vGfRO7';
const STAFF_DOMAIN = 'personal.crepisimo.example.com';
const STORE = 'crepisimo.auth.session.v2';
let session = null;
let staffProfile = null;
try { session = JSON.parse(sessionStorage.getItem(STORE) || 'null'); } catch (_) {}
let pendingRefresh = null;
export const freshId = () => crypto.randomUUID();
export const getCurrentStaff = () => staffProfile;
export const isAdmin = () => staffProfile?.rol === 'admin';
export function signOut(){ session=null; staffProfile=null; sessionStorage.removeItem(STORE); window.location.reload(); }
export function loginEmail(codigo){
  const clean = String(codigo||'').trim().toLowerCase();
  if(!/^[a-z0-9][a-z0-9_-]{1,23}$/.test(clean))throw new Error('El código debe tener de 2 a 24 letras o números.');
  return `${clean}@${STAFF_DOMAIN}`;
}
async function authRequest(path,data){
  const r=await fetch(`${SB_URL}/auth/v1/${path}`,{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(r.status===400?'Código o clave incorrectos':result.msg||result.error_description||result.message||'No se pudo iniciar sesión');
  return result;
}
export async function signIn(codigo,clave){
  const email=loginEmail(codigo);
  if(!clave || clave.length<8)throw new Error('La clave debe tener al menos 8 caracteres.');
  const s=await authRequest('token?grant_type=password',{email,password:clave});
  session={...s,expires_at:Math.floor(Date.now()/1000)+s.expires_in};
  sessionStorage.setItem(STORE,JSON.stringify(session));
  return session;
}
export async function accessToken(){
  if(!session?.access_token)throw new Error('Sesión no iniciada.');
  if(session.expires_at && session.expires_at>Date.now()/1000+90)return session.access_token;
  if(!pendingRefresh)pendingRefresh=(async()=>{
    const s=await authRequest('token?grant_type=refresh_token',{refresh_token:session.refresh_token});
    session={...s,expires_at:Math.floor(Date.now()/1000)+s.expires_in};
    sessionStorage.setItem(STORE,JSON.stringify(session));return session.access_token;
  })().catch(e=>{session=null;staffProfile=null;sessionStorage.removeItem(STORE);throw e;}).finally(()=>pendingRefresh=null);
  return pendingRefresh;
}
export async function apiFetch(path,method='GET',body,extraHeaders={}){
  const jwt=await accessToken();
  const opts={method,headers:{apikey:SB_KEY,Authorization:`Bearer ${jwt}`,'Content-Type':'application/json',...extraHeaders}};
  if(body!==undefined)opts.body=JSON.stringify(body);
  let r;try{r=await fetch(`${SB_URL}/rest/v1/${path}`,opts);}catch(e){throw new Error('Sin conexión. No se guardó la operación: '+e.message);}
  if(!r.ok){const s=await r.text();let msg=s;try{const j=JSON.parse(s);msg=j.message||j.hint||j.details||s;}catch(_){}throw new Error(msg||`Error ${r.status}`);}
  if(r.status===204)return null;
  const raw=await r.text();if(!raw)return null;
  try{return JSON.parse(raw);}catch(_){return raw;}
}
export const rpc=(fn,params)=>apiFetch(`rpc/${fn}`,'POST',params);
export function AuthGate({children,admin=false}){
  const [profile,setProfile]=useState(null),[ready,setReady]=useState(false),[error,setError]=useState('');
  const [codigo,setCodigo]=useState(''),[clave,setClave]=useState(''),[busy,setBusy]=useState(false);
  async function check(){
    if(!session?.access_token){setReady(true);return;}
    try{
      const p=await apiFetch('app_staff?select=codigo,nombre,rol,tiendas,activo&limit=1');
      if(!p?.[0]?.activo)throw new Error('Este empleado no tiene acceso autorizado.');
      if(admin&&p[0].rol!=='admin')throw new Error('Solo un administrador puede acceder a esta aplicación.');
      staffProfile=p[0];setProfile(p[0]);setError('');
    }catch(e){staffProfile=null;setProfile(null);setError(e.message);}
    finally{setReady(true);}
  }
  useEffect(()=>{check();},[]);
  if(!ready)return React.createElement('div',{style:{padding:40,textAlign:'center'}},'Validando acceso...');
  if(profile)return React.createElement(React.Fragment,null,
    React.createElement('header',{style:{background:'#152b4c',color:'white',padding:'8px 14px',display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',fontFamily:'system-ui',fontSize:13}},
      React.createElement('span',null,`Empleado: ${profile.nombre} · ${profile.codigo} · ${profile.rol==='admin'?'Administrador':'Caja'}`),
      React.createElement('button',{onClick:signOut,style:{padding:'6px 10px',background:'#fff',color:'#152b4c',border:0,borderRadius:8,cursor:'pointer'}},'Cambiar empleado / salir')
    ),children);
  const control={padding:12,border:'1px solid #bbb',borderRadius:8,width:'100%',boxSizing:'border-box'};
  return React.createElement('div',{style:{minHeight:'100vh',background:'#f1f3f7',display:'grid',placeItems:'center',fontFamily:'system-ui'}},
    React.createElement('form',{onSubmit:async e=>{e.preventDefault();setBusy(true);setError('');try{await signIn(codigo,clave);await check();}catch(err){setError(err.message);}finally{setBusy(false);}},style:{background:'#fff',padding:26,borderRadius:16,maxWidth:360,width:'92%',boxShadow:'0 3px 20px #0001'}},
      React.createElement('h2',null,admin?'Acceso administrativo':'Punto de venta'),
      React.createElement('p',{style:{fontSize:13,color:'#555'}},'Entra con tu código personal de empleado y clave. No se requiere correo electrónico.'),
      React.createElement('label',null,'Código de empleado',React.createElement('input',{type:'text',required:true,autoComplete:'username',placeholder:'Ejemplo: CAJA01',value:codigo,onChange:e=>setCodigo(e.target.value),style:control})),
      React.createElement('label',null,'Clave personal (mínimo 8 caracteres)',React.createElement('input',{type:'password',required:true,minLength:8,autoComplete:'current-password',placeholder:'Clave personal',value:clave,onChange:e=>setClave(e.target.value),style:{...control,marginTop:7}})),
      error&&React.createElement('p',{role:'alert',style:{color:'#b91c1c',fontSize:13}},error),
      React.createElement('button',{disabled:busy,type:'submit',style:{marginTop:16,width:'100%',padding:12,border:0,borderRadius:8,background:'#253a6b',color:'#fff',cursor:'pointer'}},busy?'Validando...':'Entrar'),
      session&&React.createElement('button',{type:'button',onClick:signOut,style:{marginTop:10,background:'transparent',border:0,cursor:'pointer'}},'Cerrar sesión anterior')
    )
  );
}
