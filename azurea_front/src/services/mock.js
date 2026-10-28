const KEY='auberge-demo-v2';
const dayOffset=offset=>{const d=new Date();d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const initial={
 users:[
  {id:'u1',prenom:'Salma',nom:'El Idrissi',email:'salma@auberge.ma',role:'ADMIN',active:true,tel:'+212 661 204 380'},
  {id:'u2',prenom:'Youssef',nom:'Amrani',email:'youssef@auberge.ma',role:'RECEPTIONNISTE',active:true,tel:'+212 662 418 052'},
  {id:'u3',prenom:'Nadia',nom:'Bennani',email:'nadia@email.ma',role:'CLIENT',active:true,tel:'+212 650 319 742'},
  {id:'u4',prenom:'Omar',nom:'Fassi',email:'omar@email.ma',role:'CLIENT',active:true,tel:'+212 661 872 116'},
  {id:'u5',prenom:'Lina',nom:'Tazi',email:'lina@email.ma',role:'CLIENT',active:true,tel:'+212 670 152 430'},
  {id:'u6',prenom:'Karim',nom:'Berrada',email:'karim@email.ma',role:'RECEPTIONNISTE',active:true,tel:'+212 663 751 089'}
 ],
 rooms:[
   {id:'r1',numero:'101',type:'Chambre double',capacite:2,prixNuit:850,statut:'DISPONIBLE',description:'Une chambre lumineuse aux matières naturelles, avec vue sur la cour intérieure.',img:'/chambre-double.jpg'},
   {id:'r2',numero:'102',type:'Chambre supérieure',capacite:2,prixNuit:1120,statut:'OCCUPEE',description:'Un refuge élégant avec salon privé et vue sur les montagnes.',img:'/chambre-double.jpg'},
   {id:'r3',numero:'201',type:'Suite familiale',capacite:4,prixNuit:1480,statut:'DISPONIBLE',description:'Une suite généreuse pensée pour les séjours en famille.',img:'/suite-familiale.jpg'},
   {id:'r4',numero:'202',type:'Chambre double',capacite:2,prixNuit:920,statut:'EN_NETTOYAGE',description:'Une chambre paisible mêlant artisanat local et confort contemporain.',img:'/chambre-double.jpg'},
   {id:'r5',numero:'301',type:'Suite terrasse',capacite:3,prixNuit:1690,statut:'DISPONIBLE',description:'Une terrasse privée ouverte sur les toits de la médina.',img:'/suite-terrasse.jpg'},
   {id:'r6',numero:'302',type:'Chambre supérieure',capacite:2,prixNuit:1180,statut:'DISPONIBLE',description:'Un cocon calme et raffiné, idéal pour une escapade à deux.',img:'/chambre-double.jpg'}
 ],
 services:[
  {id:'s1',nom:'Petit-déjeuner maison',description:'Un buffet de saison aux saveurs du terroir, servi dans la cour.',prixUnitaire:140,actif:true},
  {id:'s2',nom:'Transfert aéroport',description:'Accueil personnalisé et trajet confortable depuis l’aéroport.',prixUnitaire:320,actif:true},
  {id:'s3',nom:'Blanchisserie',description:'Lavage et repassage soignés, sous 24 heures.',prixUnitaire:90,actif:true},
  {id:'s4',nom:'Hammam traditionnel',description:'Un rituel de détente avec produits naturels.',prixUnitaire:260,actif:true}
 ],
 reservations:[
  {id:'b1',reference:'AUB-26048',clientId:'u3',chambreId:'r1',dateDebut:dayOffset(0),dateFin:dayOffset(3),nombreAdultes:2,nombreEnfants:0,statut:'CONFIRMEE',prixNuitApplique:850,services:[{serviceId:'s1',quantite:2,prixUnitaireApplique:140}]},
  {id:'b2',reference:'AUB-26052',clientId:'u4',chambreId:'r2',dateDebut:dayOffset(-2),dateFin:dayOffset(0),nombreAdultes:2,nombreEnfants:0,statut:'EN_COURS',prixNuitApplique:1120,services:[]},
  {id:'b3',reference:'AUB-26055',clientId:'u5',chambreId:'r3',dateDebut:dayOffset(2),dateFin:dayOffset(5),nombreAdultes:2,nombreEnfants:1,statut:'EN_ATTENTE',prixNuitApplique:1480,services:[]},
  {id:'b4',reference:'AUB-26031',clientId:'u3',chambreId:'r5',dateDebut:dayOffset(-45),dateFin:dayOffset(-42),nombreAdultes:2,nombreEnfants:0,statut:'TERMINEE',prixNuitApplique:1690,services:[{serviceId:'s2',quantite:1,prixUnitaireApplique:320}]},
  {id:'b5',reference:'AUB-26058',clientId:'u4',chambreId:'r6',dateDebut:dayOffset(6),dateFin:dayOffset(8),nombreAdultes:1,nombreEnfants:0,statut:'CONFIRMEE',prixNuitApplique:1180,services:[]},
  {id:'b6',reference:'AUB-26011',clientId:'u5',chambreId:'r6',dateDebut:dayOffset(-90),dateFin:dayOffset(-87),nombreAdultes:2,nombreEnfants:0,statut:'ANNULEE',prixNuitApplique:1180,services:[]}
 ],
 invoices:[
  {id:'i1',numero:'FAC-2026-048',reservationId:'b1',dateEmission:dayOffset(0),montantPaye:1000,services:[{nom:'Petit-déjeuner maison',quantite:2,prix:140}]},
  {id:'i2',numero:'FAC-2026-052',reservationId:'b2',dateEmission:dayOffset(-1),montantPaye:0,services:[]},
  {id:'i3',numero:'FAC-2026-031',reservationId:'b4',dateEmission:dayOffset(-42),montantPaye:5390,services:[{nom:'Transfert aéroport',quantite:1,prix:320}]}
 ],
 payments:[
  {id:'p1',factureId:'i1',datePaiement:dayOffset(0),montant:1000,modePaiement:'ESPECES',enregistrePar:'Youssef Amrani'},
  {id:'p2',factureId:'i3',datePaiement:dayOffset(-42),montant:5390,modePaiement:'ESPECES',enregistrePar:'Youssef Amrani'}
 ],
 auberge:{nom:'Auberge Dar Séléné',adresse:'18, Derb El Hammam',ville:'Marrakech, Maroc',telephone:'+212 524 38 41 26',email:'bonjour@darselene.ma',description:'Une maison d’hôtes à taille humaine, au cœur de la médina. Depuis notre patio ensoleillé, nous partageons l’hospitalité généreuse et les belles histoires de Marrakech.'}
};
const clone=x=>JSON.parse(JSON.stringify(x));
export function read(){try{return JSON.parse(localStorage.getItem(KEY))||clone(initial)}catch{return clone(initial)}}
export function write(data){localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new Event('auberge-change'));return data}
export function reset(){localStorage.removeItem(KEY);window.dispatchEvent(new Event('auberge-change'));return read()}
export function entity(name){return read()[name]||[]}
export function saveEntity(name,items){const d=read();d[name]=items;return write(d)}
export function saveAuberge(value){const d=read();d.auberge=value;return write(d)}
export function nights(b){return Math.max(0,Math.round((new Date(b.dateFin+'T12:00:00')-new Date(b.dateDebut+'T12:00:00'))/86400000))}
export function roomFor(id){return entity('rooms').find(x=>x.id===id)}
export function userFor(id){return entity('users').find(x=>x.id===id)}
export function reservationTotal(b){const r=roomFor(b.chambreId);return (b.prixNuitApplique??r?.prixNuit??0)*nights(b)+(b.services||[]).reduce((s,x)=>s+x.quantite*x.prixUnitaireApplique,0)}
export function invoiceTotal(i){const b=entity('reservations').find(x=>x.id===i.reservationId);return reservationTotal(b||{})}
export function balance(i){return Math.max(0,invoiceTotal(i)-i.montantPaye)}
export function invoiceStatus(i){return balance(i)===0?'PAYEE':i.montantPaye>0?'PARTIELLEMENT_PAYEE':'NON_PAYEE'}
export function available(roomId,start,end,ignoreId){const room=roomFor(roomId);if(!room||room.statut==='EN_MAINTENANCE'||room.statut==='EN_NETTOYAGE')return false;return !entity('reservations').some(b=>b.id!==ignoreId&&b.chambreId===roomId&&!['ANNULEE','TERMINEE'].includes(b.statut)&&start<b.dateFin&&end>b.dateDebut)}
export function createReservation(values){if(!(values.dateFin>values.dateDebut))throw Error('Le départ doit être après l’arrivée.');if(!available(values.chambreId,values.dateDebut,values.dateFin))throw Error('Cette chambre est déjà réservée sur ces dates ou indisponible.');const d=read();const b={...values,prixNuitApplique:values.prixNuitApplique??d.rooms.find(r=>r.id===values.chambreId)?.prixNuit,id:'b'+Date.now(),reference:'AUB-'+String(Date.now()).slice(-5),statut:'EN_ATTENTE',services:values.services||[]};d.reservations.unshift(b);return write(d)}
export function createInvoice(reservationId){const d=read();if(d.invoices.some(i=>i.reservationId===reservationId))return d.invoices.find(i=>i.reservationId===reservationId);const booking=d.reservations.find(b=>b.id===reservationId);const lines=(booking?.services||[]).map(line=>{const service=d.services.find(s=>s.id===line.serviceId);return{nom:service?.nom||'Service',quantite:line.quantite,prix:line.prixUnitaireApplique}});const i={id:'i'+Date.now(),numero:'FAC-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-4),reservationId,dateEmission:new Date().toISOString().slice(0,10),montantPaye:0,services:lines};d.invoices.unshift(i);write(d);return i}
export function recordPayment(invoiceId,amount,who='Youssef Amrani'){const d=read();const i=d.invoices.find(x=>x.id===invoiceId);if(!i)throw Error('Facture introuvable.');const n=Number(amount);if(!(n>0))throw Error('Le montant doit être positif.');if(n>balance(i))throw Error('Le montant dépasse le solde restant.');i.montantPaye+=n;d.payments.unshift({id:'p'+Date.now(),factureId:invoiceId,datePaiement:new Date().toISOString().slice(0,10),montant:n,modePaiement:'ESPECES',enregistrePar:who});return write(d)}
export function cancelReservation(id){const d=read();const b=d.reservations.find(x=>x.id===id);if(!b||!['EN_ATTENTE','CONFIRMEE'].includes(b.statut)||b.dateDebut<=new Date().toISOString().slice(0,10))throw Error('Cette réservation ne peut plus être annulée.');b.statut='ANNULEE';return write(d)}
export const seed=initial;
