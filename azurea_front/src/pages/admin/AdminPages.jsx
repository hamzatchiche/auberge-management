import { useState } from 'react';
import { Link } from 'wouter';
import {
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BedDouble,
  CalendarDays,
  CreditCard,
  Download,
  Eye,
  Pencil,
  Plus,
  Receipt,
} from 'lucide-react';
import {
  balance,
  reservationTotal,
  roomFor,
  saveAuberge,
  userFor,
} from '../../services/mock';
import { toggleUserActive } from '../../services/workflows';
import { useMockData } from '../../hooks/useMockData';
import {
  Button,
  FormButton,
  Input,
  Metric,
  PageHead,
  Status,
} from '../../components/ui';
import {
  EmptyPage,
  EntityModal,
  notify,
  ReservationTable,
} from '../../components/ManagementData';
import { DashboardPage, ReservationTrend } from '../management/DashboardPages';
import {
  formatDate,
  localToday,
  money,
  roleNames,
  statusNames,
} from '../../utils/format';

export function AdminPage({ path }) {
  if (path === '/admin/dashboard') return <DashboardPage role="ADMIN" />;
  if (path === '/admin/utilisateurs') return <UserManagement />;
  if (path.startsWith('/admin/utilisateurs/')) {
    return <UserDetails id={id} />;
  }
  if (path === '/admin/roles') return <RoleMatrix />;
  if (path === '/admin/configuration') return <AubergeConfiguration />;
  if (path === '/admin/statistiques' || path === '/admin/rapports') {
    return <AdminReports path={path} />;
  }
  return <EmptyPage text="Cette page n’existe pas dans l’espace admin." />;
}

