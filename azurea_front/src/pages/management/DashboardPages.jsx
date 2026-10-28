import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  BedDouble,
  CalendarDays,
  Check,
  CreditCard,
  DoorOpen,
  LogOut,
  Receipt,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'wouter';
import { useMockData } from '../../hooks/useMockData';
import {
  balance,
  entity,
  roomFor,
} from '../../services/mock';
import {
  formatDate,
  localToday,
  money,
  statusNames,
} from '../../utils/format';
import {
  Metric,
  PageHead,
  Status,
} from '../../components/ui';
import {
  ReservationTable,
} from '../../components/ManagementData';

export function DashboardPage({ role }) {
  const data = useMockData();
  const today = localToday();
  const reservations = data.reservations;
  const occupiedRooms = data.rooms.filter(
    (room) => room.statut === 'OCCUPEE',
  ).length;
  const collected = data.invoices.reduce(
    (total, invoice) => total + invoice.montantPaye,
    0,
  );

  if (role === 'CLIENT') {
    return <ClientDashboard data={data} reservations={reservations} />;
  }
  if (role === 'RECEPTIONNISTE') {
    return (
      <ReceptionDashboard
        data={data}
        reservations={reservations}
        today={today}
        occupiedRooms={occupiedRooms}
      />
    );
  }
  return (
    <AdminDashboard
      data={data}
      reservations={reservations}
      occupiedRooms={occupiedRooms}
      collected={collected}
    />
  );
}

function ClientDashboard({ data, reservations }) {
  const session = JSON.parse(localStorage.getItem('auberge-session') || '{}');
  const mine = reservations.filter(
    (booking) => booking.clientId === session.id,
  );
  const upcoming = mine.find((booking) =>
    ['CONFIRMEE', 'EN_ATTENTE'].includes(booking.statut),
  );
  const outstanding = data.invoices
    .filter((invoice) =>
      mine.some((booking) => booking.id === invoice.reservationId),
    )
    .reduce((sum, invoice) => sum + balance(invoice), 0);

  return (
    <>
      <PageHead
        title={`Bonjour ${session.prenom || 'Nadia'},`}
        subtitle="Votre prochaine escapade se prépare ici."
      />
      <div className="cards">
        <Metric
          label="Réservations actives"
          value={
            mine.filter((booking) =>
              ['CONFIRMEE', 'EN_ATTENTE', 'EN_COURS'].includes(booking.statut),
            ).length
          }
          icon={CalendarDays}
        />
        <Metric
          label="Séjours terminés"
          value={mine.filter((booking) => booking.statut === 'TERMINEE').length}
          icon={Check}
        />
        <Metric label="Solde à régler" value={money(outstanding)} icon={Receipt} />
      </div>
      {upcoming && (
        <div className="panel" style={{ background: '#293d60', color: 'white' }}>
          <div className="eyebrow">Votre prochain séjour</div>
          <h2 className="serif" style={{ fontSize: 26 }}>
            Chambre {roomFor(upcoming.chambreId)?.numero} ·{' '}
            {formatDate(upcoming.dateDebut)}
          </h2>
          <p>
            {formatDate(upcoming.dateDebut)} – {formatDate(upcoming.dateFin)} ·{' '}
            {upcoming.reference}
          </p>
          <Link className="btn gold" href={`/client/reservations/${upcoming.id}`}>
            Voir les détails
          </Link>
        </div>
      )}
      <PageHead title="Derniers séjours" />
      <ReservationTable rows={mine.slice(0, 5)} client />
    </>
  );
}

