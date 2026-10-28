import { useState } from 'react';
import { Link } from 'wouter';
import { Plus } from 'lucide-react';
import {
  balance,
  cancelReservation,
  createInvoice,
  invoiceStatus,
  invoiceTotal,
  reservationTotal,
  roomFor,
  userFor,
} from '../../services/mock';
import {
  changeReservationStatus,
  checkInReservation,
  checkOutReservation,
} from '../../services/workflows';
import { useMockData } from '../../hooks/useMockData';
import { Button, PageHead, Status } from '../../components/ui';
import {
  EmptyPage,
  EntityModal,
  InvoiceView,
  ReservationTable,
  notify,
} from '../../components/ManagementData';
import { formatDate, localToday, money } from '../../utils/format';

export function ReservationsPage({ role }) {
  const data = useMockData();
  const isClient = role === 'CLIENT';
  const isReception = role === 'RECEPTIONNISTE';
  const currentUser = JSON.parse(
    localStorage.getItem('auberge-session') || '{}',
  );
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const rows = data.reservations.filter((booking) => {
    const customer =
      `${userFor(booking.clientId)?.prenom} ${userFor(booking.clientId)?.nom}`.toLowerCase();
    const roomNumber = roomFor(booking.chambreId)?.numero || '';
    const matchesQuery =
      !query ||
      `${booking.reference} ${customer} ${roomNumber}`
        .toLowerCase()
        .includes(query.toLowerCase());
    const matchesRole = !isClient || booking.clientId === currentUser.id;
    const matchesStatus = !status || booking.statut === status;
    const matchesPeriod =
      (!dateFrom || booking.dateFin >= dateFrom) &&
      (!dateTo || booking.dateDebut <= dateTo);
    return matchesQuery && matchesRole && matchesStatus && matchesPeriod;
  });

  return (
    <>
      <PageHead
        title={isClient ? 'Mes réservations' : 'Réservations'}
        subtitle={
          isClient
            ? 'Retrouvez les informations de vos séjours.'
            : 'Suivez les demandes et séjours de la maison.'
        }
        action={
          isReception && (
            <Button kind="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Nouvelle réservation
            </Button>
          )
        }
      />
      <div className="panel">
        <div className="filters">
          <input
            className="input"
            placeholder="Référence, client, chambre…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tous les statuts</option>
            {[
              'EN_ATTENTE',
              'CONFIRMEE',
              'EN_COURS',
              'TERMINEE',
              'ANNULEE',
            ].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <input
            className="input"
            aria-label="Séjour à partir du"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <input
            className="input"
            aria-label="Séjour jusqu’au"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
        <ReservationTable rows={rows} client={isClient} />
      </div>
      {createOpen && (
        <EntityModal
          type="reservation"
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  );
}

export function ReservationDetailPage({ role, id }) {
  const data = useMockData();
  const isClient = role === 'CLIENT';
  const isReception = role === 'RECEPTIONNISTE';
  const booking = data.reservations.find((item) => item.id === id);
  if (!booking) return <EmptyPage text="Cette réservation est introuvable." />;

  const invoice = data.invoices.find(
    (item) => item.reservationId === booking.id,
  );
  const canCancel =
    ['EN_ATTENTE', 'CONFIRMEE'].includes(booking.statut) &&
    booking.dateDebut > localToday();

  const confirmCheckIn = () => {
    if (!window.confirm('Confirmer l’arrivée dans cette chambre ?')) return;
    try {
      checkInReservation(booking);
      notify('Check-in effectué. Chambre marquée occupée.');
    } catch (error) {
      notify(error.message);
    }
  };

  const confirmCheckOut = () => {
    if (!window.confirm('Confirmer le départ de cette chambre ?')) return;
    checkOutReservation(booking);
    notify('Check-out effectué. Chambre envoyée au nettoyage.');
  };

  const cancel = () => {
    if (!window.confirm('Confirmer l’annulation de cette réservation ?')) return;
    try {
      cancelReservation(booking.id);
      notify('Réservation annulée.');
    } catch (error) {
      notify(error.message);
    }
  };

  return (
    <>
      <div className="breadcrumb">
        <Link href={`/${isClient ? 'client' : 'reception'}/reservations`}>
          Réservations
        </Link>{' '}
        / {booking.reference}
      </div>
      <PageHead
        title={`Réservation ${booking.reference}`}
        action={
          isReception &&
          booking.statut === 'EN_ATTENTE' && (
            <Button
              kind="gold"
              onClick={() => {
                changeReservationStatus(booking.id, 'CONFIRMEE');
                notify('Réservation confirmée.');
              }}
            >
              Confirmer
            </Button>
          )
        }
      />
      <div className="stat-columns">
        <div className="panel">
          <h3>Détails du séjour</h3>
          <p>
            <b>Client :</b> {userFor(booking.clientId)?.prenom}{' '}
            {userFor(booking.clientId)?.nom}
          </p>
          <p>
            <b>Chambre :</b> {roomFor(booking.chambreId)?.numero} —{' '}
            {roomFor(booking.chambreId)?.type}
          </p>
          <p><b>Arrivée :</b> {formatDate(booking.dateDebut)}</p>
          <p><b>Départ :</b> {formatDate(booking.dateFin)}</p>
          <p>
            <b>Voyageurs :</b> {booking.nombreAdultes} adulte(s),{' '}
            {booking.nombreEnfants} enfant(s)
          </p>
          <p><b>Montant estimé :</b> {money(reservationTotal(booking))}</p>
          <Status value={booking.statut} />
        </div>
        <div className="panel">
          <h3>Actions</h3>
          {isReception && booking.statut === 'CONFIRMEE' && (
            <Button kind="primary" onClick={confirmCheckIn}>
              Effectuer le check-in
            </Button>
          )}
          {isReception && booking.statut === 'EN_COURS' && (
            <Button kind="primary" onClick={confirmCheckOut}>
              Effectuer le check-out
            </Button>
          )}
          {invoice && (
            <p>
              <Link
                className="btn"
                href={`/${isClient ? 'client' : 'reception'}/factures/${invoice.id}`}
              >
                Consulter la facture {invoice.numero}
              </Link>
            </p>
          )}
          {canCancel && (
            <Button kind="danger" onClick={cancel}>
              Annuler la réservation
            </Button>
          )}
          {!canCancel && isClient && (
            <p className="muted" style={{ fontSize: 12 }}>
              Annulation possible uniquement avant l’arrivée, pour une demande
              en attente ou confirmée.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export function InvoicesPage({ role }) {
  const data = useMockData();
  const isClient = role === 'CLIENT';
  const currentUser = JSON.parse(
    localStorage.getItem('auberge-session') || '{}',
  );
  const [search, setSearch] = useState('');
  const invoices = data.invoices.filter((invoice) => {
    const booking = data.reservations.find(
      (item) => item.id === invoice.reservationId,
    );
    const belongsToClient =
      !isClient || booking?.clientId === currentUser.id;
    return (
      belongsToClient &&
      (!search || invoice.numero.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const createMissingInvoice = () => {
    const booking = data.reservations.find(
      (item) => !data.invoices.some((invoice) => invoice.reservationId === item.id),
    );
    if (!booking) {
      notify('Toutes les réservations disposent déjà d’une facture.');
      return;
    }
    createInvoice(booking.id);
    notify('Facture créée.');
  };

  return (
    <>
      <PageHead
        title={isClient ? 'Mes factures' : 'Facturation'}
        subtitle={
          isClient
            ? 'Consultez les montants et soldes de vos séjours.'
            : 'Factures calculées à partir des nuits et services associés.'
        }
        action={
          !isClient && (
            <Button onClick={createMissingInvoice}>
              <Plus size={15} /> Créer une facture
            </Button>
          )
        }
      />
      <div className="panel">
        <input
          className="input"
          placeholder="Rechercher un numéro de facture…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="table-wrap" style={{ marginTop: 15 }}>
          <table>
            <thead>
              <tr>
                <th>Facture</th>
                <th>Date</th>
                <th>Réservation</th>
                <th>Total</th>
                <th>Payé</th>
                <th>Solde</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const booking = data.reservations.find(
                  (item) => item.id === invoice.reservationId,
                );
                return (
                  <tr key={invoice.id}>
                    <td><b>{invoice.numero}</b></td>
                    <td>{formatDate(invoice.dateEmission)}</td>
                    <td>{booking?.reference}</td>
                    <td>{money(invoiceTotal(invoice))}</td>
                    <td>{money(invoice.montantPaye)}</td>
                    <td>{money(balance(invoice))}</td>
                    <td><Status value={invoiceStatus(invoice)} /></td>
                    <td>
                      <Link
                        className="btn small"
                        href={`/${isClient ? 'client' : 'reception'}/factures/${invoice.id}`}
                      >
                        Détail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!invoices.length && (
            <div className="empty">Aucune facture à afficher.</div>
          )}
        </div>
        <div className="notice-bar" style={{ marginTop: 15 }}>
          Les règlements se font à la réception, en espèces. Aucun paiement en
          ligne.
        </div>
      </div>
    </>
  );
}

export function InvoiceDetailPage({ role, id }) {
  const data = useMockData();
  const invoice = data.invoices.find((item) => item.id === id);
  if (!invoice) return <EmptyPage text="Facture introuvable." />;
  return (
    <>
      <PageHead title={`Facture ${invoice.numero}`} />
      <InvoiceView invoice={invoice} client={role === 'CLIENT'} />
    </>
  );
}
