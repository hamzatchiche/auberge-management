import { useState } from 'react';
import { useMockData } from '../../hooks/useMockData';
import {
  balance,
  entity,
  invoiceTotal,
  recordPayment,
  saveEntity,
} from '../../services/mock';
import {
  checkInReservation,
  checkOutReservation,
} from '../../services/workflows';
import {
  Button,
  Input,
  PageHead,
  Select,
  Status,
} from '../../components/ui';
import {
  EmptyPage,
  EntityModal,
  notify,
} from '../../components/ManagementData';
import {
  InvoiceDetailPage,
  InvoicesPage,
  ReservationDetailPage,
  ReservationsPage,
} from '../shared/ReservationPages';
import { DashboardPage } from '../management/DashboardPages';
import {
  formatDate,
  localToday,
  money,
  statusNames,
} from '../../utils/format';

export function ReceptionPage({ path, id }) {
  if (path === '/reception/dashboard') return <DashboardPage role="RECEPTIONNISTE" />;
  if (path === '/reception/chambres') return <RoomManagement />;
  if (path === '/reception/reservations') {
    return <ReservationsPage role="RECEPTIONNISTE" />;
  }
  if (path.startsWith('/reception/reservations/')) {
    return <ReservationDetailPage role="RECEPTIONNISTE" id={id} />;
  }
  if (path === '/reception/clients') return <ClientDirectory />;
  if (path === '/reception/services') return <ServiceManagement />;
  if (path === '/reception/factures') return <InvoicesPage role="RECEPTIONNISTE" />;
  if (path.startsWith('/reception/factures/')) {
    return <InvoiceDetailPage role="RECEPTIONNISTE" id={id} />;
  }
  if (path === '/reception/paiements') return <CashPayments />;
  if (path === '/reception/check-in-out') return <TodayArrivals />;
  return <EmptyPage text="Cette page n’existe pas dans l’espace réception." />;
}