function UserManagement() {
  const data = useMockData();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [editor, setEditor] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const users = data.users.filter((user) => {
    const matchesRole = !role || user.role === role;
    const matchesQuery = `${user.prenom} ${user.nom} ${user.email}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesRole && matchesQuery;
  });

  const toggleStatus = (user) => {
    if (
      !window.confirm(
        `${user.active ? 'Désactiver' : 'Réactiver'} le compte de ${user.prenom} ${user.nom} ?`,
      )
    ) {
      return;
    }
    try {
      toggleUserActive(user);
      notify(user.active ? 'Compte désactivé.' : 'Compte réactivé.');
    } catch (error) {
      notify(error.message);
    }
  };

  return (
    <>
      <PageHead
        title="Utilisateurs"
        subtitle="Comptes et accès de l’équipe et des clients."
        action={
          <Button
            kind="primary"
            onClick={() => {
              setEditor(null);
              setCreateOpen(true);
            }}
          >
            <Plus size={15} /> Nouvel utilisateur
          </Button>
        }
      />
      <div className="panel">
        <div className="filters">
          <input
            className="input"
            placeholder="Nom ou e-mail…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="select"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">Tous les rôles</option>
            {Object.entries(roleNames).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>E-mail</th>
                <th>Rôle</th>
                <th>Compte</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.prenom} {user.nom}</td>
                  <td>{user.email}</td>
                  <td>{roleNames[user.role]}</td>
                  <td>
                    <Status value={user.active ? 'DISPONIBLE' : 'ANNULEE'} />
                  </td>
                  <td>
                    <Link
                      className="btn small"
                      href={`/admin/utilisateurs/${user.id}`}
                    >
                      <Eye size={14} /> Détail
                    </Link>{' '}
                    <Button
                      kind="small"
                      onClick={() => {
                        setEditor(user);
                        setCreateOpen(true);
                      }}
                    >
                      <Pencil size={14} /> Modifier
                    </Button>{' '}
                    <Button
                      kind="small danger"
                      onClick={() => toggleStatus(user)}
                    >
                      {user.active ? 'Désactiver' : 'Réactiver'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <div className="empty">Aucun utilisateur trouvé.</div>}
        </div>
      </div>
      {createOpen && (
        <EntityModal
          type="user"
          item={editor}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  );
}

function UserDetails({ id }) {
  const data = useMockData();
  const user = data.users.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  if (!user) return <EmptyPage text="Utilisateur introuvable." />;

  const clientBookings =
    user.role === 'CLIENT'
      ? data.reservations.filter((booking) => booking.clientId === user.id)
      : [];
  return (
    <>
      <div className="breadcrumb">
        <Link href="/admin/utilisateurs">Utilisateurs</Link> / {user.prenom}{' '}
        {user.nom}
      </div>
      <PageHead
        title={`${user.prenom} ${user.nom}`}
        action={
          <Button onClick={() => setEditing(true)}>
            <Pencil size={15} /> Modifier
          </Button>
        }
      />
      <div className="panel" style={{ maxWidth: 700 }}>
        <p><b>E-mail :</b> {user.email}</p>
        <p><b>Téléphone :</b> {user.tel || '—'}</p>
        <p><b>Rôle :</b> {roleNames[user.role]}</p>
        <p><b>État :</b> {user.active ? 'Actif' : 'Désactivé'}</p>
        {user.role === 'CLIENT' && (
          <>
            <h3>Historique des réservations</h3>
            <ReservationTable rows={clientBookings} />
          </>
        )}
      </div>
      {editing && (
        <EntityModal
          type="user"
          item={user}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

function RoleMatrix() {
  const rows = [
    ['Consulter les chambres', 'Oui', 'Oui', 'Oui'],
    ['Gérer les réservations', 'Ses séjours', 'Oui', 'Oui'],
    ['Clients et paiements', 'Non', 'Oui', 'Oui'],
    ['Gérer les utilisateurs', 'Non', 'Non', 'Oui'],
    ['Configuration et rapports', 'Non', 'Non', 'Oui'],
  ];
  return (
    <>
      <PageHead
        title="Rôles & accès"
        subtitle="Matrice indicative des accès du prototype."
      />
      <div className="notice-bar">
        Les autorisations réelles devront être imposées côté API Laravel.
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fonctionnalité</th>
              <th>Client</th>
              <th>Réceptionniste</th>
              <th>Administrateur</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => <td key={cell}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AubergeConfiguration() {
  const { auberge } = useMockData();
  const saveConfiguration = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveAuberge({
      nom: form.get('nom'),
      adresse: form.get('adresse'),
      ville: form.get('ville'),
      telephone: form.get('telephone'),
      email: form.get('email'),
      description: form.get('description'),
    });
    notify('Configuration enregistrée.');
  };

  return (
    <>
      <PageHead
        title="Configuration de l’auberge"
        subtitle="Une seule maison, un seul espace de configuration."
      />
      <div className="panel" style={{ maxWidth: 760 }}>
        <form onSubmit={saveConfiguration}>
          <Input
            label="Nom de l’auberge"
            name="nom"
            defaultValue={auberge.nom}
            required
          />
          <div className="form-grid">
            <Input label="Adresse" name="adresse" defaultValue={auberge.adresse} />
            <Input label="Ville" name="ville" defaultValue={auberge.ville} />
            <Input
              label="Téléphone"
              name="telephone"
              defaultValue={auberge.telephone}
            />
            <Input
              label="E-mail de contact"
              name="email"
              type="email"
              defaultValue={auberge.email}
            />
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea
              className="textarea"
              name="description"
              defaultValue={auberge.description}
            />
          </div>
          <FormButton>Enregistrer les informations</FormButton>
        </form>
      </div>
    </>
  );
}

function AdminReports() {
  const data = useMockData();
  const today = localToday();
  const initialStart = (() => {
    const date = new Date();
    date.setDate(date.getDate() - 180);
    return toIsoDate(date);
  })();
  const [from, setFrom] = useState(initialStart);
  const [to, setTo] = useState(today);
  const rangeIsValid = Boolean(from && to && to >= from);
  const reservations = rangeIsValid
    ? data.reservations.filter(
        (booking) => booking.dateDebut <= to && booking.dateFin >= from,
      )
    : [];
  const payments = rangeIsValid
    ? data.payments.filter(
        (payment) => payment.datePaiement >= from && payment.datePaiement <= to,
      )
    : [];
  const unpaidInvoices = rangeIsValid
    ? data.invoices.filter(
        (invoice) =>
          balance(invoice) > 0 &&
          reservations.some(
            (booking) => booking.id === invoice.reservationId,
          ),
      )
    : [];
  const intervalDays = rangeIsValid
    ? Math.max(
        1,
        Math.ceil(
          (new Date(`${to}T12:00:00`) - new Date(`${from}T12:00:00`)) /
            86400000,
        ) + 1,
      )
    : 1;
  const occupiedNights = reservations
    .filter((booking) => booking.statut !== 'ANNULEE')
    .reduce((total, booking) => {
      const start = Math.max(
        new Date(`${from}T12:00:00`).getTime(),
        new Date(`${booking.dateDebut}T12:00:00`).getTime(),
      );
      const end = Math.min(
        new Date(`${to}T12:00:00`).getTime(),
        new Date(`${booking.dateFin}T12:00:00`).getTime(),
      );
      return total + Math.max(0, Math.ceil((end - start) / 86400000));
    }, 0);
  const occupancy = Math.min(
    100,
    Math.round(
      (occupiedNights / (intervalDays * Math.max(1, data.rooms.length))) * 100,
    ),
  );
  const monthlyTrend = makeMonthlyTrend(reservations, payments, from, to);

  const exportCsv = () => {
    const rows = [
      ['Référence', 'Client', 'Chambre', 'Arrivée', 'Départ', 'Statut', 'Total MAD'],
      ...reservations.map((booking) => [
        booking.reference,
        `${userFor(booking.clientId)?.prenom} ${userFor(booking.clientId)?.nom}`,
        roomFor(booking.chambreId)?.numero,
        booking.dateDebut,
        booking.dateFin,
        statusNames[booking.statut],
        reservationTotal(booking),
      ]),
    ];
    const csv = `\ufeff${rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';'),
      )
      .join('\n')}`;
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapport-dar-selene.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHead
        title="Statistiques"
        subtitle="Indicateurs calculés sur la période sélectionnée."
        action={
          <Button onClick={exportCsv}>
            <Download size={15} /> Exporter CSV
          </Button>
        }
      />
      <div className="filters">
        <Input
          label="Du"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <Input
          label="Au"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
        <Button
          onClick={() =>
            notify(
              rangeIsValid
                ? 'Période appliquée.'
                : 'Choisissez une période valide.',
            )
          }
        >
          Appliquer
        </Button>
      </div>
      {!rangeIsValid && (
        <div className="warning">
          La date de fin doit être égale ou postérieure à la date de début.
        </div>
      )}
      <div className="cards">
        <Metric
          label="Réservations de la période"
          value={reservations.length}
          icon={CalendarDays}
        />
        <Metric
          label="Recettes encaissées"
          value={money(payments.reduce((sum, payment) => sum + payment.montant, 0))}
          icon={CreditCard}
        />
        <Metric
          label="Factures avec solde"
          value={unpaidInvoices.length}
          icon={Receipt}
        />
        <Metric label="Occupation estimée" value={`${occupancy}%`} icon={BedDouble} />
      </div>
      <div className="stat-columns">
        <div className="panel">
          <h3>Recettes encaissées par mois</h3>
          <MonthlyRevenueChart data={monthlyTrend} />
        </div>
        <div className="panel">
          <h3>Réservations dans le temps</h3>
          <ReservationTrend reservations={reservations} />
        </div>
      </div>
      <div className="panel">
        <h3>Séjours sur la période</h3>
        <ReservationTable rows={reservations} />
      </div>
    </>
  );
}

function MonthlyRevenueChart({ data }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => money(value)} />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Recettes"
            stroke="#2A3B5F"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function makeMonthlyTrend(reservations, payments, from, to) {
  const today = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
    const monthIsInRange = `${key}-31` >= from && `${key}-01` <= to;
    return {
      month: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date),
      count: monthIsInRange
        ? reservations.filter(
            (booking) =>
              booking.dateDebut.slice(0, 7) === key &&
              booking.statut !== 'ANNULEE',
          ).length
        : 0,
      revenue: monthIsInRange
        ? payments
            .filter((payment) => payment.datePaiement.slice(0, 7) === key)
            .reduce((sum, payment) => sum + payment.montant, 0)
        : 0,
    };
  });
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}
