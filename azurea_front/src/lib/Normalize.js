const firstArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of ["data", "chambres", "services", "reservations", "reservation", "factures", "users"]) {
    if (Array.isArray(value[key])) return value[key];
    if (value[key] && typeof value[key] === "object" && Array.isArray(value[key].data)) {
      return value[key].data;
    }
  }
  return [];
};

export const list = firstArray;

export function one(value) {
  if (Array.isArray(value)) return value[0] ?? {};
  if (value && typeof value === "object" && value.data && !Array.isArray(value.data)) {
    return value.data;
  }
  return value ?? {};
}

const upper = (value) => String(value?.value ?? value ?? "").toUpperCase();
const number = (value) => Number(value ?? 0);

export function toRoom(room = {}) {
  return {
    ...room,
    id: room.id,
    numero: room.numero ?? "",
    type: room.type ?? "",
    capacite: number(room.capacite),
    prixNuit: number(room.prixNuit ?? room.prix_nuit),
    statut: upper(room.statut ?? room.status),
  };
}

export function toService(service = {}) {
  return {
    ...service,
    id: service.id,
    nom: service.nom ?? "",
    description: service.description ?? "",
    prixUnitaire: number(service.prixUnitaire ?? service.prix_unitaire),
    actif: service.actif === true || service.actif === 1 || service.actif === "1",
  };
}

export function toAuberge(auberge = {}) {
  return {
    ...auberge,
    nom: auberge.nom ?? "",
    adresse: auberge.adresse ?? "",
    ville: auberge.ville ?? "",
    telephone: auberge.telephone ?? "",
    description: auberge.description ?? "",
  };
}

function toReservationService(item = {}) {
  const service = item.service ?? {};
  return {
    id: item.id ?? service.id,
    serviceId: item.serviceId ?? item.service_id ?? service.id,
    nom: item.nom ?? service.nom ?? item.description ?? "Service",
    quantite: number(item.quantite),
    prixUnitaireApplique: number(
      item.prixUnitaireApplique ?? item.prix_unitaire_applique ?? item.prix_unitaire,
    ),
  };
}

export function toReservation(reservation = {}) {
  const room = reservation.chambre ? toRoom(reservation.chambre) : null;
  const client = reservation.client ?? reservation.user ?? null;
  const services = reservation.services ?? reservation.reservationServices ?? reservation.reservation_services ?? [];
  return {
    ...reservation,
    id: reservation.id,
    reference: reservation.reference ?? `RES-${reservation.id}`,
    clientId: reservation.clientId ?? reservation.user_id ?? client?.id,
    client: client
      ? {
          ...client,
          prenom: client.prenom ?? "",
          nom: client.nom ?? "",
          email: client.email ?? "",
        }
      : null,
    chambreId: reservation.chambreId ?? reservation.chambre_id ?? room?.id,
    chambre: room,
    dateDebut: reservation.dateDebut ?? reservation.date_debut ?? "",
    dateFin: reservation.dateFin ?? reservation.date_fin ?? "",
    nombreAdultes: number(reservation.nombreAdultes ?? reservation.nombre_adultes),
    nombreEnfants: number(reservation.nombreEnfants ?? reservation.nombre_enfants),
    statut: upper(reservation.statut),
    prixTotal: number(reservation.prixTotal ?? reservation.prix_total),
    createdAt: reservation.createdAt ?? reservation.created_at ?? null,
    services: list(services).map(toReservationService),
  };
}

function toPayment(payment = {}) {
  const datePaiement = payment.datePaiement ?? payment.date_paiement ?? "";
  return {
    ...payment,
    id: payment.id,
    montant: number(payment.montant),
    datePaiement: String(datePaiement).slice(0, 10),
    modePaiement: upper(payment.modePaiement ?? payment.mode_paiement),
  };
}

export function toInvoice(invoice = {}) {
  const payments = list(invoice.paiements ?? invoice.paiement).map(toPayment);
  const reservation = invoice.reservation ? toReservation(invoice.reservation) : null;
  return {
    ...invoice,
    id: invoice.id,
    reservationId: invoice.reservationId ?? invoice.reservation_id ?? reservation?.id,
    reservation,
    numero: invoice.numero ?? "",
    dateEmission: invoice.dateEmission ?? invoice.date_emission ?? "",
    montantTotal: number(invoice.montantTotal ?? invoice.montant_total),
    montantPaye: payments.reduce((sum, payment) => sum + payment.montant, 0),
    statut: upper(invoice.statut),
    paiements: payments,
    lignesFacture: list(invoice.lignesFacture ?? invoice.lignes_facture).map((line) => ({
      ...line,
      description: line.description ?? "",
      quantite: number(line.quantite),
      prixUnitaire: number(line.prixUnitaire ?? line.prix_unitaire),
      sousTotal: number(line.sousTotal ?? line.sous_total),
    })),
  };
}

export function toUser(user = {}) {
  return {
    ...user,
    id: user.id,
    nom: user.nom ?? "",
    prenom: user.prenom ?? "",
    email: user.email ?? "",
    role: upper(user.role),
    genre: String(user.genre?.value ?? user.genre ?? "").toLowerCase(),
  };
}

export function apiMessage(error) {
  const data = error?.data;
  const validation = data?.errors && Object.values(data.errors).flat(Infinity).find(Boolean);
  return validation || data?.message || data?.error || error?.message || "Une erreur est survenue.";
}

export function roomBody(values = {}) {
  return {
    numero: String(values.numero ?? "").trim(),
    type: String(values.type ?? "").trim(),
    capacite: Number(values.capacite),
    prix_nuit: Number(values.prixNuit ?? values.prix_nuit),
  };
}

export function serviceBody(values = {}) {
  return {
    nom: String(values.nom ?? "").trim(),
    description: String(values.description ?? "").trim(),
    prix_unitaire: Number(values.prixUnitaire ?? values.prix_unitaire),
    actif: values.actif === true || values.actif === "true" || values.actif === 1,
  };
}

export function reservationBody(values = {}) {
  return {
    date_debut: values.from ?? values.dateDebut,
    date_fin: values.to ?? values.dateFin,
    nombre_adultes: Number(values.adults ?? values.nombreAdultes ?? 1),
    nombre_enfants: Number(values.children ?? values.nombreEnfants ?? 0),
  };
}

export function aubergeBody(values = {}) {
  return {
    nom: String(values.nom ?? "").trim(),
    adresse: String(values.adresse ?? "").trim(),
    ville: String(values.ville ?? "").trim(),
    telephone: String(values.telephone ?? "").trim(),
    description: String(values.description ?? "").trim(),
  };
}