function RoomManagement() {
  const data = useMockData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const openEditor = (room = null) => {
    setSelectedRoom(room);
    setModalOpen(true);
  };

  const rooms = data.rooms.filter(
    (room) =>
      (!query || room.numero.includes(query)) &&
      (!status || room.statut === status),
  );

  return (
    <>
      <PageHead
        title="Chambres"
        subtitle="État opérationnel des chambres de Dar Séléné."
        action={
          <Button kind="primary" onClick={() => openEditor()}>
            Ajouter une chambre
          </Button>
        }
      />
      <div className="panel">
        <div className="filters">
          <input
            className="input"
            placeholder="Rechercher un numéro…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tous les états</option>
            {['DISPONIBLE', 'OCCUPEE', 'EN_NETTOYAGE', 'EN_MAINTENANCE'].map(
              (value) => (
                <option key={value} value={value}>
                  {statusNames[value]}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Chambre</th>
                <th>Type</th>
                <th>Capacité</th>
                <th>Tarif / nuit</th>
                <th>Statut opérationnel</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td><b>{room.numero}</b></td>
                  <td>{room.type}</td>
                  <td>{room.capacite}</td>
                  <td>{money(room.prixNuit)}</td>
                  <td><Status value={room.statut} /></td>
                  <td>
                    <Button kind="small" onClick={() => openEditor(room)}>
                      Modifier
                    </Button>{' '}
                    <select
                      aria-label={`Statut de la chambre ${room.numero}`}
                      className="select"
                      style={{ width: 145, padding: 7 }}
                      value={room.statut}
                      onChange={(event) =>
                        saveEntity(
                          'rooms',
                          entity('rooms').map((item) =>
                            item.id === room.id
                              ? { ...item, statut: event.target.value }
                              : item,
                          ),
                        )
                      }
                    >
                      {[
                        'DISPONIBLE',
                        'OCCUPEE',
                        'EN_NETTOYAGE',
                        'EN_MAINTENANCE',
                      ].map((value) => (
                        <option value={value} key={value}>
                          {statusNames[value]}
                        </option>
                      ))}
                    </select>{' '}
                    <Button
                      kind="small danger"
                      onClick={() => {
                        if (!window.confirm('Supprimer cette chambre ?')) return;
                        saveEntity(
                          'rooms',
                          entity('rooms').filter((item) => item.id !== room.id),
                        );
                      }}
                    >
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rooms.length && <div className="empty">Aucune chambre trouvée.</div>}
        </div>
      </div>
      {modalOpen && (
        <EntityModal
          type="room"
          item={selectedRoom}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function ServiceManagement() {
  const data = useMockData();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const openEditor = (service = null) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  return (
    <>
      <PageHead
        title="Services"
        subtitle="Les prestations proposées aux voyageurs."
        action={
          <Button kind="primary" onClick={() => openEditor()}>
            Ajouter un service
          </Button>
        }
      />
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Prix unitaire</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.services.map((service) => (
              <tr key={service.id}>
                <td><b>{service.nom}</b></td>
                <td>{service.description}</td>
                <td>{money(service.prixUnitaire)}</td>
                <td>
                  <Status value={service.actif ? 'DISPONIBLE' : 'ANNULEE'} />
                </td>
                <td>
                  <Button kind="small" onClick={() => openEditor(service)}>
                    Modifier
                  </Button>{' '}
                  <Button
                    kind="small"
                    onClick={() =>
                      saveEntity(
                        'services',
                        entity('services').map((item) =>
                          item.id === service.id
                            ? { ...item, actif: !item.actif }
                            : item,
                        ),
                      )
                    }
                  >
                    {service.actif ? 'Désactiver' : 'Activer'}
                  </Button>{' '}
                  <Button
                    kind="small danger"
                    onClick={() => {
                      if (!window.confirm('Supprimer ce service ?')) return;
                      saveEntity(
                        'services',
                        entity('services').filter(
                          (item) => item.id !== service.id,
                        ),
                      );
                    }}
                  >
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <EntityModal
          type="service"
          item={selectedService}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function ClientDirectory() {
  const data = useMockData();
  const [query, setQuery] = useState('');
  const clients = data.users.filter(
    (user) =>
      user.role === 'CLIENT' &&
      `${user.prenom} ${user.nom} ${user.email}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <>
      <PageHead
        title="Clients"
        subtitle="Coordonnées et historique des voyageurs."
      />
      <div className="panel">
        <input
          className="input"
          placeholder="Rechercher un nom ou une adresse e-mail…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="table-wrap" style={{ marginTop: 15 }}>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>E-mail</th>
                <th>Téléphone</th>
                <th>Séjours</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.prenom} {client.nom}</td>
                  <td>{client.email}</td>
                  <td>{client.tel}</td>
                  <td>
                    {data.reservations.filter(
                      (booking) => booking.clientId === client.id,
                    ).length}
                  </td>
                  <td>
                    <Status value={client.active ? 'DISPONIBLE' : 'ANNULEE'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!clients.length && <div className="empty">Aucun client trouvé.</div>}
        </div>
      </div>
    </>
  );
}

function CashPayments() {
  const data = useMockData();
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const openInvoices = data.invoices.filter((invoice) => balance(invoice) > 0);

  const registerPayment = (event) => {
    event.preventDefault();
    try {
      const session = JSON.parse(
        localStorage.getItem('auberge-session') || '{}',
      );
      recordPayment(
        invoiceId,
        amount,
        `${session.prenom || 'Youssef'} ${session.nom || 'Amrani'}`,
      );
      notify('Règlement en espèces enregistré.');
      setAmount('');
    } catch (error) {
      notify(error.message);
    }
  };

  return (
    <>
      <PageHead
        title="Paiements en espèces"
        subtitle="Enregistrez les règlements réalisés à la réception."
      />
      <div className="stat-columns">
        <div className="panel">
          <h3>Nouveau règlement</h3>
          <form onSubmit={registerPayment}>
            <Select
              label="Facture à régler"
              value={invoiceId}
              onChange={(event) => setInvoiceId(event.target.value)}
              options={[
                ['', 'Choisir une facture'],
                ...openInvoices.map((invoice) => [
                  invoice.id,
                  `${invoice.numero} — solde ${money(balance(invoice))}`,
                ]),
              ]}
            />
            <Input
              label="Montant reçu (MAD)"
              type="number"
              min="0.01"
              step="0.01"
              max={
                invoiceId
                  ? balance(data.invoices.find((invoice) => invoice.id === invoiceId))
                  : undefined
              }
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <div className="notice-bar" style={{ marginBottom: 15 }}>
              Mode de paiement : Espèces uniquement.
            </div>
            <button className="btn primary" disabled={!invoiceId}>
              Enregistrer le paiement
            </button>
          </form>
        </div>
        <div className="panel">
          <h3>Historique récent</h3>
          {data.payments.slice(0, 8).map((payment) => (
            <div
              key={payment.id}
              style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}
            >
              <b>{money(payment.montant)}</b> · Espèces
              <div className="muted" style={{ fontSize: 12 }}>
                {payment.enregistrePar} · {formatDate(payment.datePaiement)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TodayArrivals() {
  const data = useMockData();
  const today = localToday();
  const arrivals = data.reservations.filter(
    (booking) =>
      booking.dateDebut === today && booking.statut === 'CONFIRMEE',
  );
  const departures = data.reservations.filter(
    (booking) =>
      booking.dateFin === today && booking.statut === 'EN_COURS',
  );

  const checkIn = (booking) => {
    if (booking.statut === 'ANNULEE') {
      notify('Une réservation annulée ne peut pas faire l’objet d’un check-in.');
      return;
    }
    if (!window.confirm('Confirmer l’arrivée dans cette chambre ?')) return;
    try {
      checkInReservation(booking);
      notify('Check-in effectué. Chambre marquée occupée.');
    } catch (error) {
      notify(error.message);
    }
  };
  const checkOut = (booking) => {
    if (!window.confirm('Confirmer le départ de cette chambre ?')) return;
    checkOutReservation(booking);
    notify('Check-out effectué. Chambre envoyée au nettoyage.');
  };

  return (
    <>
      <PageHead
        title="Arrivées & départs"
        subtitle={`Préparez l’accueil et clôturez les séjours du ${formatDate(today)}.`}
      />
      <div className="stat-columns">
        <div className="panel">
          <h3>Arrivées attendues</h3>
          {arrivals.map((booking) => (
            <CheckRow
              key={booking.id}
              booking={booking}
              label="Confirmer l’arrivée"
              onAction={() => checkIn(booking)}
            />
          ))}
          {!arrivals.length && (
            <div className="empty">Aucune arrivée prévue aujourd’hui.</div>
          )}
        </div>
        <div className="panel">
          <h3>Départs attendus</h3>
          {departures.map((booking) => (
            <CheckRow
              key={booking.id}
              booking={booking}
              label="Confirmer le départ"
              onAction={() => checkOut(booking)}
            />
          ))}
          {!departures.length && (
            <div className="empty">Aucun départ prévu aujourd’hui.</div>
          )}
        </div>
      </div>
    </>
  );
}

function CheckRow({ booking, label, onAction }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
      <b>
        {roomFor(booking.chambreId)?.numero} ·{' '}
        {userFor(booking.clientId)?.prenom} {userFor(booking.clientId)?.nom}
      </b>
      <div className="muted" style={{ fontSize: 12, margin: '5px 0 10px' }}>
        {booking.reference} · {formatDate(booking.dateDebut)} –{' '}
        {formatDate(booking.dateFin)}
      </div>
      <Button kind="small primary" onClick={onAction}>
        {label}
      </Button>
    </div>
  );
}
