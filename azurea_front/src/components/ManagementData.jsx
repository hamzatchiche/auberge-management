import { Link } from 'wouter';
import { CircleAlert, Printer, Eye } from 'lucide-react';
import {
  balance,
  entity,
  invoiceStatus,
  invoiceTotal,
  nights,
  read,
  reservationTotal,
  roomFor,
  userFor,
} from '../services/mock';
import { Button, FormButton, Modal, Status } from './ui';
import { formatDate, money, roleNames, statusNames } from '../utils/format';

export function EmptyPage({ text }) {
  return (
    <div className="panel empty">
      <CircleAlert size={25} />
      <p>{text}</p>
      <Link className="btn" href="/">Retour à l’accueil</Link>
    </div>
  );
}

export function ReservationTable({ rows, client = false }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Client</th>
            <th>Chambre</th>
            <th>Arrivée</th>
            <th>Départ</th>
            <th>Montant</th>
            <th>Statut</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((booking) => (
            <tr key={booking.id}>
              <td><b>{booking.reference}</b></td>
              <td>
                {userFor(booking.clientId)?.prenom}{' '}
                {userFor(booking.clientId)?.nom}
              </td>
              <td>{roomFor(booking.chambreId)?.numero}</td>
              <td>{formatDate(booking.dateDebut)}</td>
              <td>{formatDate(booking.dateFin)}</td>
              <td>{money(reservationTotal(booking))}</td>
              <td><Status value={booking.statut} /></td>
              <td>
                <Link
                  className="btn small"
                  href={`/${client ? 'client' : 'reception'}/reservations/${booking.id}`}
                >
                  <Eye size={14} /> Voir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty">Aucune réservation pour le moment.</div>
      )}
    </div>
  );
}