function ReceptionDashboard({ data, reservations, today, occupiedRooms }) {
  const arrivals = reservations.filter(
    (booking) =>
      booking.dateDebut === today && booking.statut === 'CONFIRMEE',
  );
  const departures = reservations.filter(
    (booking) => booking.dateFin === today && booking.statut === 'EN_COURS',
  );

  return (
    <>
      <PageHead
        title="Bonjour Youssef"
        subtitle="Le point d’accueil de votre journée."
        action={
          <Link href="/reception/reservations" className="btn primary">
            <CalendarDays size={16} /> Nouvelle réservation
          </Link>
        }
      />
      <div className="cards">
        <Metric label="Arrivées aujourd’hui" value={arrivals.length} icon={DoorOpen} />
        <Metric label="Départs aujourd’hui" value={departures.length} icon={LogOut} />
        <Metric
          label="Chambres occupées"
          value={`${occupiedRooms} / ${data.rooms.length}`}
          icon={BedDouble}
        />
        <Metric
          label="À nettoyer"
          value={data.rooms.filter((room) => room.statut === 'EN_NETTOYAGE').length}
          icon={Sparkles}
        />
      </div>
      <div className="stat-columns">
        <div className="panel">
          <h3>Occupation de la semaine</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getWeeklyRoomCounts(reservations)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area
                  dataKey="count"
                  name="Séjours"
                  stroke="#c5a059"
                  fill="#efe4cc"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <h3>À suivre</h3>
          <p>
            <Status value="EN_ATTENTE" />{' '}
            {reservations.filter((booking) => booking.statut === 'EN_ATTENTE').length}{' '}
            demandes à confirmer
          </p>
          <p>
            <Status value="DISPONIBLE" />{' '}
            {data.rooms.filter((room) => room.statut === 'DISPONIBLE').length}{' '}
            chambres disponibles
          </p>
          <h3 style={{ marginTop: 24 }}>Paiements récents</h3>
          {data.payments.slice(0, 3).map((payment) => (
            <p key={payment.id} className="muted">
              {money(payment.montant)} · Espèces ·{' '}
              {formatDate(payment.datePaiement)}
            </p>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3>Arrivées attendues</h3>
        <ReservationTable rows={arrivals} />
      </div>
    </>
  );
}

function AdminDashboard({ data, reservations, occupiedRooms, collected }) {
  const clients = data.users.filter((user) => user.role === 'CLIENT').length;
  const outstanding = data.invoices.reduce(
    (sum, invoice) => sum + balance(invoice),
    0,
  );
  const activity = [
    ...data.payments.map((payment) => ({
      date: payment.datePaiement,
      text: `Paiement espèces · ${money(payment.montant)}`,
    })),
    ...reservations.map((booking) => ({
      date: booking.dateDebut,
      text: `Séjour ${booking.reference} · ${statusNames[booking.statut]}`,
    })),
  ]
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 5);

  return (
    <>
      <PageHead
        title="Tableau de bord"
        subtitle="Vue d’ensemble de Dar Séléné."
      />
      <div className="cards">
        <Metric
          label="Réservations"
          value={reservations.length}
          icon={CalendarDays}
          note="Tous statuts"
        />
        <Metric
          label="Occupation"
          value={`${Math.round((occupiedRooms / data.rooms.length) * 100)}%`}
          icon={BedDouble}
        />
        <Metric
          label="Recettes encaissées"
          value={money(collected)}
          icon={CreditCard}
        />
        <Metric label="Soldes à percevoir" value={money(outstanding)} icon={Receipt} />
        <Metric label="Clients" value={clients} icon={Users} />
      </div>
      <div className="stat-columns">
        <div className="panel">
          <h3>Recettes mensuelles</h3>
          <RevenueChart />
        </div>
        <div className="panel">
          <h3>État des chambres</h3>
          <RoomStatusChart rooms={data.rooms} />
        </div>
      </div>
      <div className="stat-columns">
        <div className="panel">
          <h3>Réservations dans le temps</h3>
          <ReservationTrend reservations={reservations} />
        </div>
        <div className="panel">
          <h3>Activité récente</h3>
          {activity.map((item, index) => (
            <div
              key={`${item.date}-${index}`}
              style={{ padding: '11px 0', borderBottom: '1px solid var(--line)' }}
            >
              <b>{item.text}</b>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {formatDate(item.date)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3>Réservations récentes</h3>
        <ReservationTable rows={reservations.slice(0, 5)} />
      </div>
    </>
  );
}

function RevenueChart() {
  const payments = entity('payments');
  const now = new Date();
  const data = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${monthDate.getFullYear()}-${String(
      monthDate.getMonth() + 1,
    ).padStart(2, '0')}`;
    return {
      month: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(
        monthDate,
      ),
      total: payments
        .filter((payment) => payment.datePaiement.slice(0, 7) === key)
        .reduce((sum, payment) => sum + payment.montant, 0),
    };
  });

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => money(value)} />
          <Bar dataKey="total" name="Recettes" fill="#2A3B5F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RoomStatusChart({ rooms }) {
  const data = [
    ['Disponible', 'DISPONIBLE', '#c5a059'],
    ['Occupée', 'OCCUPEE', '#2A3B5F'],
    ['À préparer', 'EN_NETTOYAGE', '#d5c6a8'],
    ['Maintenance', 'EN_MAINTENANCE', '#b3675d'],
  ].map(([name, status, color]) => ({
    name,
    color,
    value: rooms.filter((room) => room.statut === status).length,
  }));

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="88%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={88}
            paddingAngle={3}
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          fontSize: 11,
          flexWrap: 'wrap',
        }}
      >
        {data.map((item) => (
          <span key={item.name}>
            <i
              style={{
                background: item.color,
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 9,
                marginRight: 5,
              }}
            />
            {item.name} {item.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReservationTrend({ reservations }) {
  const today = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    const key = `${monthDate.getFullYear()}-${String(
      monthDate.getMonth() + 1,
    ).padStart(2, '0')}`;
    return {
      label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(
        monthDate,
      ),
      count: reservations.filter(
        (booking) =>
          booking.dateDebut.slice(0, 7) === key &&
          booking.statut !== 'ANNULEE',
      ).length,
    };
  });

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={months}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            name="Réservations"
            stroke="#c5a059"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function getWeeklyRoomCounts(reservations) {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() + 1);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(day.getDate()).padStart(2, '0')}`;
    return {
      label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day),
      count: reservations.filter(
        (booking) =>
          booking.dateDebut <= iso &&
          booking.dateFin > iso &&
          booking.statut !== 'ANNULEE',
      ).length,
    };
  });
}
