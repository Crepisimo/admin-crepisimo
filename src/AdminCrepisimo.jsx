import React, { useState, useEffect } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────
var SB_URL="https://ctsijalwjuzmingdxozi.supabase.co";
var SB_KEY="sb_publishable_LJZo3cGXe7hhzajWSogATw_A8vGfRO7";

async function sbGet(table, query){
  var url=SB_URL+"/rest/v1/"+table+(query?"?"+query:"");
  var r=await fetch(url,{headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY}});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}
async function sbPost(table,body){
  var r=await fetch(SB_URL+"/rest/v1/"+table,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(body)});
  if(!r.ok)throw new Error(await r.text());
}
async function sbPatch(table,query,body){
  var r=await fetch(SB_URL+"/rest/v1/"+table+"?"+query,{method:"PATCH",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok)throw new Error(await r.text());
}
async function sbDelete(table,query){
  var r=await fetch(SB_URL+"/rest/v1/"+table+"?"+query,{method:"DELETE",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY}});
  if(!r.ok)throw new Error(await r.text());
}
async function sbRpc(fn,params){
  var r=await fetch(SB_URL+"/rest/v1/rpc/"+fn,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"},body:JSON.stringify(params)});
  if(!r.ok)throw new Error(await r.text());
}
async function updateStockDelta(tienda,deltas){
  for(var i=0;i<deltas.length;i++){
    var d=deltas[i];
    if(!d.id||d.delta===0)continue;
    await sbRpc("update_stock",{p_tienda:tienda,p_insumo_id:d.id,p_delta:d.delta});
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────
var re = React.createElement;
function oz(n){return Math.round(n*30*10000)/10000;}
function pp(n){return Math.round(n*0.33*30*10000)/10000;}
function fmt(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(n||0);}
function fmtC(n,u){return n==null?"—":(Math.round(n*100)/100)+" "+(u||"");}
function fmtFecha(ts){if(!ts)return"";var d=new Date(ts);return d.getDate()+"/"+(d.getMonth()+1)+" "+d.getHours()+":"+(d.getMinutes()<10?"0":"")+d.getMinutes();}
function hoy(){var d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+(d.getDate());}

// ─── COLORS ───────────────────────────────────────────────────────────
var C={
  dark:"#7936AD",
  green:"#E172B3",greenL:"#FFD9EE",
  teal:"#52ABD8",tealL:"#E1F8FF",
  orange:"#D34633",
  red:"#D34633",redL:"#FFDCDC",
  purple:"#7936AD",purpleL:"#EFE3FF",
  indigo:"#52ABD8",indigoL:"#C3E9FC",
  amber:"#EFC42E",amberL:"#FFF2CF",
  white:"#ffffff",slate:"#2E4057",
};
var OV={position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16};
var MD={background:"#fff",borderRadius:18,padding:24,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"};
var LB={fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6};
var IP={width:"100%",padding:"10px 12px",border:"1.5px solid #e0e0e0",borderRadius:10,fontSize:15,boxSizing:"border-box",outline:"none"};
function BS(bg,color,fw){return{background:bg,color:color,border:"none",borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:fw||700,cursor:"pointer",width:"100%"};}
var SC={fontSize:10,fontWeight:800,color:"#aaa",textTransform:"uppercase",letterSpacing:1,marginBottom:10};

// ─── TIENDAS ──────────────────────────────────────────────────────────
var TIENDAS=[
  {id:"centro",nombre:"Crepisimo Centro",emoji:"🏪",color:"#7c3aed"},
  {id:"sanantonio",nombre:"Crepisimo S.Antonio",emoji:"🏬",color:"#7c3aed"},
  {id:"amburger",nombre:"AM-Burger",emoji:"🍔",color:"#ea580c"},
  {id:"tichi",nombre:"Tichi",emoji:"🧪",color:"#059669"},
];
var META_MP=0.32;
var META_MP_AMB=0.42;
var META_MP_TICHI=0.25;

// ─── INSUMOS ──────────────────────────────────────────────────────────
var INSUMOS_INIT=[
  {id:"vaso_18oz",nombre:"Vasos 18oz",unidad:"pza",minimo:250},
  {id:"tapa_domo",nombre:"Tapas domo",unidad:"pza",minimo:250},
  {id:"popote",nombre:"Popotes",unidad:"pza",minimo:250},
  {id:"vaso_carton",nombre:"Vasos de carton",unidad:"pza",minimo:20},
  {id:"tapa_carton",nombre:"Tapas vaso carton",unidad:"pza",minimo:20},
  {id:"caja_crepa",nombre:"Cajas crepa individual",unidad:"pza",minimo:200},
  {id:"papel_alim",nombre:"Papel grado alimenticio",unidad:"pza",minimo:200},
  {id:"bolsa_papel",nombre:"Bolsas de papel",unidad:"pza",minimo:20},
  {id:"servilleta",nombre:"Servilletas",unidad:"pza",minimo:100},
  {id:"leche_deslac",nombre:"Leche deslactosada",unidad:"ml",minimo:4000},
  {id:"leche_vegetal",nombre:"Leche vegetal",unidad:"ml",minimo:960},
  {id:"leche_masa",nombre:"Leche para masa",unidad:"L",minimo:4},
  {id:"crema_lyncott",nombre:"Crema Lyncott",unidad:"g",minimo:300},
  {id:"crema_batida",nombre:"Crema batida",unidad:"g",minimo:500},
  {id:"philadelphia",nombre:"Philadelphia",unidad:"g",minimo:1050},
  {id:"mozzarella",nombre:"Mozzarella",unidad:"g",minimo:400},
  {id:"yogurt",nombre:"Yogurt natural",unidad:"g",minimo:600},
  {id:"cafe_grano",nombre:"Cafe en grano",unidad:"g",minimo:1000},
  {id:"base_neutra",nombre:"Base neutra (frappe)",unidad:"ml",minimo:960},
  {id:"base_cristal",nombre:"Base cristal",unidad:"ml",minimo:960},
  {id:"base_horchata",nombre:"Base de horchata",unidad:"ml",minimo:480},
  {id:"jar_manzana",nombre:"Jarabe manzana verde",unidad:"ml",minimo:480},
  {id:"jar_mora",nombre:"Jarabe mora azul",unidad:"ml",minimo:960},
  {id:"jar_fresa",nombre:"Jarabe de fresa",unidad:"ml",minimo:960},
  {id:"jar_mango",nombre:"Jarabe de mango",unidad:"ml",minimo:480},
  {id:"jar_sandia",nombre:"Jarabe de sandia",unidad:"ml",minimo:480},
  {id:"jar_pina",nombre:"Jarabe de pina",unidad:"ml",minimo:480},
  {id:"jar_chocolate",nombre:"Jarabe de chocolate",unidad:"ml",minimo:480},
  {id:"jar_coco",nombre:"Jarabe de coco",unidad:"ml",minimo:480},
  {id:"jar_banana",nombre:"Jarabe de banana",unidad:"ml",minimo:480},
  {id:"jar_avellana",nombre:"Jarabe de avellana",unidad:"ml",minimo:480},
  {id:"jar_caramelo",nombre:"Jarabe de caramelo",unidad:"ml",minimo:480},
  {id:"jar_limon",nombre:"Jarabe de limon",unidad:"ml",minimo:480},
  {id:"jar_frutos_rojos",nombre:"Jarabe frutos rojos",unidad:"ml",minimo:480},
  {id:"jar_cereza",nombre:"Jarabe de cereza",unidad:"ml",minimo:480},
  {id:"jar_taro",nombre:"Jarabe de taro",unidad:"ml",minimo:480},
  {id:"perlas_manzana",nombre:"Perlas manzana verde",unidad:"g",minimo:600},
  {id:"perlas_mora",nombre:"Perlas mora azul",unidad:"g",minimo:600},
  {id:"perlas_fresa",nombre:"Perlas de fresa",unidad:"g",minimo:600},
  {id:"perlas_mango",nombre:"Perlas de mango",unidad:"g",minimo:600},
  {id:"choc_polvo",nombre:"Chocolate en polvo",unidad:"g",minimo:480},
  {id:"matcha",nombre:"Matcha",unidad:"g",minimo:15},
  {id:"harina",nombre:"Harina",unidad:"g",minimo:760},
  {id:"azucar_masa",nombre:"Azucar para masa",unidad:"g",minimo:240},
  {id:"tisana_frutos",nombre:"Tisana de frutos rojos",unidad:"g",minimo:42},
  {id:"nibs_cacao",nombre:"Nibs de cacao",unidad:"g",minimo:40},
  {id:"fresa",nombre:"Fresa natural",unidad:"g",minimo:500},
  {id:"mango",nombre:"Mango",unidad:"g",minimo:500},
  {id:"platano",nombre:"Platano",unidad:"pza",minimo:2},
  {id:"pina",nombre:"Pina natural",unidad:"g",minimo:500},
  {id:"pina_almibar",nombre:"Pina en almibar",unidad:"pza",minimo:8},
  {id:"durazno_almibar",nombre:"Durazno en almibar",unidad:"pza",minimo:8},
  {id:"oreo",nombre:"Galleta Oreo",unidad:"g",minimo:1000},
  {id:"brownie",nombre:"Brownie",unidad:"g",minimo:300},
  {id:"kinder_delice",nombre:"Kinder Delice",unidad:"pza",minimo:8},
  {id:"gansito",nombre:"Gansito",unidad:"pza",minimo:8},
  {id:"tejate",nombre:"Tejate",unidad:"g",minimo:450},
  {id:"nutella",nombre:"Nutella",unidad:"g",minimo:1000},
  {id:"lechera",nombre:"Lechera",unidad:"g",minimo:200},
  {id:"cajeta",nombre:"Cajeta",unidad:"g",minimo:200},
  {id:"almendra",nombre:"Almendra",unidad:"g",minimo:200},
  {id:"nuez",nombre:"Nuez",unidad:"g",minimo:400},
  {id:"mermelada_fresa",nombre:"Mermelada de fresa",unidad:"g",minimo:200},
  {id:"mermelada_zarza",nombre:"Mermelada de zarzamora",unidad:"g",minimo:200},
  {id:"mermelada_temp",nombre:"Mermelada de temporada",unidad:"g",minimo:200},
  {id:"salsa_chocolate",nombre:"Salsa de chocolate",unidad:"ml",minimo:300},
  {id:"valentina",nombre:"Valentina",unidad:"ml",minimo:300},
  {id:"bufalo",nombre:"Bufalo",unidad:"ml",minimo:300},
  {id:"salsa_tomate",nombre:"Salsa de tomate",unidad:"g",minimo:300},
  {id:"especias_ital",nombre:"Especias italianas",unidad:"g",minimo:20},
  {id:"jamon",nombre:"Jamon",unidad:"g",minimo:200},
  {id:"pepperoni",nombre:"Pepperoni",unidad:"g",minimo:300},
  {id:"champi",nombre:"Champinones",unidad:"g",minimo:90},
  {id:"mant_masa",nombre:"Mantequilla para masa",unidad:"g",minimo:180},
  {id:"liquido_amarillo",nombre:"Liquido amarillo",unidad:"g",minimo:100},
  {id:"agua_mineral",nombre:"Agua mineral",unidad:"ml",minimo:4000},
  {id:"agua_natural",nombre:"Agua natural",unidad:"L",minimo:40},
  {id:"hielo",nombre:"Hielo",unidad:"kg",minimo:10},
  {id:"monk_fruit",nombre:"Monk Fruit",unidad:"sobres",minimo:10},
  {id:"chamoy",nombre:"Chamoy",unidad:"g",minimo:300},
  {id:"tajin",nombre:"Tajin",unidad:"g",minimo:159},
  {id:"coco_rayado",nombre:"Coco rayado",unidad:"g",minimo:10},
  {id:"tapioca",nombre:"Tapioca",unidad:"pza",minimo:5},
];

var MB=[
  {id:"harina",c:760/21},{id:"azucar_masa",c:240/21},
  {id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},
  {id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},
];

var R={
  "Oreo":[{id:"leche_deslac",c:118.3},{id:"oreo",c:59.1},{id:"choc_polvo",c:8.9},{id:"base_neutra",c:29.6},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Mango-Taro":[{id:"leche_deslac",c:118.3},{id:"jar_mango",c:118.3},{id:"mango",c:29.6},{id:"base_neutra",c:29.6},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Chocolate":[{id:"leche_deslac",c:118.3},{id:"choc_polvo",c:44.4},{id:"base_neutra",c:29.6},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Capuchino Regular":[{id:"leche_deslac",c:88.7},{id:"cafe_grano",c:59.1},{id:"base_neutra",c:59.1},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Capuchino Cajeta":[{id:"leche_deslac",c:88.7},{id:"cafe_grano",c:59.1},{id:"base_neutra",c:29.6},{id:"jar_caramelo",c:118.3},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Capuchino Banana":[{id:"leche_deslac",c:88.7},{id:"cafe_grano",c:59.1},{id:"base_neutra",c:29.6},{id:"jar_banana",c:118.3},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Brownie":[{id:"leche_deslac",c:118.3},{id:"brownie",c:73.9},{id:"jar_chocolate",c:59.1},{id:"base_neutra",c:29.6},{id:"choc_polvo",c:14.8},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Moca F":[{id:"leche_deslac",c:88.7},{id:"cafe_grano",c:59.1},{id:"jar_chocolate",c:29.6},{id:"base_neutra",c:38.4},{id:"choc_polvo",c:29.6},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Pina Colada":[{id:"leche_deslac",c:118.3},{id:"jar_pina",c:29.6},{id:"pina",c:29.6},{id:"jar_coco",c:118.3},{id:"base_neutra",c:29.6},{id:"coco_rayado",c:2},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "3 Leches":[{id:"lechera",c:44.4},{id:"cafe_grano",c:44.4},{id:"hielo",c:0.1479},{id:"leche_deslac",c:236.6},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Caramelo":[{id:"hielo",c:0.1479},{id:"leche_deslac",c:266.2},{id:"jar_caramelo",c:88.7},{id:"cafe_grano",c:44.4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Avellana":[{id:"hielo",c:0.1479},{id:"leche_deslac",c:266.2},{id:"jar_avellana",c:88.7},{id:"cafe_grano",c:44.4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Latte Frio":[{id:"cafe_grano",c:44.4},{id:"hielo",c:0.2366},{id:"leche_deslac",c:236.6},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Moca CF":[{id:"cafe_grano",c:44.4},{id:"choc_polvo",c:20.7},{id:"jar_chocolate",c:29.6},{id:"hielo",c:0.1479},{id:"leche_deslac",c:266.2},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Americano":[{id:"cafe_grano",c:59.1},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Espresso":[{id:"cafe_grano",c:59.1},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Capuchino CC":[{id:"cafe_grano",c:44.4},{id:"leche_deslac",c:266.2},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Latte":[{id:"cafe_grano",c:29.6},{id:"leche_deslac",c:266.2},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Moca CC":[{id:"cafe_grano",c:38.4},{id:"choc_polvo",c:29.6},{id:"leche_deslac",c:266.2},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Chocolate CC":[{id:"leche_deslac",c:270},{id:"choc_polvo",c:36},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Latte Sin Azucar":[{id:"leche_vegetal",c:236.6},{id:"monk_fruit",c:1},{id:"cafe_grano",c:44.4},{id:"hielo",c:0.1183},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Fresa Platano":[{id:"yogurt",c:88.7},{id:"leche_deslac",c:29.6},{id:"base_neutra",c:29.6},{id:"fresa",c:59.1},{id:"platano",c:0.5},{id:"jar_fresa",c:29.6},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Mango Durazno":[{id:"yogurt",c:88.7},{id:"leche_deslac",c:29.6},{id:"base_neutra",c:29.6},{id:"mango",c:59.1},{id:"durazno_almibar",c:1},{id:"jar_mango",c:44.4},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Slush Fresa":[{id:"agua_mineral",c:147.9},{id:"base_cristal",c:29.6},{id:"fresa",c:59.1},{id:"jar_fresa",c:147.9},{id:"hielo",c:0.2662},{id:"chamoy",c:20},{id:"tajin",c:4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Slush Mango":[{id:"agua_mineral",c:147.9},{id:"base_cristal",c:29.6},{id:"mango",c:59.1},{id:"jar_mango",c:118.3},{id:"hielo",c:0.2662},{id:"chamoy",c:20},{id:"tajin",c:4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Slush Pina":[{id:"agua_mineral",c:147.9},{id:"base_cristal",c:29.6},{id:"pina",c:59.1},{id:"jar_pina",c:118.3},{id:"hielo",c:0.2662},{id:"chamoy",c:20},{id:"tajin",c:4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Pink Lemonade":[{id:"jar_fresa",c:pp(6)},{id:"perlas_fresa",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Manzana Verde":[{id:"jar_manzana",c:pp(6)},{id:"perlas_manzana",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Mora Azul":[{id:"jar_mora",c:pp(6)},{id:"perlas_mora",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Soda Fresa":[{id:"jar_fresa",c:pp(6)},{id:"perlas_fresa",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Soda Mango":[{id:"jar_mango",c:pp(6)},{id:"perlas_mango",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Soda Frutos Rojos":[{id:"jar_frutos_rojos",c:oz(2)},{id:"hielo",c:0.1774},{id:"perlas_fresa",c:oz(1)},{id:"agua_mineral",c:oz(8)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Sandia":[{id:"jar_sandia",c:pp(6)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Matchata":[{id:"base_horchata",c:oz(2)},{id:"leche_deslac",c:oz(6)},{id:"matcha",c:3},{id:"agua_natural",c:0.03},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Nube Tejate":[{id:"tejate",c:oz(3)},{id:"leche_deslac",c:oz(6)},{id:"hielo",c:0.2957},{id:"base_neutra",c:oz(2)},{id:"nibs_cacao",c:2},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Mango Pop":[{id:"jar_coco",c:pp(4)},{id:"jar_mango",c:pp(1)},{id:"perlas_mango",c:oz(1)},{id:"mango",c:oz(1)},{id:"agua_mineral",c:oz(9)},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Berry Chill":[{id:"tisana_frutos",c:14},{id:"agua_natural",c:0.39},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "DLiss":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"nuez",c:12},{id:"kinder_delice",c:1},{id:"nutella",c:20}]),
  "Ok":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"gansito",c:1},{id:"nutella",c:20}]),
  "Pink L":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"almendra",c:12},{id:"platano",c:0.5},{id:"lechera",c:20}]),
  "Pink C":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"almendra",c:12},{id:"platano",c:0.5},{id:"cajeta",c:20}]),
  "Cake Fresa":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"nuez",c:12},{id:"lechera",c:10},{id:"crema_batida",c:15}]),
  "Cake Durazno":MB.concat([{id:"durazno_almibar",c:1},{id:"philadelphia",c:35},{id:"nuez",c:12},{id:"lechera",c:10},{id:"crema_batida",c:15}]),
  "Chocolatisima":MB.concat([{id:"nutella",c:35},{id:"brownie",c:50},{id:"nuez",c:12},{id:"nutella",c:20}]),
  "Pepperonisima":MB.concat([{id:"philadelphia",c:35},{id:"mozzarella",c:40},{id:"jamon",c:70},{id:"pepperoni",c:50}]),
  "Hawaii":MB.concat([{id:"philadelphia",c:35},{id:"mozzarella",c:40},{id:"jamon",c:70},{id:"pina_almibar",c:1}]),
  "Crepizzima":MB.concat([{id:"mozzarella",c:40},{id:"pepperoni",c:50},{id:"salsa_tomate",c:35},{id:"champi",c:20}]),
  "__crepisima__":MB,
  "Tapioca":[{id:"tapioca",c:1}],
  "DLiss":       [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"nuez",c:12},{id:"kinder_delice",c:1},{id:"nutella",c:20}],
  "Ok":          [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"gansito",c:1},{id:"nutella",c:20}],
  "Pink L":      [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"almendra",c:12},{id:"platano",c:0.5},{id:"lechera",c:20}],
  "Pink C":      [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"almendra",c:12},{id:"platano",c:0.5},{id:"cajeta",c:20}],
  "Cake Fresa":  [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"nuez",c:12},{id:"lechera",c:10},{id:"crema_batida",c:15}],
  "Cake Durazno":[{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"durazno_almibar",c:1},{id:"philadelphia",c:35},{id:"nuez",c:12},{id:"lechera",c:10},{id:"crema_batida",c:15}],
  "Chocolatisima":[{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"nutella",c:35},{id:"brownie",c:50},{id:"nuez",c:12},{id:"nutella",c:20}],
  "Pepperonisima":[{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"philadelphia",c:35},{id:"mozzarella",c:40},{id:"jamon",c:70},{id:"pepperoni",c:50}],
  "Hawaii":      [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"philadelphia",c:35},{id:"mozzarella",c:40},{id:"jamon",c:70},{id:"pina_almibar",c:1}],
  "Crepizzima":  [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"mozzarella",c:40},{id:"pepperoni",c:50},{id:"salsa_tomate",c:35},{id:"champi",c:20}],
};

var MENU=[
  {id:"frappes",nombre:"Frappés",emoji:"🥤",precio:70,tipo:"leche",prods:["Oreo","Mango-Taro","Chocolate","Capuchino Regular","Capuchino Cajeta","Capuchino Banana","Brownie","Moca F","Pina Colada"]},
  {id:"cafe_frio",nombre:"Café Frío",emoji:"🧋",precio:65,tipo:"leche",prods:["3 Leches","Caramelo","Avellana","Moca CF","Latte Frio"]},
  {id:"cafe_cal",nombre:"Café Caliente",emoji:"☕",precio:null,tipo:"leche_sel",prods:[{n:"Americano",p:40,sin:true},{n:"Espresso",p:30,sin:true},{n:"Capuchino CC",p:50},{n:"Latte",p:50},{n:"Moca CC",p:50},{n:"Chocolate CC",p:50}]},
  {id:"latte_sin",nombre:"Latte Sin Azúcar",emoji:"🍵",precio:70,tipo:"simple",prods:["Latte Sin Azucar"]},
  {id:"crepas_d",nombre:"Crepas Dulces",emoji:"🥞",precio:85,tipo:"crepa_fija",prods:[{n:"DLiss",lbl:"D'Liss"},{n:"Ok",lbl:"Ok!"},{n:"Pink",lbl:"Pink",op:["Lechera","Cajeta"],opLbl:"Untable",claves:{"Lechera":"Pink L","Cajeta":"Pink C"}},{n:"Cake",lbl:"Cake",op:["Fresa Natural","Durazno en Almibar"],opLbl:"Relleno",claves:{"Fresa Natural":"Cake Fresa","Durazno en Almibar":"Cake Durazno"}},{n:"Chocolatisima",lbl:"Chocolatísima"}]},
  {id:"crepas_s",nombre:"Crepas Saladas",emoji:"🥙",precio:85,tipo:"crepa_sal",prods:["Pepperonisima","Hawaii","Crepizzima"]},
  {id:"smoothies",nombre:"Smoothies",emoji:"🍓",precio:75,tipo:"simple",prods:["Fresa Platano","Mango Durazno"]},
  {id:"slush",nombre:"Slush",emoji:"🧊",precio:65,tipo:"simple",prods:["Slush Fresa","Slush Mango","Slush Pina"]},
  {id:"sodas",nombre:"Sodas Italianas",emoji:"🫧",precio:45,tipo:"simple",prods:["Pink Lemonade","Manzana Verde","Mora Azul","Soda Fresa","Soda Mango","Sandia","Soda Frutos Rojos"]},
  {id:"temporada",nombre:"Beb. Temporada",emoji:"✨",precio:null,tipo:"variable",prods:[{n:"Matchata",p:95},{n:"Nube Tejate",p:75},{n:"Mango Pop",p:65},{n:"Berry Chill",p:70}]},
  {id:"crepisimas",nombre:"Crepisimas",emoji:"🫔",precio:null,tipo:"builder",prods:[]},
  {id:"extras",nombre:"Extras",emoji:"⭐",precio:null,tipo:"simple",prods:[{n:"Tapioca",lbl:"Tapioca",precio:20}]},
];

// ── AM-BURGER DATA ──────────────────────────────────────
v
var INSUMOS_AMB=[
  {id:"amb_carne",nombre:"Carne angus",unidad:"g",minimo:3000},
  {id:"amb_salchicha",nombre:"Salchicha",unidad:"pza",minimo:10},
  {id:"amb_tocino",nombre:"Tocino",unidad:"g",minimo:1000},
  {id:"amb_pan_parrillero",nombre:"Pan parrillero",unidad:"pza",minimo:20},
  {id:"amb_pan_brioche",nombre:"Pan brioche",unidad:"pza",minimo:12},
  {id:"amb_pan_hotdog",nombre:"Pan hotdog",unidad:"pza",minimo:10},
  {id:"amb_q_americano",nombre:"Queso americano",unidad:"rebanada",minimo:30},
  {id:"amb_q_manchego",nombre:"Queso manchego",unidad:"rebanada",minimo:15},
  {id:"amb_lechuga",nombre:"Lechuga",unidad:"porcion",minimo:20},
  {id:"amb_tomate",nombre:"Tomate",unidad:"g",minimo:500},
  {id:"amb_cebolla",nombre:"Cebolla",unidad:"pza",minimo:5},
  {id:"amb_aguacate",nombre:"Aguacate",unidad:"pza",minimo:4},
  {id:"amb_limon",nombre:"Limon",unidad:"g",minimo:120},
  {id:"amb_pina_almibar",nombre:"Pina en almibar",unidad:"rebanada",minimo:5},
  {id:"amb_chile_jalapeno",nombre:"Chile jalapeno",unidad:"g",minimo:1000},
  {id:"amb_mayonesa",nombre:"Mayonesa",unidad:"g",minimo:500},
  {id:"amb_catsup",nombre:"Catsup",unidad:"g",minimo:300},
  {id:"amb_mostaza",nombre:"Mostaza",unidad:"g",minimo:100},
  {id:"amb_pepinillo",nombre:"Pepinillos",unidad:"g",minimo:200},
  {id:"amb_liq_pepinillo",nombre:"Liquido de pepinillo",unidad:"ml",minimo:50},
  {id:"amb_ajo_polvo",nombre:"Ajo en polvo",unidad:"g",minimo:50},
  {id:"amb_refresco",nombre:"Refresco",unidad:"pza",minimo:5},
  {id:"amb_horchata",nombre:"Agua de horchata",unidad:"pza",minimo:5},
  {id:"amb_jamaica",nombre:"Agua de jamaica",unidad:"pza",minimo:5},
  {id:"amb_agua_bot",nombre:"Agua embotellada",unidad:"pza",minimo:5},
  {id:"amb_papas",nombre:"Papas a la francesa",unidad:"g",minimo:3000},
  {id:"amb_vaso_papas",nombre:"Vaso para papas",unidad:"pza",minimo:25},
  {id:"amb_lemonpepper",nombre:"Lemon pepper",unidad:"g",minimo:100},
  {id:"amb_sal",nombre:"Sal",unidad:"g",minimo:200},
  {id:"amb_aceite",nombre:"Aceite para freir",unidad:"L",minimo:5},
  {id:"amb_mantequilla",nombre:"Mantequilla",unidad:"g",minimo:90},
  {id:"amb_agua_natural",nombre:"Agua natural",unidad:"ml",minimo:300},
  {id:"amb_papel_termico",nombre:"Papel termico",unidad:"pza",minimo:50},
  {id:"amb_bolsa_papel",nombre:"Bolsa de papel",unidad:"pza",minimo:10},
  {id:"amb_guacamole",nombre:"Guacamole",unidad:"g",minimo:500},
  {id:"amb_chicharron_jal",nombre:"Chicharron jalapeño",unidad:"g",minimo:300},
  {id:"amb_cebolla_caramelizada",nombre:"Cebolla caramelizada",unidad:"g",minimo:200},
];
function mkInsumosAmb(){return INSUMOS_AMB.map(function(i){return Object.assign({},i,{stock:0});});}


var INSUMOS_TICHI_MP = [
  {id:"ti_azucar",nombre:"Azucar",unidad:"kg",minimo:25},
  {id:"ti_agua",nombre:"Agua natural",unidad:"L",minimo:20},
  {id:"ti_acido",nombre:"Acido citrico",unidad:"kg",minimo:0.5},
  {id:"ti_benzoato",nombre:"Benzoato de sodio",unidad:"kg",minimo:0.1},
  {id:"ti_leche_polvo",nombre:"Leche en polvo",unidad:"kg",minimo:2},
  {id:"ti_goma",nombre:"Goma xantana",unidad:"kg",minimo:0.5},
  {id:"ti_cocoa",nombre:"Cocoa",unidad:"kg",minimo:0.5},
  {id:"ti_choc_mp",nombre:"Chocolate en polvo MP",unidad:"kg",minimo:1},
  {id:"ti_esencia_horchata",nombre:"Esencia horchata",unidad:"kg",minimo:0.1},
  {id:"ti_color_mora",nombre:"Colorante mora azul",unidad:"g",minimo:30},
  {id:"ti_color_verde",nombre:"Colorante verde neon",unidad:"g",minimo:30},
  {id:"ti_color_rojo",nombre:"Colorante rojo navidad",unidad:"g",minimo:30},
  {id:"ti_sab_mora",nombre:"Concentrado mora azul",unidad:"kg",minimo:0.5},
  {id:"ti_sab_manzana",nombre:"Concentrado manzana verde",unidad:"kg",minimo:0.5},
  {id:"ti_sab_mandarina",nombre:"Concentrado mandarina",unidad:"kg",minimo:0.1},
  {id:"ti_sab_sandia",nombre:"Concentrado sandia",unidad:"kg",minimo:0.1},
  {id:"ti_sab_fresa",nombre:"Concentrado fresa",unidad:"kg",minimo:0.5},
  {id:"ti_sab_frutos",nombre:"Concentrado frutos rojos",unidad:"kg",minimo:0.5},
  {id:"ti_sab_limon",nombre:"Concentrado limon",unidad:"kg",minimo:0.5},
  {id:"ti_sab_naranja",nombre:"Concentrado naranja",unidad:"kg",minimo:0.5},
  {id:"ti_sab_maracuya",nombre:"Concentrado maracuya",unidad:"kg",minimo:0.5},
  {id:"ti_sab_cereza",nombre:"Esencia cereza",unidad:"kg",minimo:0.5},
  {id:"ti_sab_pina",nombre:"Concentrado pina",unidad:"kg",minimo:0.5},
  {id:"ti_sab_mango",nombre:"Concentrado mango",unidad:"kg",minimo:0.5},
  {id:"ti_sab_banana",nombre:"Concentrado banana",unidad:"kg",minimo:0.5},
  {id:"ti_sab_taro",nombre:"Concentrado taro",unidad:"kg",minimo:0.1},
  {id:"ti_sab_vainilla",nombre:"Concentrado vainilla",unidad:"kg",minimo:0.5},
  {id:"ti_sab_choc_j",nombre:"Concentrado chocolate cafe",unidad:"kg",minimo:0.5},
  {id:"ti_sab_cajeta",nombre:"Concentrado cajeta",unidad:"kg",minimo:0.5},
  {id:"ti_sab_coco",nombre:"Concentrado coco",unidad:"kg",minimo:0.5},
  {id:"ti_sab_avellana",nombre:"Concentrado avellana",unidad:"kg",minimo:0.5},
  {id:"ti_botella",nombre:"Botella con tapa",unidad:"pza",minimo:25},
  {id:"ti_bolsa",nombre:"Bolsa empaque",unidad:"pza",minimo:10},
  {id:"ti_etiqueta_bot",nombre:"Etiqueta botella",unidad:"pza",minimo:25},
  {id:"ti_etiqueta_bol",nombre:"Etiqueta bolsa",unidad:"pza",minimo:10},
  {id:"ti_sal",nombre:"Sal",unidad:"kg",minimo:0.1},
  {id:"ti_albumina",nombre:"Albumina",unidad:"kg",minimo:0.1},
  {id:"ti_polvo_hornear",nombre:"Polvo para hornear",unidad:"kg",minimo:0.1},
];

// Producto terminado en inventario
var INSUMOS_TICHI_PT = [
  {id:"ti_pt_mora",nombre:"Jarabe Mora Azul (L)",unidad:"L",minimo:5},
  {id:"ti_pt_manzana",nombre:"Jarabe Manzana Verde (L)",unidad:"L",minimo:5},
  {id:"ti_pt_mandarina",nombre:"Jarabe Mandarina (L)",unidad:"L",minimo:5},
  {id:"ti_pt_sandia",nombre:"Jarabe Sandia (L)",unidad:"L",minimo:5},
  {id:"ti_pt_fresa",nombre:"Jarabe Fresa (L)",unidad:"L",minimo:5},
  {id:"ti_pt_frutos",nombre:"Jarabe Frutos Rojos (L)",unidad:"L",minimo:5},
  {id:"ti_pt_limon",nombre:"Jarabe Limon (L)",unidad:"L",minimo:5},
  {id:"ti_pt_naranja",nombre:"Jarabe Naranja (L)",unidad:"L",minimo:5},
  {id:"ti_pt_maracuya",nombre:"Jarabe Maracuya (L)",unidad:"L",minimo:5},
  {id:"ti_pt_cereza",nombre:"Jarabe Cereza (L)",unidad:"L",minimo:5},
  {id:"ti_pt_pina",nombre:"Jarabe Pina (L)",unidad:"L",minimo:5},
  {id:"ti_pt_mango",nombre:"Jarabe Mango (L)",unidad:"L",minimo:5},
  {id:"ti_pt_banana",nombre:"Jarabe Banana (L)",unidad:"L",minimo:5},
  {id:"ti_pt_taro",nombre:"Jarabe Taro (L)",unidad:"L",minimo:5},
  {id:"ti_pt_vainilla",nombre:"Jarabe Vainilla (L)",unidad:"L",minimo:5},
  {id:"ti_pt_choc_j",nombre:"Jarabe Chocolate cafe (L)",unidad:"L",minimo:5},
  {id:"ti_pt_cajeta",nombre:"Jarabe Cajeta (L)",unidad:"L",minimo:5},
  {id:"ti_pt_coco",nombre:"Jarabe Coco (L)",unidad:"L",minimo:5},
  {id:"ti_pt_avellana",nombre:"Jarabe Avellana (L)",unidad:"L",minimo:5},
  {id:"ti_pt_base_neutra",nombre:"Base Neutra 1kg",unidad:"bolsa",minimo:5},
  {id:"ti_pt_base_crystal",nombre:"Base Crystal 1kg",unidad:"bolsa",minimo:5},
  {id:"ti_pt_base_horchata",nombre:"Base Horchata 1kg",unidad:"bolsa",minimo:5},
  {id:"ti_pt_choc_polvo",nombre:"Chocolate en polvo 1kg",unidad:"bolsa",minimo:5},
  {id:"ti_pt_azucar_masa",nombre:"Azucar para masa 240g",unidad:"bolsa",minimo:5},
];

// ─── RECETAS BASE ─────────────────────────────────────────────────────
var MB=[
  {id:"harina",c:760/21},{id:"azucar_masa",c:240/21},
  {id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},
  {id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},
];


var R={
  "Oreo":[{id:"leche_deslac",c:118.3},{id:"oreo",c:59.1},{id:"choc_polvo",c:8.9},{id:"base_neutra",c:29.6},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Mango-Taro":[{id:"leche_deslac",c:118.3},{id:"jar_mango",c:118.3},{id:"mango",c:29.6},{id:"base_neutra",c:29.6},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Chocolate":[{id:"leche_deslac",c:118.3},{id:"choc_polvo",c:44.4},{id:"base_neutra",c:29.6},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Capuchino Regular":[{id:"leche_deslac",c:88.7},{id:"cafe_grano",c:59.1},{id:"base_neutra",c:59.1},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Capuchino Cajeta":[{id:"leche_deslac",c:88.7},{id:"cafe_grano",c:59.1},{id:"base_neutra",c:29.6},{id:"jar_caramelo",c:118.3},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Capuchino Banana":[{id:"leche_deslac",c:88.7},{id:"cafe_grano",c:59.1},{id:"base_neutra",c:29.6},{id:"jar_banana",c:118.3},{id:"hielo",c:0.2957},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Brownie":[{id:"leche_deslac",c:118.3},{id:"brownie",c:73.9},{id:"jar_chocolate",c:59.1},{id:"base_neutra",c:29.6},{id:"choc_polvo",c:14.8},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Moca F":[{id:"leche_deslac",c:88.7},{id:"cafe_grano",c:59.1},{id:"jar_chocolate",c:29.6},{id:"base_neutra",c:38.4},{id:"choc_polvo",c:29.6},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Pina Colada":[{id:"leche_deslac",c:118.3},{id:"jar_pina",c:29.6},{id:"pina",c:29.6},{id:"jar_coco",c:118.3},{id:"base_neutra",c:29.6},{id:"coco_rayado",c:2},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "3 Leches":[{id:"lechera",c:44.4},{id:"cafe_grano",c:44.4},{id:"hielo",c:0.1479},{id:"leche_deslac",c:236.6},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Caramelo":[{id:"hielo",c:0.1479},{id:"leche_deslac",c:266.2},{id:"jar_caramelo",c:88.7},{id:"cafe_grano",c:44.4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Avellana":[{id:"hielo",c:0.1479},{id:"leche_deslac",c:266.2},{id:"jar_avellana",c:88.7},{id:"cafe_grano",c:44.4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Latte Frio":[{id:"cafe_grano",c:44.4},{id:"hielo",c:0.2366},{id:"leche_deslac",c:236.6},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Moca CF":[{id:"cafe_grano",c:44.4},{id:"choc_polvo",c:20.7},{id:"jar_chocolate",c:29.6},{id:"hielo",c:0.1479},{id:"leche_deslac",c:266.2},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Americano":[{id:"cafe_grano",c:59.1},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Espresso":[{id:"cafe_grano",c:59.1},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Capuchino CC":[{id:"cafe_grano",c:44.4},{id:"leche_deslac",c:266.2},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Latte":[{id:"cafe_grano",c:29.6},{id:"leche_deslac",c:266.2},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Moca CC":[{id:"cafe_grano",c:38.4},{id:"choc_polvo",c:29.6},{id:"leche_deslac",c:266.2},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Chocolate CC":[{id:"leche_deslac",c:270},{id:"choc_polvo",c:36},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Latte Sin Azucar":[{id:"leche_vegetal",c:236.6},{id:"monk_fruit",c:1},{id:"cafe_grano",c:44.4},{id:"hielo",c:0.1183},{id:"vaso_carton",c:1},{id:"tapa_carton",c:1}],
  "Fresa Platano":[{id:"yogurt",c:88.7},{id:"leche_deslac",c:29.6},{id:"base_neutra",c:29.6},{id:"fresa",c:59.1},{id:"platano",c:0.5},{id:"jar_fresa",c:29.6},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Mango Durazno":[{id:"yogurt",c:88.7},{id:"leche_deslac",c:29.6},{id:"base_neutra",c:29.6},{id:"mango",c:59.1},{id:"durazno_almibar",c:1},{id:"jar_mango",c:44.4},{id:"hielo",c:0.2662},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Slush Fresa":[{id:"agua_mineral",c:147.9},{id:"base_cristal",c:29.6},{id:"fresa",c:59.1},{id:"jar_fresa",c:147.9},{id:"hielo",c:0.2662},{id:"chamoy",c:20},{id:"tajin",c:4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Slush Mango":[{id:"agua_mineral",c:147.9},{id:"base_cristal",c:29.6},{id:"mango",c:59.1},{id:"jar_mango",c:118.3},{id:"hielo",c:0.2662},{id:"chamoy",c:20},{id:"tajin",c:4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Slush Pina":[{id:"agua_mineral",c:147.9},{id:"base_cristal",c:29.6},{id:"pina",c:59.1},{id:"jar_pina",c:118.3},{id:"hielo",c:0.2662},{id:"chamoy",c:20},{id:"tajin",c:4},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Pink Lemonade":[{id:"jar_fresa",c:pp(6)},{id:"perlas_fresa",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Manzana Verde":[{id:"jar_manzana",c:pp(6)},{id:"perlas_manzana",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Mora Azul":[{id:"jar_mora",c:pp(6)},{id:"perlas_mora",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Soda Fresa":[{id:"jar_fresa",c:pp(6)},{id:"perlas_fresa",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Soda Mango":[{id:"jar_mango",c:pp(6)},{id:"perlas_mango",c:oz(1)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Soda Frutos Rojos":[{id:"jar_frutos_rojos",c:oz(2)},{id:"hielo",c:0.1774},{id:"perlas_fresa",c:oz(1)},{id:"agua_mineral",c:oz(8)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Sandia":[{id:"jar_sandia",c:pp(6)},{id:"agua_mineral",c:oz(10)},{id:"hielo",c:0.1774},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Matchata":[{id:"base_horchata",c:oz(2)},{id:"leche_deslac",c:oz(6)},{id:"matcha",c:3},{id:"agua_natural",c:0.03},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Nube Tejate":[{id:"tejate",c:oz(3)},{id:"leche_deslac",c:oz(6)},{id:"hielo",c:0.2957},{id:"base_neutra",c:oz(2)},{id:"nibs_cacao",c:2},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Mango Pop":[{id:"jar_coco",c:pp(4)},{id:"jar_mango",c:pp(1)},{id:"perlas_mango",c:oz(1)},{id:"mango",c:oz(1)},{id:"agua_mineral",c:oz(9)},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "Berry Chill":[{id:"tisana_frutos",c:14},{id:"agua_natural",c:0.39},{id:"vaso_18oz",c:1},{id:"tapa_domo",c:1},{id:"popote",c:1}],
  "DLiss":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"nuez",c:12},{id:"kinder_delice",c:1},{id:"nutella",c:20}]),
  "Ok":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"gansito",c:1},{id:"nutella",c:20}]),
  "Pink L":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"almendra",c:12},{id:"platano",c:0.5},{id:"lechera",c:20}]),
  "Pink C":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"almendra",c:12},{id:"platano",c:0.5},{id:"cajeta",c:20}]),
  "Cake Fresa":MB.concat([{id:"philadelphia",c:35},{id:"fresa",c:55},{id:"nuez",c:12},{id:"lechera",c:10},{id:"crema_batida",c:15}]),
  "Cake Durazno":MB.concat([{id:"durazno_almibar",c:1},{id:"philadelphia",c:35},{id:"nuez",c:12},{id:"lechera",c:10},{id:"crema_batida",c:15}]),
  "Chocolatisima":MB.concat([{id:"nutella",c:35},{id:"brownie",c:50},{id:"nuez",c:12},{id:"nutella",c:20}]),
  "Pepperonisima":MB.concat([{id:"philadelphia",c:35},{id:"mozzarella",c:40},{id:"jamon",c:70},{id:"pepperoni",c:50}]),
  "Hawaii":MB.concat([{id:"philadelphia",c:35},{id:"mozzarella",c:40},{id:"jamon",c:70},{id:"pina_almibar",c:1}]),
  "Crepizzima":MB.concat([{id:"mozzarella",c:40},{id:"pepperoni",c:50},{id:"salsa_tomate",c:35},{id:"champi",c:20}]),
  "__crepisima__":MB,
  "Tapioca":[{id:"tapioca",c:1}],
  "DLiss":       [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"nuez",c:12},{id:"kinder_delice",c:1},{id:"nutella",c:20}],
  "Ok":          [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"gansito",c:1},{id:"nutella",c:20}],
  "Pink L":      [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"almendra",c:12},{id:"platano",c:0.5},{id:"lechera",c:20}],
  "Pink C":      [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"almendra",c:12},{id:"platano",c:0.5},{id:"cajeta",c:20}],
  "Cake Fresa":  [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"fresa",c:55},{id:"philadelphia",c:35},{id:"nuez",c:12},{id:"lechera",c:10},{id:"crema_batida",c:15}],
  "Cake Durazno":[{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"durazno_almibar",c:1},{id:"philadelphia",c:35},{id:"nuez",c:12},{id:"lechera",c:10},{id:"crema_batida",c:15}],
  "Chocolatisima":[{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"nutella",c:35},{id:"brownie",c:50},{id:"nuez",c:12},{id:"nutella",c:20}],
  "Pepperonisima":[{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"philadelphia",c:35},{id:"mozzarella",c:40},{id:"jamon",c:70},{id:"pepperoni",c:50}],
  "Hawaii":      [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"philadelphia",c:35},{id:"mozzarella",c:40},{id:"jamon",c:70},{id:"pina_almibar",c:1}],
  "Crepizzima":  [{id:"harina",c:760/21},{id:"azucar_masa",c:240/21},{id:"leche_masa",c:2/21},{id:"mant_masa",c:90/21},{id:"liquido_amarillo",c:20/21},{id:"caja_crepa",c:1},{id:"papel_alim",c:1},{id:"mozzarella",c:40},{id:"pepperoni",c:50},{id:"salsa_tomate",c:35},{id:"champi",c:20}],
}
var R_AMB={
  "Chaoo":BP.concat([{id:"amb_q_americano",c:1},{id:"amb_q_manchego",c:1},{id:"amb_chile_jalapeno",c:50},{id:"amb_lechuga",c:1}]).concat(GU).concat([{id:"amb_papel_termico",c:1}]),
  "Patrona":BP.concat(AD).concat([{id:"amb_q_americano",c:1},{id:"amb_tocino",c:50},{id:"amb_salchicha",c:0.5},{id:"amb_tomate",c:66},{id:"amb_lechuga",c:1}]).concat([{id:"amb_papel_termico",c:1}]),
  "Piniazo":BP.concat(AD).concat([{id:"amb_q_americano",c:1},{id:"amb_pina_almibar",c:1},{id:"amb_cebolla",c:0.25},{id:"amb_lechuga",c:1}]).concat([{id:"amb_papel_termico",c:1}]),
  "Light":BP.concat(AD).concat([{id:"amb_q_americano",c:1},{id:"amb_tomate",c:66},{id:"amb_lechuga",c:1}]).concat([{id:"amb_papel_termico",c:1}]),
  "Pica Pica":BB.concat(AD).concat([{id:"amb_q_americano",c:1},{id:"amb_tocino",c:50},{id:"amb_chile_jalapeno",c:50}]).concat([{id:"amb_papel_termico",c:1}]),
  "Caramel":BB.concat([{id:"amb_q_americano",c:1},{id:"amb_tocino",c:50},{id:"amb_cebolla",c:0.15}]).concat([{id:"amb_papel_termico",c:1}]),
  "Que Eso":BB.concat([{id:"amb_q_manchego",c:1},{id:"amb_q_americano",c:1},{id:"amb_tocino",c:50}]).concat([{id:"amb_papel_termico",c:1}]),
  "Mega":[{id:"amb_pan_hotdog",c:1},{id:"amb_salchicha",c:1},{id:"amb_chile_jalapeno",c:50},{id:"amb_tocino",c:50},{id:"amb_tomate",c:66},{id:"amb_cebolla",c:0.15}].concat(GU).concat([{id:"amb_papel_termico",c:1}]),
  "Jochis":[{id:"amb_pan_hotdog",c:1},{id:"amb_salchicha",c:1},{id:"amb_q_manchego",c:1},{id:"amb_tocino",c:50},{id:"amb_tomate",c:66},{id:"amb_cebolla",c:0.15},{id:"amb_papel_termico",c:1}],
  "Plano":[{id:"amb_pan_hotdog",c:1},{id:"amb_salchicha",c:1},{id:"amb_tomate",c:66},{id:"amb_cebolla",c:0.15},{id:"amb_papel_termico",c:1}],
  "Papas":PP,
  "Bebida":[{id:"amb_refresco",c:1}],
  "Horchata":[{id:"amb_horchata",c:1}],
  "Jamaica":[{id:"amb_jamaica",c:1}],
  "Agua Bot":[{id:"amb_agua_bot",c:1}],
  "Extra Queso":    [{id:"amb_q_americano",c:1}],
  "Extra Tocino":   [{id:"amb_tocino",c:50}],
  "Extra Carne":    [{id:"amb_carne",c:100}],
  "Extra Guacamole":[{id:"amb_aguacate",c:0.08},{id:"amb_limon",c:2.4}]
}

var MENU_AMB=[
  {id:"hamburguesas",nombre:"Hamburguesas",emoji:"🍔",precio:null,tipo:"amb_burg",
   prods:[
     {n:"Chaoo",p:115},{n:"Patrona",p:120},{n:"Piniazo",lbl:"Piñazo",p:120},
     {n:"Light",p:99},{n:"Pica Pica",p:115},{n:"Caramel",p:110},{n:"Que Eso",lbl:"+Que Eso",p:115},
   ]},
  {id:"hotdogs",nombre:"Hot Dogs",emoji:"🌭",precio:null,tipo:"amb_hd",
   prods:[{n:"Mega",p:65},{n:"Jochis",p:70},{n:"Plano",p:55}]},
  {id:"papas",nombre:"Orden Papas Fritas",emoji:"🍟",precio:30,tipo:"amb_simple",
   prods:["Papas"]},
  {id:"bebidas",nombre:"Bebidas",emoji:"🥤",precio:30,tipo:"amb_beb",
   prods:[{n:"Bebida",lbl:"Refresco",rk:"Bebida"},{n:"Horchata",lbl:"Horchata",rk:"Horchata"},{n:"Jamaica",lbl:"Jamaica",rk:"Jamaica"},{n:"Agua Bot",lbl:"Agua Embotellada",rk:"Agua Bot"}]},
];

var EXTRAS_AMB=[
  {n:"Extra Queso Americano",precio:15,rec:[{id:"amb_q_americano",c:1}]},
  {n:"Extra Queso Manchego",precio:15,rec:[{id:"amb_q_manchego",c:1}]},
  {n:"Extra Tocino",precio:15,rec:[{id:"amb_tocino",c:50}]},
  {n:"Extra Carne",precio:40,rec:[{id:"amb_carne",c:100}]},
  {n:"Extra Guacamole",precio:20,rec:GU},
];

var PROMOS_AMB=[
  {id:"combo_simple",nombre:"Combo +Papas +Bebida",emoji:"🍟",tipo:"amb_combo_simple"},
  {id:"combo_2x2",nombre:"Combo 2en2 - $229",emoji:"2️⃣",tipo:"amb_combo_2x2"},
  {id:"combo_todo",nombre:"Pa Toderrimos - $499",emoji:"🎉",tipo:"amb_combo_todo"},
];

var PROMOS=[
  {id:"promo_cafe",nombre:"Lunes: 2x1 Cafes Calientes",emoji:"☕",tipo:"2x1_cafe"},
  {id:"promo_sodas",nombre:"Martes: 2 Sodas por $79",emoji:"🫧",tipo:"2sodas"},
  {id:"promo_cap",nombre:"Miercoles: 2 Capuchinos por $99",emoji:"🥤",tipo:"2capuchinos"},
  {id:"promo_crepas",nombre:"Jueves: 2 Crepisimas por $95",emoji:"🥞",tipo:"2crepisimas"},
  {id:"promo_combo",nombre:"Combo Amiguisimo $115",emoji:"🎉",tipo:"combo_amiguisimo"},
];

var CAFES_CAL=["Americano","Espresso","Capuchino CC","Latte","Moca CC","Chocolate CC"];
var PRECIOS_CAFE={"Americano":40,"Espresso":30,"Capuchino CC":50,"Latte":50,"Moca CC":50,"Chocolate CC":50};
var CAPUCHINOS=["Capuchino Regular","Capuchino Cajeta","Capuchino Banana"];
var SODAS_LIST=["Pink Lemonade","Manzana Verde","Mora Azul","Soda Fresa","Soda Mango","Sandia"];
var CREPAS_FIJAS_D=[{n:"DLiss",lbl:"D'Liss"},{n:"Ok",lbl:"Ok!"},{n:"Pink",lbl:"Pink",op:["Lechera","Cajeta"],opLbl:"Untable",claves:{"Lechera":"Pink L","Cajeta":"Pink C"}},{n:"Cake",lbl:"Cake",op:["Fresa Natural","Durazno en Almibar"],opLbl:"Relleno",claves:{"Fresa Natural":"Cake Fresa","Durazno en Almibar":"Cake Durazno"}},{n:"Chocolatisima",lbl:"Chocolatísima"}];
var CREPAS_FIJAS_S=[{n:"Pepperonisima",lbl:"Pepperonísima"},{n:"Hawaii",lbl:"Hawaii"},{n:"Crepizzima",lbl:"Crepizzíma"}];

var CD_UNTABLE_MP={"Merm. Fresa":{id:"mermelada_fresa",c:35},
  "Merm. Zarzamora":{id:"mermelada_zarza",c:35},
  "Merm. Temporada":{id:"mermelada_temp",c:35},
  "Nutella":{id:"nutella",c:35},
  "Philadelphia":{id:"philadelphia",c:35}};
var CD_RELLENO_MP={"Fresa Natural":{id:"fresa",c:55},
  "Platano":{id:"platano",c:0.5},
  "Pina en Almibar":{id:"pina_almibar",c:1},
  "Kinder Delice":{id:"kinder_delice",c:1},
  "Gansito":{id:"gansito",c:1},
  "Galleta Oreo":{id:"oreo",c:50},
  "Durazno en Almibar":{id:"durazno_almibar",c:1},
  "Jamon":{id:"jamon",c:70},
  "Pepperoni":{id:"pepperoni",c:50},
  "Mozzarella":{id:"mozzarella",c:40},
  "Champinones":{id:"champi",c:20}};
var CD_TOPPING_MP={"Salsa Chocolate":{id:"salsa_chocolate",c:20},
  "Nutella":{id:"nutella",c:20},
  "Crema Batida":{id:"crema_batida",c:20},
  "Cajeta":{id:"cajeta",c:20},
  "Lechera":{id:"lechera",c:20},
  "Nuez":{id:"nuez",c:12},
  "Almendra":{id:"almendra",c:12},
  "Costra Queso":{id:"mozzarella",c:40},
  "Salsa Picante":{id:"valentina",c:30}};

var CD={
  masas:["Dulce","Neutra"],
  untables:["Merm. Fresa","Merm. Zarzamora","Merm. Temporada","Nutella","Philadelphia"],
  rellenos:["Fresa Natural","Platano","Pina en Almibar","Kinder Delice","Gansito","Galleta Oreo","Durazno en Almibar","Jamon","Pepperoni","Mozzarella","Champinones"],
  toppings:["Salsa Chocolate","Nutella","Crema Batida","Cajeta","Lechera","Nuez","Almendra","Costra Queso","Salsa Picante"],
};


var TI_BASE_SODA_L = [{id:"ti_azucar",c:0.800},{id:"ti_agua",c:0.480},{id:"ti_acido",c:0.01648},{id:"ti_benzoato",c:0.001}];
var TI_BASE_CAFE_L = [{id:"ti_azucar",c:0.800},{id:"ti_agua",c:0.480},{id:"ti_benzoato",c:0.001}];
var TI_PACK_BOT = [{id:"ti_botella",c:1},{id:"ti_etiqueta_bot",c:1}];
var TI_PACK_BOL = [{id:"ti_bolsa",c:1},{id:"ti_etiqueta_bol",c:1}];

// Recetas por litro = base + sabor + color + empaque
var

R_TICHI_PROD = {
  "ti_pt_mora":    TI_BASE_SODA_L.concat([{id:"ti_sab_mora",c:0.033},{id:"ti_color_mora",c:1}]).concat(TI_PACK_BOT),
  "ti_pt_manzana": TI_BASE_SODA_L.concat([{id:"ti_sab_manzana",c:0.033},{id:"ti_color_verde",c:1}]).concat(TI_PACK_BOT),
  "ti_pt_mandarina":TI_BASE_SODA_L.concat([{id:"ti_sab_mandarina",c:0.030}]).concat(TI_PACK_BOT),
  "ti_pt_sandia":  TI_BASE_SODA_L.concat([{id:"ti_sab_sandia",c:0.030}]).concat(TI_PACK_BOT),
  "ti_pt_fresa":   TI_BASE_SODA_L.concat([{id:"ti_sab_fresa",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_frutos":  TI_BASE_SODA_L.concat([{id:"ti_sab_frutos",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_limon":   TI_BASE_SODA_L.concat([{id:"ti_sab_limon",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_naranja": TI_BASE_SODA_L.concat([{id:"ti_sab_naranja",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_maracuya":TI_BASE_SODA_L.concat([{id:"ti_sab_maracuya",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_cereza":  TI_BASE_SODA_L.concat([{id:"ti_sab_cereza",c:0.045},{id:"ti_color_rojo",c:1}]).concat(TI_PACK_BOT),
  "ti_pt_pina":    TI_BASE_SODA_L.concat([{id:"ti_sab_pina",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_mango":   TI_BASE_SODA_L.concat([{id:"ti_sab_mango",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_banana":  TI_BASE_CAFE_L.concat([{id:"ti_sab_banana",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_taro":    TI_BASE_CAFE_L.concat([{id:"ti_sab_taro",c:0.030}]).concat(TI_PACK_BOT),
  "ti_pt_vainilla":TI_BASE_CAFE_L.concat([{id:"ti_sab_vainilla",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_choc_j":  TI_BASE_CAFE_L.concat([{id:"ti_sab_choc_j",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_cajeta":  TI_BASE_CAFE_L.concat([{id:"ti_sab_cajeta",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_coco":    TI_BASE_CAFE_L.concat([{id:"ti_sab_coco",c:0.033}]).concat(TI_PACK_BOT),
  "ti_pt_avellana":TI_BASE_CAFE_L.concat([{id:"ti_sab_avellana",c:0.033}]).concat(TI_PACK_BOT),
  // Bases y chocolate: receta por bolsa de produccion
  "ti_pt_base_neutra":  [{id:"ti_azucar",c:0.600},{id:"ti_leche_polvo",c:0.385},{id:"ti_goma",c:0.015}].concat(TI_PACK_BOL),
  "ti_pt_base_crystal": [{id:"ti_azucar",c:0.970},{id:"ti_goma",c:0.030}].concat(TI_PACK_BOL),
  "ti_pt_base_horchata":[{id:"ti_esencia_horchata",c:0.030},{id:"ti_azucar",c:0.585},{id:"ti_leche_polvo",c:0.370},{id:"ti_goma",c:0.015}].concat(TI_PACK_BOL),
  "ti_pt_choc_polvo":   [{id:"ti_cocoa",c:0.130},{id:"ti_choc_mp",c:0.870}].concat(TI_PACK_BOL),
  "ti_pt_azucar_masa":  [{id:"ti_azucar",c:0.2285},{id:"ti_sal",c:0.0035},{id:"ti_albumina",c:0.009},{id:"ti_polvo_hornear",c:0.003},{id:"ti_goma",c:0.004},{id:"ti_bolsa",c:1}],
};


// ─── MODAL EGRESO ─────────────────────────────────────────────────────
function ModalEgreso(props){
  var onSave=props.onSave,onClose=props.onClose;
  var insumosPorTienda=props.insumosPorTienda||{};
  var sV=useState({tipo:"",rubro:"",tienda:"",metodoPago:"",desc:"",monto:"",insumoId:"",cantidad:"",busqueda:"",err:""});
  var gv=sV[0];var setV=sV[1];
  function upd(k,val){setV(function(p){var n={};for(var x in p)n[x]=p[x];n[k]=val;return n;});}

  // Paso 1: tipo de egreso
  // Paso 2: detalles segun tipo

  var TIPOS=[
    {id:"mp_con_inv",lbl:"🧺 Compra MP + Inventario",desc:"Suma al inventario y registra el gasto"},
    {id:"mp_sin_inv",lbl:"📦 Compra MP sin inventario",desc:"Solo registra el gasto de MP"},
    {id:"personal",lbl:"💼 Gasto personal/operativo",desc:"Colaboradores, operativo, personal A&M, otros"},
  ];

  var RUBROS_PERSONAL=[
    {id:"colaborador",lbl:"👤 Colaborador"},
    {id:"operativo",lbl:"⚙️ Operativo"},
    {id:"personal",lbl:"👫 Personal A&M"},
    {id:"otro",lbl:"💸 Otro"},
  ];

  var METODOS=[
    {id:"efectivo",lbl:"💵 Efectivo"},
    {id:"tarjeta_migue",lbl:"💳 T. Migue"},
    {id:"tarjeta_angel",lbl:"💳 T. Angel"},
  ];

  var insumosTienda=gv.tienda?((insumosPorTienda[gv.tienda])||[]):[];
  var insFil=gv.busqueda?insumosTienda.filter(function(i){return i.nombre.toLowerCase().indexOf(v.busqueda.toLowerCase())>=0;}):insumosTienda;
  var insSel=insumosTienda.find(function(i){return i.id===gv.insumoId;})||null;

  async function guardar(){
    if(!gv.tipo){upd("err","Selecciona el tipo de egreso");return;}
    if(!gv.tienda&&gv.tipo!=="personal"){upd("err","Selecciona la tienda");return;}
    if(!gv.metodoPago){upd("err","Selecciona el método de pago");return;}
    if(!gv.monto||parseFloat(v.monto)<=0){upd("err","Ingresa el monto");return;}
    if(gv.tipo==="mp_con_inv"&&!gv.insumoId){upd("err","Selecciona el insumo");return;}
    if(gv.tipo==="mp_con_inv"&&(!gv.cantidad||parseFloat(v.cantidad)<=0)){upd("err","Ingresa la cantidad");return;}
    if(gv.tipo==="personal"&&!gv.rubro){upd("err","Selecciona el rubro");return;}

    var tiendaFinal=gv.tienda||"global";
    var cant=gv.tipo==="mp_con_inv"?parseFloat(v.cantidad):0;
    var gasto={
      seccion:"externo",
      tipo:gv.tipo==="mp_con_inv"||gv.tipo==="mp_sin_inv"?"insumo":gv.rubro,
      insumoId:gv.tipo==="mp_con_inv"?gv.insumoId:gv.tipo==="mp_sin_inv"?"mp_sin_especificar":null,
      insumoNombre:gv.tipo==="mp_con_inv"?(insSel?insSel.nombre:""):gv.tipo==="mp_sin_inv"?"Materia Prima (sin especificar)":null,
      cantidad:cant,
      unidad:gv.tipo==="mp_con_inv"&&insSel?insSel.unidad:"",
      monto:parseFloat(v.monto),
      metodoPago:gv.metodoPago,
      desc:gv.desc||"",
      tienda:tiendaFinal,
      timestamp:new Date().toISOString(),
    };
    // If mp_con_inv, update inventory delta
    if(gv.tipo==="mp_con_inv"&&gv.insumoId&&cant>0){
      try{await updateStockDelta(tiendaFinal,[{id:gv.insumoId,delta:cant}]);}
      catch(e){console.error("Stock delta error:",e);}
    }
    onSave(gasto);
    onClose();
  }

  return re("div",{style:OV},re("div",{style:Object.assign({},MD,{maxHeight:"92vh"})},
    re("div",{style:{fontSize:18,fontWeight:900,color:C.dark,marginBottom:16}},"➕ Registrar Egreso"),

    // Tipo
    re("div",{style:{marginBottom:14}},
      re("div",{style:LB},"Tipo de egreso *"),
      re("div",{style:{display:"flex",flexDirection:"column",gap:8}},
        TIPOS.map(function(t){
          var sel=gv.tipo===t.id;
          return re("button",{key:t.id,type:"button",onClick:function(){upd("tipo",t.id);},
            style:{padding:"12px 14px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:12,
              cursor:"pointer",textAlign:"left",background:sel?C.dark:"#fafafa",color:sel?"#fff":"#333"}},
            re("div",{style:{fontWeight:700,fontSize:14}},t.lbl),
            re("div",{style:{fontSize:11,opacity:0.7,marginTop:2}},t.desc)
          );
        })
      )
    ),

    // Tienda (siempre, excepto para gastos personales que van a "global")
    gv.tipo?re("div",{style:{marginBottom:14}},
      re("div",{style:LB},gv.tipo==="personal"?"Tienda (opcional)":"Tienda *"),
      re("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}},
        (gv.tipo==="personal"?[{id:"global",nombre:"Global",emoji:"🌐"}].concat(TIENDAS):TIENDAS).map(function(t){
          var sel=gv.tienda===t.id;
          return re("button",{key:t.id,type:"button",onClick:function(){upd("tienda",t.id);upd("insumoId","");upd("busqueda","");},
            style:{padding:"9px 8px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:10,
              cursor:"pointer",fontWeight:sel?800:500,background:sel?C.dark:"#fff",
              color:sel?"#fff":"#555",fontSize:12,textAlign:"center"}},
            t.emoji+" "+t.nombre
          );
        })
      )
    ):null,

    // Rubro (solo para gastos personales)
    gv.tipo==="personal"?re("div",{style:{marginBottom:14}},
      re("div",{style:LB},"Rubro *"),
      re("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},
        RUBROS_PERSONAL.map(function(r){
          var sel=gv.rubro===r.id;
          return re("button",{key:r.id,type:"button",onClick:function(){upd("rubro",r.id);},
            style:{padding:"10px 8px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:10,
              cursor:"pointer",fontWeight:sel?800:500,background:sel?C.dark:"#fff",
              color:sel?"#fff":"#555",fontSize:13,textAlign:"center"}},r.lbl
          );
        })
      )
    ):null,

    // Insumo selector (solo para mp_con_inv)
    gv.tipo==="mp_con_inv"?re("div",{style:{marginBottom:14}},
      re("div",{style:LB},"Insumo *"),
      re("input",{type:"text",placeholder:"Buscar insumo...",value:gv.busqueda,
        onChange:function(e){upd("busqueda",e.target.value);upd("insumoId","");},style:IP}),
      gv.busqueda&&insFil.length>0?re("div",{style:{border:"1.5px solid #e0e0e0",borderRadius:10,maxHeight:180,overflowY:"auto",marginTop:4}},
        insFil.slice(0,20).map(function(ins){
          return re("div",{key:ins.id,onClick:function(){upd("insumoId",ins.id);upd("busqueda",ins.nombre);},
            style:{padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid #f5f5f5",
              background:gv.insumoId===ins.id?"#f3e8ff":"#fff",fontSize:13}},
            ins.nombre+" ("+ins.unidad+")"
          );
        })
      ):null,
      gv.tipo==="mp_con_inv"&&insSel?re("div",{style:{marginTop:8}},
        re("div",{style:LB},"Cantidad ("+insSel.unidad+") *"),
        re("input",{type:"number",placeholder:"0",value:gv.cantidad,onChange:function(e){upd("cantidad",e.target.value);},style:IP})
      ):null
    ):null,

    // Método de pago
    gv.tipo?re("div",{style:{marginBottom:14}},
      re("div",{style:LB},"Pago con *"),
      re("div",{style:{display:"flex",gap:8}},
        METODOS.map(function(m){
          var sel=gv.metodoPago===m.id;
          return re("button",{key:m.id,type:"button",onClick:function(){upd("metodoPago",m.id);},
            style:{flex:1,padding:"10px 6px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:10,
              cursor:"pointer",fontWeight:sel?800:500,background:sel?C.dark:"#fff",
              color:sel?"#fff":"#555",fontSize:12,textAlign:"center"}},m.lbl
          );
        })
      )
    ):null,

    // Descripción
    gv.tipo?re("div",{style:{marginBottom:14}},
      re("div",{style:LB},"Descripción (opcional)"),
      re("input",{type:"text",placeholder:"Descripción...",value:gv.desc,onChange:function(e){upd("desc",e.target.value);},style:IP})
    ):null,

    // Monto
    gv.tipo?re("div",{style:{marginBottom:14}},
      re("div",{style:LB},"Monto ($) *"),
      re("input",{type:"number",placeholder:"0.00",value:gv.monto,onChange:function(e){upd("monto",e.target.value);},
        style:Object.assign({},IP,{fontSize:22,fontWeight:700})})
    ):null,

    gv.err?re("div",{style:{color:C.red,fontSize:13,marginBottom:10,fontWeight:600}},v.err):null,

    re("div",{style:{display:"flex",gap:10,marginTop:4}},
      re("button",{type:"button",onClick:onClose,style:BS("#f0f0f0","#666")},"Cancelar"),
      gv.tipo?re("button",{type:"button",onClick:guardar,style:BS(C.dark,"#fff",2)},"Registrar Egreso"):null
    )
  ));
}


// ─── INVENTARIO ADMIN ─────────────────────────────────────────────────
function InventarioAdmin(props){
  var datos=props.datos||{};
  var onDeltaUpdate=props.onDeltaUpdate;
  var sTienda=useState("centro");var tienda=sTienda[0];var setTienda=sTienda[1];
  var sFil=useState("");var fil=sFil[0];var setFil=sFil[1];
  var sCat=useState("todos");var cat=sCat[0];var setCat=sCat[1];
  var sEdit=useState(null);var editIns=sEdit[0];var setEditIns=sEdit[1];
  var sVal=useState("");var editVal=sVal[0];var setEditVal=sVal[1];
  var sMode=useState("sumar");var editMode=sMode[0];var setEditMode=sMode[1];
  var sPrecio=useState("");var editPrecio=sPrecio[0];var setEditPrecio=sPrecio[1];
  var sCant=useState("");var editCantPaq=sCant[0];var setEditCantPaq=sCant[1];

  // Get insumos for selected tienda
  var insumos=datos[tienda]||[];
  var bajos=insumos.filter(function(i){return (i.stock||0)>0&&(i.stock||0)<=i.minimo;});
  var agotados=insumos.filter(function(i){return (i.stock||0)===0;});

  // Filter
  var cats=["todos","bajos","agotados"];
  var insFil=insumos.filter(function(i){
    if(cat==="bajos")return (i.stock||0)>0&&(i.stock||0)<=i.minimo;
    if(cat==="agotados")return (i.stock||0)===0;
    return true;
  }).filter(function(i){
    return !fil||i.nombre.toLowerCase().indexOf(fil.toLowerCase())>=0;
  });

  return re("div",{style:{padding:"0 0 40px"}},
    // Tienda tabs
    re("div",{style:{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}},
      TIENDAS.map(function(t){
        var sel=tienda===t.id;
        return re("button",{key:t.id,onClick:function(){setTienda(t.id);setFil("");setCat("todos");},
          style:{padding:"8px 14px",border:"2px solid "+(sel?t.color:"#e0e0e0"),borderRadius:20,
            cursor:"pointer",fontWeight:sel?800:500,background:sel?t.color:"#fff",
            color:sel?"#fff":"#555",fontSize:12}},
          t.emoji+" "+t.nombre
        );
      })
    ),

    // Stats
    re("div",{style:{display:"flex",gap:8,marginBottom:14}},
      re("div",{style:{flex:1,background:agotados.length>0?"#ffebee":"#f0fdf4",borderRadius:12,padding:"10px 14px",textAlign:"center"}},
        re("div",{style:{fontSize:22,fontWeight:900,color:agotados.length>0?C.red:C.green}},agotados.length),
        re("div",{style:{fontSize:11,color:"#888"}},"Agotados")
      ),
      re("div",{style:{flex:1,background:bajos.length>0?"#fff8e1":"#f0fdf4",borderRadius:12,padding:"10px 14px",textAlign:"center"}},
        re("div",{style:{fontSize:22,fontWeight:900,color:bajos.length>0?C.amber:C.green}},bajos.length),
        re("div",{style:{fontSize:11,color:"#888"}},"Stock bajo")
      ),
      re("div",{style:{flex:1,background:"#f8f8f8",borderRadius:12,padding:"10px 14px",textAlign:"center"}},
        re("div",{style:{fontSize:22,fontWeight:900,color:C.dark}},insumos.length),
        re("div",{style:{fontSize:11,color:"#888"}},"Total insumos")
      )
    ),

    // Search and filter
    re("div",{style:{display:"flex",gap:8,marginBottom:12}},
      re("input",{type:"text",placeholder:"Buscar insumo...",value:fil,onChange:function(e){setFil(e.target.value);},
        style:Object.assign({},IP,{flex:1})}),
      re("select",{value:cat,onChange:function(e){setCat(e.target.value);},
        style:{padding:"10px 12px",border:"1.5px solid #e0e0e0",borderRadius:10,fontSize:13,background:"#fff"}},
        re("option",{value:"todos"},"Todos"),
        re("option",{value:"bajos"},"Stock bajo"),
        re("option",{value:"agotados"},"Agotados")
      )
    ),

    // Insumos list
    re("div",{style:{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      insFil.length===0?re("div",{style:{padding:24,textAlign:"center",color:"#bbb"}},"Sin insumos"):
      insFil.map(function(ins,i){
        var stock=ins.stock||0;
        var isAgot=stock===0;
        var isBajo=stock>0&&stock<=ins.minimo;
        return re("div",{key:ins.id,
          onClick:function(){setEditIns(ins);setEditVal("");setEditMode("sumar");setEditPrecio("");setEditCantPaq("");},
          style:{display:"flex",alignItems:"center",padding:"12px 16px",cursor:"pointer",
            borderBottom:i<insFil.length-1?"1px solid #f5f5f5":"none",
            background:isAgot?"#fff5f5":isBajo?"#fffdf0":"#fff"}},
          re("div",{style:{flex:1}},
            re("div",{style:{fontSize:14,fontWeight:600,color:isAgot?C.red:isBajo?C.amber:C.dark}},ins.nombre),
            re("div",{style:{fontSize:11,color:"#aaa",marginTop:2}},ins.unidad+
              (ins.costoPorU?" · $"+ins.costoPorU.toFixed(4)+"/"+ins.unidad:""))
          ),
          re("div",{style:{textAlign:"right"}},
            re("div",{style:{fontSize:16,fontWeight:800,color:isAgot?C.red:isBajo?C.amber:C.green}},
              Math.round(stock*1000)/1000
            ),
            re("div",{style:{fontSize:10,color:"#bbb"}},"min: "+ins.minimo)
          )
        );
      })
    ),

    // Edit modal
    editIns?re("div",{style:OV},re("div",{style:MD},
      re("div",{style:{fontSize:17,fontWeight:900,color:C.dark,marginBottom:4}},editIns.nombre),
      re("div",{style:{fontSize:13,color:"#888",marginBottom:16}},"Stock actual: "+(Math.round((editIns.stock||0)*1000)/1000)+" "+editIns.unidad),

      re("div",{style:{display:"flex",gap:8,marginBottom:12}},
        ["sumar","restar","fijar"].map(function(m){
          var sel=editMode===m;
          var lbl=m==="sumar"?"+ Sumar":m==="restar"?"- Restar":"= Fijar";
          return re("button",{key:m,type:"button",onClick:function(){setEditMode(m);},
            style:{flex:1,padding:"9px 4px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:9,
              cursor:"pointer",fontWeight:sel?800:500,background:sel?C.dark:"#fff",
              color:sel?"#fff":"#888",fontSize:12}},lbl);
        })
      ),

      re("div",{style:{marginBottom:12}},
        re("div",{style:LB},"Cantidad ("+editIns.unidad+")"),
        re("input",{type:"number",placeholder:"0",value:editVal,onChange:function(e){setEditVal(e.target.value);},
          style:Object.assign({},IP,{fontSize:20,fontWeight:700})})
      ),

      re("div",{style:{height:1,background:"#f0f0f0",margin:"12px 0"}}),
      re("div",{style:{fontSize:12,fontWeight:700,color:C.dark,marginBottom:8}},"💰 Precio de compra"),
      re("div",{style:{display:"flex",gap:8,marginBottom:8}},
        re("div",{style:{flex:1}},
          re("div",{style:LB},"Precio paquete ($)"),
          re("input",{type:"number",placeholder:"0.00",value:editPrecio,onChange:function(e){setEditPrecio(e.target.value);},style:IP})
        ),
        re("div",{style:{flex:1}},
          re("div",{style:LB},"Cantidad paquete ("+editIns.unidad+")"),
          re("input",{type:"number",placeholder:"1",value:editCantPaq,onChange:function(e){setEditCantPaq(e.target.value);},style:IP})
        )
      ),
      editPrecio&&editCantPaq&&parseFloat(editPrecio)>0&&parseFloat(editCantPaq)>0?
        re("div",{style:{background:"#f0fdf4",borderRadius:8,padding:"8px 12px",fontSize:12,color:C.green,fontWeight:700,marginBottom:12}},
          "Costo por "+editIns.unidad+": $"+(parseFloat(editPrecio)/parseFloat(editCantPaq)).toFixed(4)):
      editIns.costoPorU?re("div",{style:{background:"#f5f5f5",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#555",marginBottom:12}},
          "Costo actual: $"+editIns.costoPorU.toFixed(4)+"/"+editIns.unidad):null,

      re("div",{style:{display:"flex",gap:10}},
        re("button",{type:"button",onClick:function(){setEditIns(null);setEditVal("");},style:BS("#f0f0f0","#666")},"Cancelar"),
        re("button",{type:"button",onClick:async function(){
          if(!editVal||isNaN(editVal)||parseFloat(editVal)<0)return;
          var val=parseFloat(editVal);
          var stock=editIns.stock||0;
          var nuevo=editMode==="sumar"?stock+val:editMode==="restar"?Math.max(0,stock-val):val;
          var delta=nuevo-stock;
          var costoPorU=editPrecio&&editCantPaq&&parseFloat(editPrecio)>0&&parseFloat(editCantPaq)>0?
            parseFloat(editPrecio)/parseFloat(editCantPaq):editIns.costoPorU;
          await updateStockDelta(tienda,[{id:editIns.id,delta:delta}]);
          if(onDeltaUpdate)onDeltaUpdate(tienda,editIns.id,nuevo,costoPorU);
          setEditIns(null);setEditVal("");setEditPrecio("");setEditCantPaq("");
        },style:BS(C.dark,"#fff",2)},"Guardar")
      )
    )):null
  );
}


// ─── VENTAS POR TIENDA ────────────────────────────────────────────────
function VentasTienda(props){
  var ventas=props.ventas||[];
  var tiendaId=props.tiendaId;
  var sPeriodo=useState("hoy");var periodo=sPeriodo[0];var setPeriodo=sPeriodo[1];
  var sFini=useState("");var fechaIni=sFini[0];var setFechaIni=sFini[1];
  var sFfin=useState("");var fechaFin=sFfin[0];var setFechaFin=sFfin[1];
  var sTab=useState("resumen");var tab=sTab[0];var setTab=sTab[1];

  function hoyStr(){var d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+d.getDate();}
  function getRango(){
    var h=hoyStr();
    if(periodo==="hoy")return{ini:h,fin:h};
    if(periodo==="semana"){var d=new Date();var lun=new Date(d);lun.setDate(d.getDate()-((d.getDay()+6)%7));return{ini:lun.toISOString().split("T")[0],fin:h};}
    if(periodo==="mes"){var d2=new Date();return{ini:d2.getFullYear()+"-"+(d2.getMonth()+1<10?"0":"")+(d2.getMonth()+1)+"-01",fin:h};}
    if(periodo==="custom"&&fechaIni&&fechaFin)return{ini:fechaIni,fin:fechaFin};
    return{ini:h,fin:h};
  }
  var rango=getRango();
  function enRango(ts){
    if(!ts)return false;
    var d=new Date(ts);
    var ld=d.getFullYear()+"-"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+(d.getDate());
    return ld>=rango.ini&&ld<=rango.fin;
  }

  var ventasFil=ventas.filter(function(v){
    return (tiendaId==="todas"||v.tienda===tiendaId)&&enRango(v.timestamp);
  });

  var tv=ventasFil.reduce(function(s,v){return s+v.total;},0);
  var numVentas=ventasFil.length;

  // Ventas por producto
  var prodCount={};
  ventasFil.forEach(function(v){
    (v.items||[]).forEach(function(item){
      if(item.precio<0||item.esDescuento)return;
      var n=(item.nombre||"").replace(" (empleado)","").replace(" (promo)","").trim();
      if(!prodCount[n])prodCount[n]={nombre:n,qty:0,total:0};
      prodCount[n].qty++;
      prodCount[n].total+=item.precio||0;
    });
  });
  var prods=Object.values(prodCount).sort(function(a,b){return b.qty-a.qty;});

  // Ventas por dia
  var porDia={};
  ventasFil.forEach(function(v){
    var d=new Date(v.timestamp);
    var key=d.getFullYear()+"-"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+(d.getDate());
    if(!porDia[key])porDia[key]={fecha:key,total:0,count:0};
    porDia[key].total+=v.total;
    porDia[key].count++;
  });
  var diasArr=Object.values(porDia).sort(function(a,b){return b.fecha.localeCompare(a.fecha);});

  // Metodos de pago
  var porMetodo={efectivo:0,clip:0,didi:0,mercadolibre:0};
  ventasFil.forEach(function(v){
    var m=v.metodo||"efectivo";
    if(m==="efectivo")porMetodo.efectivo+=v.total;
    else if(m==="clip")porMetodo.clip+=v.total;
    else if(m==="didi")porMetodo.didi+=v.total;
    else if(m==="mercadolibre")porMetodo.mercadolibre+=v.total;
  });

  return re("div",null,
    // Period selector
    re("div",{style:{background:"#fff",borderRadius:14,padding:14,marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      re("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:periodo==="custom"?12:0}},
        [["hoy","Hoy"],["semana","Semana"],["mes","Este mes"],["custom","Personalizado"]].map(function(p){
          var sel=periodo===p[0];
          return re("button",{key:p[0],onClick:function(){setPeriodo(p[0]);},
            style:{padding:"7px 12px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:20,
              cursor:"pointer",fontWeight:sel?800:500,background:sel?C.dark:"#fff",
              color:sel?"#fff":"#555",fontSize:12}},p[1]);
        })
      ),
      periodo==="custom"?re("div",{style:{display:"flex",gap:8}},
        re("input",{type:"date",value:fechaIni,onChange:function(e){setFechaIni(e.target.value);},style:Object.assign({},IP,{flex:1})}),
        re("input",{type:"date",value:fechaFin,onChange:function(e){setFechaFin(e.target.value);},style:Object.assign({},IP,{flex:1})})
      ):null
    ),

    // KPIs
    re("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}},
      re("div",{style:{background:"#fff",borderRadius:14,padding:14,boxShadow:"0 1px 6px rgba(0,0,0,.08)",textAlign:"center"}},
        re("div",{style:{fontSize:22,fontWeight:900,color:C.green}},fmt(tv)),
        re("div",{style:{fontSize:11,color:"#888"}},"Ventas totales")
      ),
      re("div",{style:{background:"#fff",borderRadius:14,padding:14,boxShadow:"0 1px 6px rgba(0,0,0,.08)",textAlign:"center"}},
        re("div",{style:{fontSize:22,fontWeight:900,color:C.dark}},numVentas),
        re("div",{style:{fontSize:11,color:"#888"}},"Transacciones")
      ),
      re("div",{style:{background:"#fff",borderRadius:14,padding:14,boxShadow:"0 1px 6px rgba(0,0,0,.08)",textAlign:"center"}},
        re("div",{style:{fontSize:22,fontWeight:900,color:C.teal}},numVentas>0?fmt(tv/numVentas):"$0"),
        re("div",{style:{fontSize:11,color:"#888"}},"Ticket promedio")
      )
    ),

    // Tabs
    re("div",{style:{display:"flex",gap:4,marginBottom:14,background:"#f5f5f5",borderRadius:12,padding:4}},
      [["resumen","Resumen"],["productos","Por producto"],["dias","Por día"],["metodos","Métodos pago"]].map(function(t){
        var sel=tab===t[0];
        return re("button",{key:t[0],onClick:function(){setTab(t[0]);},
          style:{flex:1,padding:"8px 4px",border:"none",borderRadius:9,cursor:"pointer",
            fontWeight:sel?800:500,background:sel?"#fff":"transparent",
            color:sel?C.dark:"#888",fontSize:11}},t[1]);
      })
    ),

    // Tab content
    tab==="resumen"?re("div",{style:{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      re("div",{style:SC},"Métodos de pago"),
      [["Efectivo",porMetodo.efectivo],["Clip",porMetodo.clip],["Didi",porMetodo.didi],["Mercado Libre",porMetodo.mercadolibre]].map(function(m,i){
        if(m[1]===0)return null;
        return re("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f5f5f5"}},
          re("span",{style:{fontSize:13,color:"#555"}},m[0]),
          re("span",{style:{fontSize:13,fontWeight:700,color:C.green}},fmt(m[1]))
        );
      })
    ):null,

    tab==="productos"?re("div",{style:{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      prods.length===0?re("div",{style:{textAlign:"center",color:"#bbb",padding:20}},"Sin ventas"):
      re("div",null,
        re("div",{style:{display:"grid",gridTemplateColumns:"1fr 50px 80px",gap:"6px 10px",marginBottom:8,paddingBottom:6,borderBottom:"2px solid #f0f0f0"}},
          re("div",{style:{fontSize:10,fontWeight:800,color:"#aaa",textTransform:"uppercase"}},"Producto"),
          re("div",{style:{fontSize:10,fontWeight:800,color:"#aaa",textTransform:"uppercase",textAlign:"right"}},"Pzas"),
          re("div",{style:{fontSize:10,fontWeight:800,color:"#aaa",textTransform:"uppercase",textAlign:"right"}},"Total")
        ),
        prods.map(function(p){
          return re("div",{key:p.nombre,style:{display:"grid",gridTemplateColumns:"1fr 50px 80px",gap:"4px 10px",paddingBottom:8,marginBottom:8,borderBottom:"1px solid #f8f8f8",alignItems:"center"}},
            re("div",{style:{fontSize:13,fontWeight:600,color:C.dark}},p.nombre),
            re("div",{style:{fontSize:13,fontWeight:700,color:"#555",textAlign:"right"}},p.qty),
            re("div",{style:{fontSize:13,fontWeight:700,color:C.green,textAlign:"right"}},fmt(p.total))
          );
        })
      )
    ):null,

    tab==="dias"?re("div",{style:{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      diasArr.length===0?re("div",{style:{textAlign:"center",color:"#bbb",padding:20}},"Sin ventas"):
      diasArr.map(function(d){
        return re("div",{key:d.fecha,style:{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}},
          re("div",null,
            re("div",{style:{fontSize:13,fontWeight:700,color:C.dark}},d.fecha),
            re("div",{style:{fontSize:11,color:"#aaa"}},d.count+" ventas")
          ),
          re("div",{style:{fontSize:15,fontWeight:900,color:C.green}},fmt(d.total))
        );
      })
    ):null,

    tab==="metodos"?re("div",{style:{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      [["💵 Efectivo",porMetodo.efectivo,"#22c55e"],["💳 Clip",porMetodo.clip,"#3b82f6"],["🛵 Didi",porMetodo.didi,"#f97316"],["🛒 Mercado Libre",porMetodo.mercadolibre,"#facc15"]].map(function(m,i){
        var pct=tv>0?Math.round(m[1]/tv*100):0;
        return re("div",{key:i,style:{marginBottom:12}},
          re("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4}},
            re("span",{style:{fontSize:13,fontWeight:600}},m[0]),
            re("span",{style:{fontSize:13,fontWeight:700,color:m[2]}},fmt(m[1])+" ("+pct+"%)")
          ),
          re("div",{style:{background:"#f0f0f0",borderRadius:6,height:6}},
            re("div",{style:{background:m[2],borderRadius:6,height:6,width:pct+"%",transition:"width .3s"}})
          )
        );
      })
    ):null
  );
}


// ─── EGRESOS ADMIN ────────────────────────────────────────────────────
function EgresosAdmin(props){
  var gastos=props.gastos||[];
  var onEditarGasto=props.onEditarGasto;
  var onEliminarGasto=props.onEliminarGasto;
  var sPeriodo=useState("hoy");var periodo=sPeriodo[0];var setPeriodo=sPeriodo[1];
  var sFini=useState("");var fechaIni=sFini[0];var setFechaIni=sFini[1];
  var sFfin=useState("");var fechaFin=sFfin[0];var setFechaFin=sFfin[1];
  var sTienda=useState("todas");var filtroTienda=sTienda[0];var setFiltroTienda=sTienda[1];
  var sEditG=useState(null);var editG=sEditG[0];var setEditG=sEditG[1];
  var sEditV=useState({monto:"",desc:"",tipo:""});var editV=sEditV[0];var setEditV=sEditV[1];

  function hoyStr(){var d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+(d.getDate());}
  function getRango(){
    var h=hoyStr();
    if(periodo==="hoy")return{ini:h,fin:h};
    if(periodo==="semana"){var d=new Date();var lun=new Date(d);lun.setDate(d.getDate()-((d.getDay()+6)%7));return{ini:lun.toISOString().split("T")[0],fin:h};}
    if(periodo==="mes"){var d2=new Date();return{ini:d2.getFullYear()+"-"+(d2.getMonth()+1<10?"0":"")+(d2.getMonth()+1)+"-01",fin:h};}
    if(periodo==="custom"&&fechaIni&&fechaFin)return{ini:fechaIni,fin:fechaFin};
    return{ini:h,fin:h};
  }
  var rango=getRango();
  function enRango(ts){
    if(!ts)return false;
    var d=new Date(ts);
    var ld=d.getFullYear()+"-"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+(d.getDate());
    return ld>=rango.ini&&ld<=rango.fin;
  }

  var gastosFil=gastos.filter(function(g){
    return enRango(g.timestamp)&&(filtroTienda==="todas"||g.tienda===filtroTienda||(!g.tienda&&filtroTienda==="global"));
  });

  // Totales por rubro
  var tMP=gastosFil.filter(function(g){return g.tipo==="insumo";}).reduce(function(s,g){return s+g.monto;},0);
  var tColab=gastosFil.filter(function(g){return g.tipo==="colaborador";}).reduce(function(s,g){return s+g.monto;},0);
  var tOper=gastosFil.filter(function(g){return g.tipo==="operativo";}).reduce(function(s,g){return s+g.monto;},0);
  var tPers=gastosFil.filter(function(g){return g.tipo==="personal";}).reduce(function(s,g){return s+g.monto;},0);
  var tOtro=gastosFil.filter(function(g){return g.tipo==="otro";}).reduce(function(s,g){return s+g.monto;},0);
  var tTarM=gastosFil.filter(function(g){return g.tipo==="tarjeta_migue";}).reduce(function(s,g){return s+g.monto;},0);
  var tTarA=gastosFil.filter(function(g){return g.tipo==="tarjeta_angel";}).reduce(function(s,g){return s+g.monto;},0);
  var tTotal=tMP+tColab+tOper+tPers+tOtro+tTarM+tTarA;

  function getDesc(g){
    var t=g.tienda?(" ["+g.tienda.charAt(0).toUpperCase()+g.tienda.slice(1)+"]"):"";
    if(g.tipo==="insumo")return"MP: "+(g.insumoNombre||"")+t;
    if(g.tipo==="colaborador")return"Colaborador: "+(g.desc||"")+t;
    if(g.tipo==="operativo")return"Operativo: "+(g.desc||"")+t;
    if(g.tipo==="personal")return"Personal A&M: "+(g.desc||"")+t;
    if(g.tipo==="tarjeta_migue")return"T.Migue: "+(g.desc||"")+t;
    if(g.tipo==="tarjeta_angel")return"T.Angel: "+(g.desc||"")+t;
    return"Otro: "+(g.desc||"")+t;
  }

  return re("div",null,
    // Period selector
    re("div",{style:{background:"#fff",borderRadius:14,padding:14,marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      re("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}},
        [["hoy","Hoy"],["semana","Semana"],["mes","Este mes"],["custom","Personalizado"]].map(function(p){
          var sel=periodo===p[0];
          return re("button",{key:p[0],onClick:function(){setPeriodo(p[0]);},
            style:{padding:"7px 12px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:20,
              cursor:"pointer",fontWeight:sel?800:500,background:sel?C.dark:"#fff",
              color:sel?"#fff":"#555",fontSize:12}},p[1]);
        })
      ),
      periodo==="custom"?re("div",{style:{display:"flex",gap:8,marginBottom:8}},
        re("input",{type:"date",value:fechaIni,onChange:function(e){setFechaIni(e.target.value);},style:Object.assign({},IP,{flex:1})}),
        re("input",{type:"date",value:fechaFin,onChange:function(e){setFechaFin(e.target.value);},style:Object.assign({},IP,{flex:1})})
      ):null,
      // Tienda filter
      re("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
        [{id:"todas",nombre:"Todas",emoji:"🌐"}].concat(TIENDAS).concat([{id:"global",nombre:"Global",emoji:"📋"}]).map(function(t){
          var sel=filtroTienda===t.id;
          return re("button",{key:t.id,onClick:function(){setFiltroTienda(t.id);},
            style:{padding:"6px 10px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:16,
              cursor:"pointer",fontWeight:sel?800:500,background:sel?C.dark:"#fff",
              color:sel?"#fff":"#555",fontSize:11}},t.emoji+" "+t.nombre);
        })
      )
    ),

    // Desglose
    re("div",{style:{background:"#fff",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      re("div",{style:SC},"Desglose de egresos"),
      [["📦 Materia Prima",tMP],["👤 Colaboradores",tColab],["⚙️ Operativo",tOper],
       ["👫 Personal A&M",tPers],["💳 T.Migue",tTarM],["💳 T.Angel",tTarA],["💸 Otros",tOtro]].map(function(row,i){
        if(row[1]===0)return null;
        return re("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f5f5f5"}},
          re("span",{style:{fontSize:13,color:"#555"}},row[0]),
          re("span",{style:{fontSize:13,fontWeight:700,color:C.red}},fmt(row[1]))
        );
      }),
      re("div",{style:{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:"2px solid #f0f0f0",marginTop:4}},
        re("span",{style:{fontSize:14,fontWeight:800,color:C.dark}},"Total egresos"),
        re("span",{style:{fontSize:14,fontWeight:900,color:C.red}},fmt(tTotal))
      )
    ),

    // Lista de gastos
    re("div",{style:{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
      re("div",{style:SC},"Lista de egresos ("+gastosFil.length+")"),
      gastosFil.length===0?re("div",{style:{textAlign:"center",color:"#bbb",padding:20}},"Sin egresos en este período"):
      gastosFil.map(function(g,i){
        return re("div",{key:i,style:{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:i<gastosFil.length-1?"1px solid #f5f5f5":"none"}},
          re("div",{style:{flex:1}},
            re("div",{style:{fontSize:13,fontWeight:600,color:C.dark}},getDesc(g)),
            re("div",{style:{fontSize:11,color:"#aaa"}},fmtFecha(g.timestamp)+(g.metodoPago?" · "+g.metodoPago:""))
          ),
          re("div",{style:{display:"flex",alignItems:"center",gap:6}},
            re("button",{onClick:function(){setEditG(g);setEditV({monto:String(g.monto),desc:g.desc||"",tipo:g.tipo||""});},
              style:{background:"#f0f0f0",border:"none",borderRadius:6,padding:"4px 8px",fontSize:12,cursor:"pointer"}},"✏️"),
            re("button",{onClick:function(){if(window.confirm("¿Eliminar este gasto de "+fmt(g.monto)+"?"))onEliminarGasto(g);},
              style:{background:"#ffebee",border:"none",borderRadius:6,padding:"4px 8px",fontSize:12,cursor:"pointer"}},"🗑️"),
            re("span",{style:{fontSize:14,fontWeight:700,color:C.red,minWidth:70,textAlign:"right"}},fmt(g.monto))
          )
        );
      })
    ),

    // Edit modal
    editG?re("div",{style:OV},re("div",{style:MD},
      re("div",{style:{fontSize:17,fontWeight:900,color:C.dark,marginBottom:14}},"Editar gasto"),
      re("div",{style:{marginBottom:12}},
        re("div",{style:LB},"Monto ($)"),
        re("input",{type:"number",value:editV.monto,onChange:function(e){setEditV(function(p){return Object.assign({},p,{monto:e.target.value});});},
          style:Object.assign({},IP,{fontSize:20,fontWeight:700})})
      ),
      re("div",{style:{marginBottom:14}},
        re("div",{style:LB},"Descripción"),
        re("input",{type:"text",value:editV.desc,onChange:function(e){setEditV(function(p){return Object.assign({},p,{desc:e.target.value});});},style:IP})
      ),
      re("div",{style:{display:"flex",gap:10}},
        re("button",{onClick:function(){setEditG(null);},style:BS("#f0f0f0","#666")},"Cancelar"),
        re("button",{onClick:function(){
          if(!editV.monto||parseFloat(editV.monto)<=0)return;
          onEditarGasto(editG,{monto:parseFloat(editV.monto),desc:editV.desc});
          setEditG(null);
        },style:BS(C.dark,"#fff",2)},"Guardar")
      )
    )):null
  );
}


// ─── ADMIN APP ────────────────────────────────────────────────────────
export default function AdminApp(){
  var sData=useState(null);var data=sData[0];var setData=sData[1];
  var sCarg=useState(true);var cargando=sCarg[0];var setCargando=sCarg[1];
  var sErr=useState("");var error=sErr[0];var setError=sErr[1];
  var sTab=useState("resumen");var tab=sTab[0];var setTab=sTab[1];
  var sTienda=useState("todas");var tiendaSel=sTienda[0];var setTiendaSel=sTienda[1];
  var sModalEgr=useState(false);var modalEgr=sModalEgr[0];var setModalEgr=sModalEgr[1];
  var sGastos=useState([]);var gastos=sGastos[0];var setGastos=sGastos[1];
  var sVentas=useState([]);var ventas=sVentas[0];var setVentas=sVentas[1];
  var sInv=useState({centro:[],sanantonio:[],amburger:[],tichi:[]});
  var inv=sInv[0];var setInv=sInv[1];

  function mkIns(base){return base.map(function(i){return Object.assign({},i,{stock:0});});}

  useEffect(function(){
    (async function(){
      try{
        var rawVentas=await sbGet("ventas","select=*&order=timestamp.desc&limit=10000")||[];
        var rawGastos=await sbGet("gastos","select=*&order=timestamp.desc&limit=10000")||[];
        var rawInv=await sbGet("inventario","select=*")||[];

        var ventasApp=rawVentas.map(function(v){
          return {timestamp:v.timestamp,tienda:v.tienda,total:v.total||0,metodo:v.metodo||"efectivo",
            comisionClip:v.comision_clip||0,items:v.items||[],estadoPago:v.estado_pago||"pagado"};
        });
        var gastosApp=rawGastos.map(function(g){
          return {timestamp:g.timestamp,tienda:g.tienda,seccion:g.seccion,tipo:g.tipo,monto:g.monto||0,
            desc:g.desc_gasto||"",insumoId:g.insumo_id||"",insumoNombre:g.insumo_nombre||"",
            cantidad:g.cantidad||0,unidad:g.unidad||"",metodoPago:g.metodo_pago||""};
        });

        // Restore inventory
        function restoreIns(base,tiendaId){
          return base.map(function(ins){
            var row=rawInv.find(function(r){return r.tienda===tiendaId&&r.insumo_id===ins.id;});
            return row?Object.assign({},ins,{stock:row.stock||0,costoPorU:row.costo_por_u||null}):ins;
          });
        }
        var insC=restoreIns(mkIns(INSUMOS_INIT),"centro");
        var insSA=restoreIns(mkIns(INSUMOS_INIT),"sanantonio");
        var insAmb=restoreIns(mkIns(INSUMOS_AMB),"amburger");
        var insTichi=restoreIns(mkIns(INSUMOS_TICHI_MP.concat(INSUMOS_TICHI_PT)),"tichi");

        setVentas(ventasApp);
        setGastos(gastosApp);
        setInv({centro:insC,sanantonio:insSA,amburger:insAmb,tichi:insTichi});
        setCargando(false);
      }catch(e){
        setError("Error al cargar datos: "+e.message);
        setCargando(false);
      }
    })();
  },[]);

  async function agregarGasto(g){
    setGastos(function(p){return [g].concat(p);});
    try{
      await sbPost("gastos",{
        timestamp:g.timestamp||new Date().toISOString(),
        tienda:g.tienda||"global",
        seccion:g.seccion||"externo",
        tipo:g.tipo||"otro",
        monto:g.monto||0,
        desc_gasto:g.desc||"",
        insumo_id:g.insumoId||"",
        insumo_nombre:g.insumoNombre||"",
        cantidad:g.cantidad||0,
        unidad:g.unidad||"",
        metodo_pago:g.metodoPago||""
      });
      // If mp_con_inv, also update local inventory state
      if(g.tipo==="insumo"&&g.insumoId&&g.cantidad>0){
        var t=g.tienda;
        var insKey=t==="amburger"?"amburger":t==="tichi"?"tichi":t==="sanantonio"?"sanantonio":"centro";
        setInv(function(prev){
          var newIns=Object.assign({},prev);
          newIns[insKey]=(prev[insKey]||[]).map(function(i){
            return i.id===g.insumoId?Object.assign({},i,{stock:(i.stock||0)+g.cantidad}):i;
          });
          return newIns;
        });
      }
    }catch(e){console.error("Error saving gasto:",e);}
  }

  async function editarGasto(gasto,changes){
    setGastos(function(p){return p.map(function(g){
      return g.timestamp===gasto.timestamp&&g.tienda===gasto.tienda?Object.assign({},g,changes):g;
    });});
    try{
      await sbPatch("gastos","timestamp=eq."+encodeURIComponent(gasto.timestamp)+"&tienda=eq."+gasto.tienda,
        {monto:changes.monto,desc_gasto:changes.desc||""});
    }catch(e){console.error("Error editing gasto:",e);}
  }

  async function eliminarGasto(gasto){
    setGastos(function(p){return p.filter(function(g){
      return !(g.timestamp===gasto.timestamp&&g.tienda===gasto.tienda);
    });});
    try{
      await sbDelete("gastos","timestamp=eq."+encodeURIComponent(gasto.timestamp)+"&tienda=eq."+gasto.tienda);
    }catch(e){console.error("Error deleting gasto:",e);}
  }

  function handleDeltaUpdate(tienda,insumoId,newStock,costoPorU){
    setInv(function(prev){
      var newInv=Object.assign({},prev);
      newInv[tienda]=(prev[tienda]||[]).map(function(i){
        return i.id===insumoId?Object.assign({},i,{stock:newStock,costoPorU:costoPorU||i.costoPorU}):i;
      });
      return newInv;
    });
  }

  // Summary calculations
  function hoyStr(){var d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+(d.getDate());}
  var h=hoyStr();
  function enHoy(ts){if(!ts)return false;var d=new Date(ts);var ld=d.getFullYear()+"-"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+(d.getDate());return ld===h;}

  var ventasHoy=ventas.filter(function(v){return enHoy(v.timestamp);});
  var tvHoy=ventasHoy.reduce(function(s,v){return s+v.total;},0);
  var gastosHoy=gastos.filter(function(g){return enHoy(g.timestamp);});
  var tgHoy=gastosHoy.reduce(function(s,g){return s+g.monto;},0);

  // Ventas por tienda hoy
  var vtHoy={centro:0,sanantonio:0,amburger:0,tichi:0};
  ventasHoy.forEach(function(v){if(vtHoy[v.tienda]!==undefined)vtHoy[v.tienda]+=v.total;});

  // insumosPorTienda for ModalEgreso
  var insumosPorTienda={
    centro:inv.centro,sanantonio:inv.sanantonio,amburger:inv.amburger,tichi:inv.tichi
  };

  var TABS=[["resumen","📊 Resumen"],["ventas","💰 Ventas"],["inventario","📦 Inventario"],["egresos","💸 Egresos"]];
  var PURP="#7c3aed";

  if(cargando)return re("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:16}},
    re("div",{style:{fontSize:32}},"⏳"),
    re("div",{style:{fontSize:16,color:"#888"}},"Cargando datos...")
  );
  if(error)return re("div",{style:{padding:24,color:C.red,textAlign:"center"}},error);

  return re("div",{style:{minHeight:"100vh",background:"#f5f5f7",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}},
    // Header
    re("div",{style:{background:PURP,color:"#fff",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}},
      re("div",null,
        re("div",{style:{fontSize:20,fontWeight:900}},"📊 Admin — Crepisimo"),
        re("div",{style:{fontSize:12,opacity:0.8}},"Panel de administración")
      ),
      re("button",{onClick:function(){setModalEgr(true);},
        style:{background:"rgba(255,255,255,0.2)",color:"#fff",border:"none",borderRadius:12,
          padding:"10px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}},
        "+ Registrar Egreso"
      )
    ),

    // Navigation tabs
    re("div",{style:{background:"#fff",borderBottom:"1px solid #e0e0e0",padding:"0 16px",display:"flex",gap:0,overflowX:"auto"}},
      TABS.map(function(t){
        var sel=tab===t[0];
        return re("button",{key:t[0],onClick:function(){setTab(t[0]);},
          style:{padding:"14px 16px",border:"none",borderBottom:"3px solid "+(sel?PURP:"transparent"),
            cursor:"pointer",fontWeight:sel?800:500,color:sel?PURP:"#888",
            background:"transparent",fontSize:13,whiteSpace:"nowrap"}},t[1]);
      })
    ),

    // Content
    re("div",{style:{padding:16,maxWidth:800,margin:"0 auto"}},

      // RESUMEN TAB
      tab==="resumen"?re("div",null,
        // KPIs hoy
        re("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}},
          re("div",{style:{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
            re("div",{style:{fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",marginBottom:4}},"Ventas hoy"),
            re("div",{style:{fontSize:28,fontWeight:900,color:C.green}},fmt(tvHoy)),
            re("div",{style:{fontSize:12,color:"#aaa",marginTop:2}},ventasHoy.length+" transacciones")
          ),
          re("div",{style:{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
            re("div",{style:{fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",marginBottom:4}},"Egresos hoy"),
            re("div",{style:{fontSize:28,fontWeight:900,color:C.red}},fmt(tgHoy)),
            re("div",{style:{fontSize:12,color:"#aaa",marginTop:2}},gastosHoy.length+" registros")
          )
        ),

        // Ventas por tienda hoy
        re("div",{style:{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.08)",marginBottom:16}},
          re("div",{style:{fontSize:12,fontWeight:800,color:"#888",textTransform:"uppercase",marginBottom:12}},"Ventas por tienda — Hoy"),
          TIENDAS.map(function(t){
            return re("div",{key:t.id,style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}},
              re("div",null,
                re("div",{style:{fontSize:14,fontWeight:600,color:C.dark}},t.emoji+" "+t.nombre)
              ),
              re("div",{style:{fontSize:16,fontWeight:800,color:vtHoy[t.id]>0?C.green:"#ccc"}},fmt(vtHoy[t.id]))
            );
          })
        ),

        // Quick inventory alerts
        re("div",{style:{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}},
          re("div",{style:{fontSize:12,fontWeight:800,color:"#888",textTransform:"uppercase",marginBottom:12}},"Alertas de inventario"),
          (function(){
            var alertas=[];
            Object.keys(inv).forEach(function(t){
              var tInfo=TIENDAS.find(function(x){return x.id===t;});
              (inv[t]||[]).forEach(function(i){
                if((i.stock||0)===0)alertas.push({tienda:tInfo?tInfo.emoji+" "+tInfo.nombre:t,nombre:i.nombre,tipo:"agotado"});
                else if((i.stock||0)<=i.minimo)alertas.push({tienda:tInfo?tInfo.emoji+" "+tInfo.nombre:t,nombre:i.nombre,tipo:"bajo",stock:i.stock,min:i.minimo});
              });
            });
            if(alertas.length===0)return re("div",{style:{textAlign:"center",color:C.green,padding:16}},"✅ Todo el inventario está bien");
            return alertas.slice(0,10).map(function(a,i){
              return re("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f5f5f5"}},
                re("div",null,
                  re("div",{style:{fontSize:13,fontWeight:600,color:a.tipo==="agotado"?C.red:C.amber}},
                    (a.tipo==="agotado"?"🔴 ":"🟡 ")+a.nombre),
                  re("div",{style:{fontSize:11,color:"#aaa"}},a.tienda)
                ),
                re("div",{style:{fontSize:12,fontWeight:700,color:a.tipo==="agotado"?C.red:C.amber}},
                  a.tipo==="agotado"?"AGOTADO":"Stock bajo")
              );
            });
          })()
        )
      ):null,

      // VENTAS TAB
      tab==="ventas"?re("div",null,
        // Tienda selector
        re("div",{style:{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}},
          [{id:"todas",nombre:"Todas las tiendas",emoji:"🌐"}].concat(TIENDAS).map(function(t){
            var sel=tiendaSel===t.id;
            return re("button",{key:t.id,onClick:function(){setTiendaSel(t.id);},
              style:{padding:"8px 14px",border:"2px solid "+(sel?C.dark:"#e0e0e0"),borderRadius:20,
                cursor:"pointer",fontWeight:sel?800:500,background:sel?C.dark:"#fff",
                color:sel?"#fff":"#555",fontSize:12}},
              t.emoji+" "+t.nombre);
          })
        ),
        re(VentasTienda,{ventas:ventas,tiendaId:tiendaSel})
      ):null,

      // INVENTARIO TAB
      tab==="inventario"?re(InventarioAdmin,{datos:inv,onDeltaUpdate:handleDeltaUpdate}):null,

      // EGRESOS TAB
      tab==="egresos"?re(EgresosAdmin,{
        gastos:gastos,
        onEditarGasto:editarGasto,
        onEliminarGasto:eliminarGasto
      }):null
    ),

    // Modal Egreso
    modalEgr?re(ModalEgreso,{
      onSave:function(g){agregarGasto(g);},
      onClose:function(){setModalEgr(false);},
      insumosPorTienda:insumosPorTienda
    }):null
  );
}
