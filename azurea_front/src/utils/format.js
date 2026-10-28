export const money = (amount) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${value}T12:00:00`))
    : '—';

export const localToday = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

export const roleNames = {
  ADMIN: 'Administrateur',
  RECEPTIONNISTE: 'Réception',
  CLIENT: 'Espace client',
};

export const roleBase = {
  CLIENT: '/client/dashboard',
  RECEPTIONNISTE: '/reception/dashboard',
  ADMIN: '/admin/dashboard',
};

export const statusNames = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  ANNULEE: 'Annulée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  DISPONIBLE: 'Disponible',
  OCCUPEE: 'Occupée',
  EN_NETTOYAGE: 'En nettoyage',
  EN_MAINTENANCE: 'En maintenance',
  NON_PAYEE: 'Non payée',
  PARTIELLEMENT_PAYEE: 'Partiellement payée',
  PAYEE: 'Payée',
};
