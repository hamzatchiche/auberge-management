// Calculs d'affichage sur les objets normalisés (remplacent ceux de services/mock).
const DAY = 86400000;

export const nights = (b) =>
  Math.max(
    0,
    Math.round(
      (new Date(b.dateFin + "T12:00:00") - new Date(b.dateDebut + "T12:00:00")) / DAY,
    ),
  );

const servicesTotal = (b) =>
  (b.services || []).reduce((s, x) => s + x.quantite * x.prixUnitaireApplique, 0);

export const reservationTotal = (b) =>
  b.prixTotal ?? nights(b) * (b.chambre?.prixNuit ?? 0) + servicesTotal(b);

export const invoiceTotal = (i) =>
  i.montantTotal || (i.reservation ? reservationTotal(i.reservation) : 0);

export const balance = (i) => Math.max(0, invoiceTotal(i) - i.montantPaye);

export const invoiceStatus = (i) =>
  i.statut ||
  (balance(i) <= 0 ? "PAYEE" : i.montantPaye > 0 ? "PARTIELLEMENT_PAYEE" : "NON_PAYEE");