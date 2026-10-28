import { createInvoice, entity, saveEntity, userFor, roomFor } from './mock';

export function changeReservationStatus(id, status) {
  saveEntity(
    'reservations',
    entity('reservations').map((booking) =>
      booking.id === id ? { ...booking, statut: status } : booking,
    ),
  );
}

export function checkInReservation(booking) {
  if (booking.statut === 'ANNULEE') {
    throw new Error('Une réservation annulée ne peut pas faire l’objet d’un check-in.');
  }
  saveEntity(
    'reservations',
    entity('reservations').map((item) =>
      item.id === booking.id ? { ...item, statut: 'EN_COURS' } : item,
    ),
  );
  saveEntity(
    'rooms',
    entity('rooms').map((room) =>
      room.id === booking.chambreId ? { ...room, statut: 'OCCUPEE' } : room,
    ),
  );
  createInvoice(booking.id);
}

export function checkOutReservation(booking) {
  saveEntity(
    'reservations',
    entity('reservations').map((item) =>
      item.id === booking.id ? { ...item, statut: 'TERMINEE' } : item,
    ),
  );
  saveEntity(
    'rooms',
    entity('rooms').map((room) =>
      room.id === booking.chambreId
        ? { ...room, statut: 'EN_NETTOYAGE' }
        : room,
    ),
  );
}

export function toggleUserActive(user) {
  const users = entity('users');
  const activeAdmins = users.filter(
    (candidate) => candidate.role === 'ADMIN' && candidate.active,
  );
  if (
    user.active &&
    user.role === 'ADMIN' &&
    activeAdmins.length <= 1
  ) {
    throw new Error('Impossible de désactiver le dernier administrateur actif.');
  }
  saveEntity(
    'users',
    users.map((candidate) =>
      candidate.id === user.id
        ? { ...candidate, active: !candidate.active }
        : candidate,
    ),
  );
}

export function arrivalDescription(booking) {
  return `${userFor(booking.clientId)?.prenom || ''} · Chambre ${
    roomFor(booking.chambreId)?.numero || ''
  }`;
}