export function InvoiceView({ invoice, client = false }) {
  const booking = entity('reservations').find(
    (item) => item.id === invoice.reservationId,
  );
  if (!booking) {
    return <div className="empty">Réservation associée introuvable.</div>;
  }

  const room = roomFor(booking.chambreId);
  const nightlyRate = booking.prixNuitApplique ?? room?.prixNuit ?? 0;
  const serviceLines =
    invoice.services ||
    booking.services?.map((service) => ({
      nom:
        entity('services').find((item) => item.id === service.serviceId)?.nom ||
        'Service',
      quantite: service.quantite,
      prix: service.prixUnitaireApplique,
    })) ||
    [];

  return (
    <>
      <div className="panel" id="invoice-print">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 15,
          }}
        >
          <div>
            <div className="brand">
              <span className="brand-mark">D</span>
              DAR SÉLÉNÉ
            </div>
            <p className="muted">
              {read().auberge.adresse}
              {' · '}
              {read().auberge.ville}
              <br />
              {read().auberge.telephone}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Facture</div>
            <h2 className="serif">{invoice.numero}</h2>
            <span>Émise le {formatDate(invoice.dateEmission)}</span>
          </div>
        </div>
        <hr
          style={{
            border: 0,
            borderTop: '1px solid var(--line)',
            margin: '20px 0',
          }}
        />
        <div className="form-grid">
          <div>
            <b>Client</b>
            <p>
              {userFor(booking.clientId)?.prenom}{' '}
              {userFor(booking.clientId)?.nom}
              <br />
              {userFor(booking.clientId)?.email}
            </p>
          </div>
          <div>
            <b>Séjour</b>
            <p>
              Réf. {booking.reference} · Chambre {room?.numero}
              <br />
              {formatDate(booking.dateDebut)} – {formatDate(booking.dateFin)}
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Sous-total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Chambre {room?.numero} — {nights(booking)} nuit(s)
                </td>
                <td>{nights(booking)}</td>
                <td>{money(nightlyRate)}</td>
                <td>{money(nights(booking) * nightlyRate)}</td>
              </tr>
              {serviceLines.map((service, index) => (
                <tr key={`${service.nom}-${index}`}>
                  <td>{service.nom}</td>
                  <td>{service.quantite}</td>
                  <td>{money(service.prix)}</td>
                  <td>{money(service.quantite * service.prix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ maxWidth: 300, margin: '20px 0 0 auto' }}>
          <p>
            Total <b style={{ float: 'right' }}>{money(invoiceTotal(invoice))}</b>
          </p>
          <p>
            Déjà réglé{' '}
            <b style={{ float: 'right' }}>{money(invoice.montantPaye)}</b>
          </p>
          <p>
            Solde restant{' '}
            <b style={{ float: 'right', color: '#a34e45' }}>
              {money(balance(invoice))}
            </b>
          </p>
          <Status value={invoiceStatus(invoice)} />
        </div>
        <div className="notice-bar no-print" style={{ marginTop: 20 }}>
          Règlement à la réception, en espèces uniquement. Aucun paiement en
          ligne.
        </div>
      </div>
      <div className="no-print" style={{ display: 'flex', gap: 10 }}>
        <Button onClick={() => window.print()}>
          <Printer size={15} /> Imprimer
        </Button>
        {client && (
          <span className="muted" style={{ alignSelf: 'center', fontSize: 12 }}>
            Pour régler, adressez-vous à la réception.
          </span>
        )}
      </div>
    </>
  );
}

export function EntityModal({ type, item, onClose }) {
  const data = read();
  const titles = {
    room: item ? 'Modifier la chambre' : 'Ajouter une chambre',
    service: item ? 'Modifier le service' : 'Ajouter un service',
    user: item ? 'Modifier l’utilisateur' : 'Créer un utilisateur',
    reservation: 'Nouvelle réservation',
  };

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      if (type === 'room') {
        const rooms = entity('rooms');
        const room = {
          id: item?.id || `r${Date.now()}`,
          numero: form.get('numero'),
          type: form.get('type'),
          capacite: Number(form.get('capacite')),
          prixNuit: Number(form.get('prixNuit')),
          statut: form.get('statut'),
          description:
            form.get('description') ||
            'Une chambre de caractère à Dar Séléné.',
          img: item?.img || '/chambre-double.jpg',
        };
        saveEntity(
          'rooms',
          item
            ? rooms.map((existing) => (existing.id === item.id ? room : existing))
            : [...rooms, room],
        );
      }

      if (type === 'service') {
        const services = entity('services');
        const service = {
          id: item?.id || `s${Date.now()}`,
          nom: form.get('nom'),
          description: form.get('description'),
          prixUnitaire: Number(form.get('prixUnitaire')),
          actif: form.get('actif') === 'true',
        };
        saveEntity(
          'services',
          item
            ? services.map((existing) =>
                existing.id === item.id ? service : existing,
              )
            : [...services, service],
        );
      }

      if (type === 'user') {
        const session = JSON.parse(
          localStorage.getItem('auberge-session') || '{}',
        );
        if (item?.id === session.id && form.get('role') !== item.role) {
          notify('Vous ne pouvez pas modifier votre propre rôle.');
          return;
        }
        const users = entity('users');
        const user = {
          id: item?.id || `u${Date.now()}`,
          prenom: form.get('prenom'),
          nom: form.get('nom'),
          email: form.get('email'),
          tel: form.get('tel'),
          role: form.get('role'),
          active: form.get('active') === 'true',
        };
        if (
          item?.role === 'ADMIN' &&
          item.active &&
          !user.active &&
          users.filter((candidate) => candidate.role === 'ADMIN' && candidate.active)
            .length <= 1
        ) {
          notify('Le dernier administrateur actif ne peut pas être désactivé.');
          return;
        }
        saveEntity(
          'users',
          item
            ? users.map((existing) => (existing.id === item.id ? user : existing))
            : [...users, user],
        );
      }

      if (type === 'reservation') {
        const services = [...event.currentTarget.querySelectorAll(
          '[data-service]:checked',
        )].map((input) => {
          const service = entity('services').find(
            (candidate) => candidate.id === input.value,
          );
          return {
            serviceId: service.id,
            quantite: 1,
            prixUnitaireApplique: service.prixUnitaire,
          };
        });
        createReservation({
          clientId: form.get('clientId'),
          chambreId: form.get('chambreId'),
          dateDebut: form.get('dateDebut'),
          dateFin: form.get('dateFin'),
          nombreAdultes: Number(form.get('nombreAdultes')),
          nombreEnfants: Number(form.get('nombreEnfants')),
          services,
        });
      }

      notify(
        type === 'reservation'
          ? 'Demande de réservation créée.'
          : 'Modifications enregistrées.',
      );
      onClose();
    } catch (error) {
      notify(error.message || 'Une erreur est survenue.');
    }
  };

  return (
    <Modal title={titles[type]} onClose={onClose}>
      <form onSubmit={submit}>
        {type === 'room' && <RoomFields item={item} />}
        {type === 'service' && <ServiceFields item={item} />}
        {type === 'user' && <UserFields item={item} />}
        {type === 'reservation' && <ReservationFields data={data} />}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 9,
            marginTop: 18,
          }}
        >
          <Button onClick={onClose}>Annuler</Button>
          <FormButton>Enregistrer</FormButton>
        </div>
      </form>
    </Modal>
  );
}

