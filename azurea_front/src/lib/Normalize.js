// Pont entre Laravel (snake_case, minuscules, { data: ... }) et l'UI
// (camelCase, STATUTS_EN_MAJUSCULES). TOUT ce qui dépend du JSON du backend est ici.

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export function camelize(v) {
  if (Array.isArray(v)) return v.map(camelize);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [toCamel(k), camelize(val)]),
    );
  return v;
}

// [..]  |  { data: [..] }  |  { chambres: [..] }  →  [..]
export function list(res) {
  const d = camelize(res);
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  const firstArray = d && typeof d === "object"
    ? Object.values(d).find(Array.isArray)
    : null;
  return firstArray || [];
}

// {..}  |  { data: {..} }  →  {..}
export function one(res) {
  const d = camelize(res);
  if (Array.isArray(d)) return d[0] ?? {};
  return d?.data && !Array.isArray(d.data) ? d.data : d ?? {};
}

const up = (s) => (typeof s === "string" ? s.toUpperCase() : s);
const day = (s) => (s ? String(s).slice(0, 10) : s);
const num = (v, fallback = 0) => (v === undefined || v === null ? fallback : Number(v));

export const toRoom = (r) => ({
  ...r,
  capacite: num(r.capacite),
  prixNuit: num(r.prixNuit),
  statut: up(r.statut),
});

export const toService = (s) => ({
  ...s,
  prixUnitaire: num(s.prixUnitaire),
  actif: s.actif === undefined || s.actif === null ? true : Boolean(Number(s.actif)),
});

export const toAuberge = (a) => ({ ...a });

export const toUser = (u) => ({ ...u, role: up(u.role) });

export function toReservation(b) {
  const room = b.chambre ? toRoom(b.chambre) : null;
  const client = b.client ?? b.user ?? null;
  const services = (b.services ?? b.reservationServices ?? []).map((s) => ({
    serviceId: s.serviceId ?? s.pivot?.serviceId ?? s.id,
    nom: s.nom ?? s.service?.nom,
    quantite: num(s.quantite ?? s.pivot?.quantite, 1),
    prixUnitaireApplique: num(
      s.prixUnitaireApplique ?? s.pivot?.prixUnitaireApplique ?? s.prixUnitaire,
    ),
  }));
  return {
    ...b,
    reference: b.reference ?? `RES-${String(b.id).padStart(4, "0")}`,
    chambreId: b.chambreId ?? room?.id,
    clientId: b.clientId ?? b.userId ?? client?.id,
    chambre: room,
    client,
    dateDebut: day(b.dateDebut),
    dateFin: day(b.dateFin),
    nombreAdultes: num(b.nombreAdultes, 1),
    nombreEnfants: num(b.nombreEnfants, 0),
    statut: up(b.statut),
    prixTotal: b.prixTotal === undefined || b.prixTotal === null ? null : Number(b.prixTotal),
    services,
    facture: b.facture ? toInvoice(b.facture) : null,
  };
}

export function toInvoice(f) {
  const paiements = (f.paiements ?? []).map((p) => ({
    ...p,
    montant: num(p.montant),
    datePaiement: day(p.datePaiement),
  }));
  return {
    ...f,
    numero: f.numero ?? `FAC-${String(f.id).padStart(4, "0")}`,
    reservationId: f.reservationId ?? f.reservation?.id,
    reservation: f.reservation ? toReservation(f.reservation) : null,
    dateEmission: day(f.dateEmission),
    montantTotal: num(f.montantTotal),
    lignes: f.lignes ?? f.ligneFactures ?? [],
    paiements,
    montantPaye:
      f.montantPaye !== undefined && f.montantPaye !== null
        ? Number(f.montantPaye)
        : paiements.reduce((s, p) => s + p.montant, 0),
    statut: up(f.statut),
  };
}

// ───────── UI → API (noms des champs attendus par les FormRequests) ─────────
export const roomBody = (v) => ({
  numero: v.numero,
  type: v.type,
  capacite: Number(v.capacite),
  prix_nuit: Number(v.prixNuit),
  statut: String(v.statut || "DISPONIBLE").toLowerCase(),
});

export const serviceBody = (v) => ({
  nom: v.nom,
  description: v.description ?? "",
  prix_unitaire: Number(v.prixUnitaire),
  actif: v.actif === true || v.actif === "true",
});

export const reservationBody = (d) => ({
  date_debut: d.from,
  date_fin: d.to,
  nombre_adultes: Number(d.adults),
  nombre_enfants: Number(d.children),
});

export const aubergeBody = (v) => ({
  nom: v.nom,
  adresse: v.adresse,
  ville: v.ville,
  telephone: v.telephone,
  description: v.description,
});

// Message d'erreur lisible (422 → 1er message de validation)
export function apiMessage(error) {
  const d = error?.data;
  return (
    (d?.errors && Object.values(d.errors).flat()[0]) ||
    d?.message ||
    (error?.status ? `Erreur ${error.status}` : "Impossible de joindre le serveur.")
  );
}