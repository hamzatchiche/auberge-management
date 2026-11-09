const initial={users:[],rooms:[],reservations:[],invoices:[],payments:[],auberge:{nom:'',adresse:'',ville:'',telephone:'',description:''},services:[]};
const clone=value=>JSON.parse(JSON.stringify(value));
let pendingWriteId=0;
function backendUnavailable(){
  const id=++pendingWriteId;
  if(typeof window!=='undefined'){
    window.__aubergePendingWrite=id;
    setTimeout(()=>{
      if(window.__aubergePendingWrite===id){
        window.__aubergePendingWrite=null;
        window.dispatchEvent(new CustomEvent('auberge-toast',{detail:'Backend non connecte : aucune modification n a ete envoyee.'}));
      }
    },0);
  }
  return false;
}
export function read(){return clone(initial)}
export function write(){return backendUnavailable()}
export function reset(){return read()}
export function entity(name){return read()[name]||[]}
export function saveEntity(){return backendUnavailable()}
export function saveAuberge(){return backendUnavailable()}
export function nights(b){return Math.max(0,Math.round((new Date(b.dateFin+'T12:00:00')-new Date(b.dateDebut+'T12:00:00'))/86400000))}
export function roomFor(id){return entity('rooms').find(x=>x.id===id)}
export function userFor(id){return entity('users').find(x=>x.id===id)}
export function reservationTotal(b){const r=roomFor(b.chambreId);return (b.prixNuitApplique??r?.prixNuit??0)*nights(b)+(b.services||[]).reduce((s,x)=>s+x.quantite*x.prixUnitaireApplique,0)}
export function invoiceTotal(i){const b=entity('reservations').find(x=>x.id===i.reservationId);return reservationTotal(b||{})}
export function balance(i){return Math.max(0,invoiceTotal(i)-i.montantPaye)}
export function invoiceStatus(i){return balance(i)===0?'PAYEE':i.montantPaye>0?'PARTIELLEMENT_PAYEE':'NON_PAYEE'}
export function available(){return null}
export function createReservation(){return backendUnavailable()}
export function createInvoice(){return backendUnavailable()}
export function recordPayment(){return backendUnavailable()}
export function cancelReservation(){return backendUnavailable()}
export const seed=initial;