function RoomFields({ item }) {
  return (
    <>
      <div className="form-grid">
        <Input label="Numéro" name="numero" defaultValue={item?.numero} required />
        <Select
          label="Type"
          name="type"
          defaultValue={item?.type || 'Chambre double'}
          options={[
            'Chambre double',
            'Chambre supérieure',
            'Suite familiale',
            'Suite terrasse',
          ].map((type) => [type, type])}
        />
        <Input
          label="Capacité"
          name="capacite"
          type="number"
          min="1"
          defaultValue={item?.capacite || 2}
          required
        />
        <Input
          label="Prix par nuit (MAD)"
          name="prixNuit"
          type="number"
          min="1"
          defaultValue={item?.prixNuit || 850}
          required
        />
      </div>
      <Select
        label="Statut opérationnel"
        name="statut"
        defaultValue={item?.statut || 'DISPONIBLE'}
        options={['DISPONIBLE', 'OCCUPEE', 'EN_NETTOYAGE', 'EN_MAINTENANCE'].map(
          (status) => [status, statusNames[status]],
        )}
      />
      <div className="form-field">
        <label>Description</label>
        <textarea
          className="textarea"
          name="description"
          defaultValue={item?.description}
        />
      </div>
    </>
  );
}

function ServiceFields({ item }) {
  return (
    <>
      <Input label="Nom du service" name="nom" defaultValue={item?.nom} required />
      <div className="form-field">
        <label>Description</label>
        <textarea
          className="textarea"
          name="description"
          defaultValue={item?.description}
          required
        />
      </div>
      <Input
        label="Prix unitaire (MAD)"
        name="prixUnitaire"
        type="number"
        min="0"
        defaultValue={item?.prixUnitaire || 0}
        required
      />
      <Select
        label="État"
        name="actif"
        defaultValue={String(item?.actif ?? true)}
        options={[
          ['true', 'Actif'],
          ['false', 'Inactif'],
        ]}
      />
    </>
  );
}

function UserFields({ item }) {
  return (
    <>
      <div className="form-grid">
        <Input label="Prénom" name="prenom" defaultValue={item?.prenom} required />
        <Input label="Nom" name="nom" defaultValue={item?.nom} required />
        <Input
          label="Adresse e-mail"
          name="email"
          type="email"
          defaultValue={item?.email}
          required
        />
        <Input label="Téléphone" name="tel" defaultValue={item?.tel} />
      </div>
      <Select
        label="Rôle"
        name="role"
        defaultValue={item?.role || 'CLIENT'}
        options={Object.entries(roleNames)}
      />
      <Select
        label="État du compte"
        name="active"
        defaultValue={String(item?.active ?? true)}
        options={[
          ['true', 'Actif'],
          ['false', 'Désactivé'],
        ]}
      />
      <div className="notice-bar">
        Aucun mot de passe n’est enregistré dans les données de démonstration.
      </div>
    </>
  );
}

function ReservationFields({ data }) {
  return (
    <>
      <Select
        label="Client"
        name="clientId"
        options={data.users
          .filter((user) => user.role === 'CLIENT')
          .map((user) => [
            user.id,
            `${user.prenom} ${user.nom} · ${user.email}`,
          ])}
      />
      <Select
        label="Chambre"
        name="chambreId"
        options={data.rooms
          .filter(
            (room) =>
              !['EN_NETTOYAGE', 'EN_MAINTENANCE'].includes(room.statut),
          )
          .map((room) => [
            room.id,
            `Chambre ${room.numero} · ${money(room.prixNuit)}/nuit`,
          ])}
      />
      <div className="form-grid">
        <Input label="Arrivée" name="dateDebut" type="date" required />
        <Input label="Départ" name="dateFin" type="date" required />
        <Input
          label="Adultes"
          name="nombreAdultes"
          type="number"
          min="1"
          defaultValue="2"
          required
        />
        <Input
          label="Enfants"
          name="nombreEnfants"
          type="number"
          min="0"
          defaultValue="0"
          required
        />
      </div>
      <div className="form-field">
        <label>Services à ajouter</label>
        {data.services
          .filter((service) => service.actif)
          .map((service) => (
            <label
              key={service.id}
              style={{ display: 'block', fontSize: 13, padding: '5px 0' }}
            >
              <input type="checkbox" data-service value={service.id} />{' '}
              {service.nom} · {money(service.prixUnitaire)}
            </label>
          ))}
      </div>
      <div className="notice-bar">
        Le système vérifie les dates de départ et les chevauchements.
      </div>
    </>
  );
}

export function notify(message) {
  window.dispatchEvent(
    new CustomEvent('auberge-toast', { detail: message }),
  );
}
