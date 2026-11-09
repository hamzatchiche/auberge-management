import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowRight,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  available,
  createReservation,
  saveEntity,
} from '../../services/mock';
import { useMockData } from '../../hooks/useMockData';
import { Input, Select } from '../../components/ui';
import { Footer, PublicNav } from '../../components/PublicChrome';
import { money, roleBase, statusNames } from '../../utils/format';

export function PublicRoutePage({ path, id }) {
  if (path === '/') return <HomePage />;
  if (path === '/chambres') return <RoomsPage />;
  if (path.startsWith('/chambres/')) return <RoomDetailPage id={id} />;
  if (path === '/services') return <ServicesPage />;
  if (path === '/a-propos') return <AboutPage />;
  if (path === '/contact') return <ContactPage />;
  if (path === '/connexion') return <AuthPage mode="login" />;
  if (path === '/inscription') return <AuthPage mode="register" />;
  if (path === '/mot-de-passe-oublie') return <AuthPage mode="forgot" />;
  if (path === '/reinitialiser-mot-de-passe') return <AuthPage mode="reset" />;
  return null;
}

function HomePage() {
  const data = useMockData();
  const [, navigate] = useLocation();
  const [dates, setDates] = useState({
    from: '',
    to: '',
    adults: '2',
    children: '0',
  });

  const searchRooms = (event) => {
    event.preventDefault();
    if (!dates.from || !dates.to || dates.to <= dates.from) {
      window.dispatchEvent(
        new CustomEvent('auberge-toast', {
          detail: 'La date de départ doit être après la date d’arrivée.',
        }),
      );
      return;
    }
    sessionStorage.setItem('auberge-search', JSON.stringify(dates));
    navigate('/chambres');
  };

  return (
    <>
      <PublicNav />
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">Marrakech · Médina</div>
          <h1>
            Une maison,
            <br />
            mille attentions.
          </h1>
          <p>
            Au détour d’une ruelle de la médina, Dar Séléné vous accueille
            comme chez vous — avec la douceur d’une maison et le soin d’une
            belle adresse.
          </p>
          <Link className="btn gold" href="/chambres">
            Découvrir la maison <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="search-wrap">
        <form className="search-box" onSubmit={searchRooms}>
          <div className="field">
            <label>Arrivée</label>
            <input
              required
              className="input"
              type="date"
              value={dates.from}
              onChange={(event) =>
                setDates({ ...dates, from: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label>Départ</label>
            <input
              required
              className="input"
              type="date"
              value={dates.to}
              onChange={(event) =>
                setDates({ ...dates, to: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label>Adultes</label>
            <select
              className="select"
              value={dates.adults}
              onChange={(event) =>
                setDates({ ...dates, adults: event.target.value })
              }
            >
              {[1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  {count} adulte{count > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Enfants</label>
            <select
              className="select"
              value={dates.children}
              onChange={(event) =>
                setDates({ ...dates, children: event.target.value })
              }
            >
              {[0, 1, 2, 3].map((count) => (
                <option key={count} value={count}>
                  {count} enfant{count > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <button className="btn primary">
            <Search size={16} />
            Voir les chambres
          </button>
        </form>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Nos chambres</div>
            <h2>Votre refuge en médina</h2>
          </div>
          <Link className="btn" href="/chambres">
            Toutes les chambres <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid rooms-grid">
          {data.rooms.slice(0, 3).map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>

      <section className="section" style={{ background: '#f0eee8' }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">À votre rythme</div>
            <h2>Les attentions qui font la différence</h2>
          </div>
          <Link className="btn" href="/services">
            Nos services <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid rooms-grid">
          {data.services
            .filter((service) => service.actif)
            .slice(0, 3)
            .map((service) => (
              <div className="panel" key={service.id}>
                <Sparkles color="#c5a059" />
                <h3 style={{ marginTop: 17 }}>{service.nom}</h3>
                <p className="muted">{service.description}</p>
                <b>{money(service.prixUnitaire)}</b>
              </div>
            ))}
        </div>
      </section>

      <section className="section">
        <div className="room-detail">
          <img src="/dar-selene-hero.jpg" alt="Patio de Dar Séléné" />
          <div style={{ alignSelf: 'center' }}>
            <div className="eyebrow">L’esprit Dar Séléné</div>
            <h2>
              Le charme discret
              <br />
              d’une maison vivante.
            </h2>
            <p className="muted" style={{ lineHeight: 1.8 }}>
              {data.auberge.description}
            </p>
            <Link className="btn" href="/a-propos">
              En savoir plus <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Quelques images</div>
            <h2>La maison en lumière</h2>
          </div>
        </div>
        <div
          className="grid"
          style={{ gridTemplateColumns: '2fr 1fr 1fr', height: 230 }}
        >
          {[data.rooms[0].img, data.rooms[2].img, data.rooms[4].img].map(
            (image, index) => (
              <img
                key={image}
                src={image}
                alt={`La maison ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
            ),
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

function RoomCard({ room, availability }) {
  const operationsUnavailable = ['EN_NETTOYAGE', 'EN_MAINTENANCE'].includes(
    room.statut,
  );
  const availabilityLabel = operationsUnavailable
    ? statusNames[room.statut]
    : availability === true
      ? 'Disponible à ces dates'
      : availability === false
        ? 'Indisponible à ces dates'
        : 'Disponibilité à confirmer';
  const tone =
    operationsUnavailable || availability === false
      ? 'bad'
      : availability === true
        ? 'ok'
        : 'warn';

  return (
    <article className="room-card">
      <Link href={`/chambres/${room.id}`}>
        <img className="room-img" src={room.img} alt={room.type} />
      </Link>
      <div className="room-body">
        <div className="eyebrow">{room.type}</div>
        <h3>Chambre {room.numero}</h3>
        <div className="muted" style={{ fontSize: 13 }}>
          <Users size={14} style={{ verticalAlign: 'middle' }} /> Jusqu’à{' '}
          {room.capacite} personnes
        </div>
        <div style={{ marginTop: 9 }}>
          <span className={`status ${tone}`}>{availabilityLabel}</span>
        </div>
        <div className="room-meta">
          <span className="price">
            {money(room.prixNuit)}{' '}
            <span className="muted" style={{ fontWeight: 400 }}>
              / nuit
            </span>
          </span>
          <Link className="btn small" href={`/chambres/${room.id}`}>
            Découvrir <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function RoomsPage() {
  const data = useMockData();
  const search = JSON.parse(sessionStorage.getItem('auberge-search') || '{}');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [capacity, setCapacity] = useState(
    search.adults
      ? String(Number(search.adults) + Number(search.children || 0))
      : '',
  );
  const [maxPrice, setMaxPrice] = useState('');
  const [arrival, setArrival] = useState(search.from || '');
  const [departure, setDeparture] = useState(search.to || '');
  const validDates =
    (!arrival && !departure) ||
    Boolean(arrival && departure && departure > arrival);
  const rooms = data.rooms.filter((room) => {
    if (['EN_NETTOYAGE', 'EN_MAINTENANCE'].includes(room.statut)) return false;
    if (
      query &&
      !room.numero.includes(query) &&
      !room.type.toLowerCase().includes(query.toLowerCase())
    ) {
      return false;
    }
    if (type && room.type !== type) return false;
    if (capacity && room.capacite < Number(capacity)) return false;
    if (maxPrice && room.prixNuit > Number(maxPrice)) return false;
    if (arrival || departure) {
      return validDates && available(room.id, arrival, departure);
    }
    return true;
  });

  return (
    <>
      <PublicNav />
      <section className="section">
        <div className="eyebrow">Séjourner à Dar Séléné</div>
        <h1 className="page-title">Nos chambres</h1>
        <p className="muted">
          Des espaces singuliers, pensés pour le repos et les retrouvailles.
        </p>
        <div className="panel" style={{ marginTop: 24 }}>
          <div className="filters">
            <input
              className="input"
              placeholder="Rechercher une chambre…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="select"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="">Tous les types</option>
              {[...new Set(data.rooms.map((room) => room.type))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              className="select"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            >
              <option value="">Toute capacité</option>
              {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                <option key={count} value={count}>
                  {count} personne{count > 1 ? 's' : ''} et +
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Prix max / nuit (MAD)"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
            <input
              aria-label="Date d’arrivée"
              type="date"
              className="input"
              value={arrival}
              onChange={(event) => setArrival(event.target.value)}
            />
            <input
              aria-label="Date de départ"
              type="date"
              className="input"
              value={departure}
              onChange={(event) => setDeparture(event.target.value)}
            />
          </div>
          {!validDates && (
            <div className="error-text">
              Sélectionnez les deux dates et choisissez un départ après
              l’arrivée.
            </div>
          )}
        </div>
        <div className="grid rooms-grid">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              availability={
                arrival && departure ? available(room.id, arrival, departure) : undefined
              }
            />
          ))}
        </div>
        {!rooms.length && (
          <div className="empty">
            Aucune chambre disponible pour cette capacité, ce tarif et ces
            dates.
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}

function RoomDetailPage({ id }) {
  const data = useMockData();
  const [, navigate] = useLocation();
  const room = data.rooms.find((item) => item.id === id);
  const search = JSON.parse(sessionStorage.getItem('auberge-search') || '{}');
  const [stay, setStay] = useState({
    from: search.from || '',
    to: search.to || '',
    adults: search.adults || '2',
    children: search.children || '0',
  });
  if (!room) return <><PublicNav /><Footer /></>;

  const guests = Number(stay.adults) + Number(stay.children);
  const availableForStay =
    stay.from && stay.to && stay.to > stay.from
      ? available(room.id, stay.from, stay.to)
      : null;

  const requestReservation = (event) => {
    event.preventDefault();
    if (!(stay.to > stay.from)) {
      window.dispatchEvent(
        new CustomEvent('auberge-toast', {
          detail: 'La date de départ doit suivre la date d’arrivée.',
        }),
      );
      return;
    }
    if (guests > room.capacite) {
      window.dispatchEvent(
        new CustomEvent('auberge-toast', {
          detail: 'Le nombre de voyageurs dépasse la capacité de cette chambre.',
        }),
      );
      return;
    }
    if (!available(room.id, stay.from, stay.to)) {
      window.dispatchEvent(
        new CustomEvent('auberge-toast', {
          detail: 'Chambre indisponible aux dates choisies.',
        }),
      );
      return;
    }
    const session = JSON.parse(localStorage.getItem('auberge-session') || 'null');
    if (!session) {
      sessionStorage.setItem(
        'pending-booking',
        JSON.stringify({ ...stay, chambreId: room.id }),
      );
      navigate('/connexion');
      return;
    }
    try {
      createReservation({
        clientId: session.id,
        chambreId: room.id,
        dateDebut: stay.from,
        dateFin: stay.to,
        nombreAdultes: Number(stay.adults),
        nombreEnfants: Number(stay.children),
      });
      window.dispatchEvent(
        new CustomEvent('auberge-toast', {
          detail: 'Votre demande de réservation est envoyée.',
        }),
      );
      navigate('/client/reservations');
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('auberge-toast', { detail: error.message }),
      );
    }
  };

  return (
    <>
      <PublicNav />
      <section className="section">
        <div className="breadcrumb">
          <Link href="/chambres">Chambres</Link> / Chambre {room.numero}
        </div>
        <div className="room-detail">
          <img src={room.img} alt={room.type} />
          <div>
            <div className="eyebrow">{room.type}</div>
            <h1 className="page-title">Chambre {room.numero}</h1>
            <p className="muted" style={{ lineHeight: 1.8 }}>
              {room.description}
            </p>
            <p><Users size={15} /> Jusqu’à {room.capacite} personnes</p>
            <h2>
              {money(room.prixNuit)} <small className="muted">/ nuit</small>
            </h2>
            <div className="notice-bar">
              Maison de caractère · Literie premium · Wi-Fi · Salle de bain
              privée
            </div>
            {availableForStay !== null && (
              <div className={availableForStay ? 'notice' : 'warning'}>
                {availableForStay
                  ? 'Disponible aux dates choisies.'
                  : 'Indisponible aux dates choisies ou chambre en préparation.'}
              </div>
            )}
            <form
              className="panel"
              style={{ marginTop: 22 }}
              onSubmit={requestReservation}
            >
              <b>Préparer votre séjour</b>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <Input
                  label="Arrivée"
                  type="date"
                  required
                  value={stay.from}
                  onChange={(event) =>
                    setStay({ ...stay, from: event.target.value })
                  }
                />
                <Input
                  label="Départ"
                  type="date"
                  required
                  value={stay.to}
                  onChange={(event) =>
                    setStay({ ...stay, to: event.target.value })
                  }
                />
                <Select
                  label="Adultes"
                  value={stay.adults}
                  onChange={(event) =>
                    setStay({ ...stay, adults: event.target.value })
                  }
                  options={[1, 2, 3, 4].map((count) => [
                    String(count),
                    `${count} adulte${count > 1 ? 's' : ''}`,
                  ])}
                />
                <Select
                  label="Enfants"
                  value={stay.children}
                  onChange={(event) =>
                    setStay({ ...stay, children: event.target.value })
                  }
                  options={[0, 1, 2, 3].map((count) => [
                    String(count),
                    `${count} enfant${count > 1 ? 's' : ''}`,
                  ])}
                />
              </div>
              <button className="btn primary" type="submit">
                Demander une réservation <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

function ServicesPage() {
  const data = useMockData();
  return (
    <>
      <PublicNav />
      <section className="section">
        <div className="eyebrow">À votre service</div>
        <h1 className="page-title">Les attentions de la maison</h1>
        <p className="muted">
          Des services discrets, disponibles pendant votre séjour.
        </p>
        <div className="grid rooms-grid" style={{ marginTop: 28 }}>
          {data.services.filter((service) => service.actif).map((service) => (
            <div className="panel" key={service.id}>
              <Sparkles color="#C5A059" />
              <h3 style={{ marginTop: 16 }}>{service.nom}</h3>
              <p className="muted">{service.description}</p>
              <b>{money(service.prixUnitaire)}</b>
              <span className="muted"> · selon disponibilité</span>
            </div>
          ))}
        </div>
        <div className="notice-bar">
          Les services se règlent à la réception. Aucun paiement en ligne n’est
          proposé.
        </div>
      </section>
      <Footer />
    </>
  );
}

function AboutPage() {
  const data = useMockData();
  return (
    <>
      <PublicNav />
      <section className="section">
        <div className="room-detail">
          <img src="/dar-selene-hero.jpg" alt="Patio de la maison" />
          <div>
            <div className="eyebrow">Notre maison</div>
            <h1 className="page-title">
              Une adresse à part, au cœur de Marrakech.
            </h1>
            <p className="muted" style={{ lineHeight: 1.9 }}>
              {data.auberge.description} Ici, chaque détail raconte le plaisir
              de recevoir : un patio baigné de lumière, des matières choisies
              auprès d’artisans, et le temps de vous conseiller comme un ami.
            </p>
            <Link className="btn primary" href="/chambres">
              Trouver votre chambre
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

function ContactPage() {
  const data = useMockData();
  return (
    <>
      <PublicNav />
      <section className="section">
        <div className="eyebrow">Écrivez-nous</div>
        <h1 className="page-title">Nous sommes à votre écoute.</h1>
        <div className="contact-row">
          <div>
            <p className="muted">
              Pour préparer votre séjour ou poser une question, notre équipe
              vous répond avec plaisir.
            </p>
            <p><MapPin size={16} /> {data.auberge.adresse}, {data.auberge.ville}</p>
            <p><Phone size={16} /> {data.auberge.telephone}</p>
            <p><Mail size={16} /> {data.auberge.email}</p>
          </div>
          <ContactForm />
        </div>
      </section>
      <Footer />
    </>
  );
}

function ContactForm() {
  const [success, setSuccess] = useState(false);
  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        setSuccess(true);
        event.currentTarget.reset();
      }}
    >
      <Input label="Votre nom" required placeholder="Prénom et nom" />
      <Input
        label="Adresse e-mail"
        required
        type="email"
        placeholder="vous@exemple.ma"
      />
      <div className="form-field">
        <label>Votre message</label>
        <textarea
          className="textarea"
          required
          minLength="10"
          placeholder="Comment pouvons-nous vous aider ?"
        />
      </div>
      <button className="btn primary">
        Envoyer le message <ArrowRight size={15} />
      </button>
      {success && (
        <div className="notice">
          Votre message est prêt. Notre équipe reviendra vers vous rapidement.
        </div>
      )}
    </form>
  );
}

function AuthPage({ mode }) {
  const [, navigate] = useLocation();
  const [demoRole, setDemoRole] = useState('CLIENT');
  const [feedback, setFeedback] = useState('');
  const data = useMockData();

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (mode === 'register') {
      const password = form.get('password');
      if (password !== form.get('confirmation')) {
        window.dispatchEvent(
          new CustomEvent('auberge-toast', {
            detail: 'Les mots de passe ne correspondent pas.',
          }),
        );
        return;
      }
      const email = String(form.get('email')).trim().toLowerCase();
      if (data.users.some((user) => user.email.toLowerCase() === email)) {
        window.dispatchEvent(
          new CustomEvent('auberge-toast', {
            detail: 'Cette adresse e-mail est déjà utilisée.',
          }),
        );
        return;
      }
      const user = {
        id: `u${Date.now()}`,
        prenom: String(form.get('prenom')).trim(),
        nom: String(form.get('nom')).trim(),
        genre: form.get('genre') || '',
        email
      };
      saveEntity('users', [...data.users, user]);
      localStorage.setItem('auberge-session', JSON.stringify(user));
      window.dispatchEvent(
        new CustomEvent('auberge-toast', {
          detail: 'Compte de démonstration créé. Aucun mot de passe conservé.',
        }),
      );
      navigate(roleBase.CLIENT);
      return;
    }

    if (mode === 'login') {
      const user = data.users.find(
        (candidate) => candidate.role === demoRole && candidate.active,
      );
      if (!user) {
        window.dispatchEvent(
          new CustomEvent('auberge-toast', {
            detail: 'Aucun compte actif pour ce profil.',
          }),
        );
        return;
      }
      localStorage.setItem('auberge-session', JSON.stringify(user));
      const pending = JSON.parse(
        sessionStorage.getItem('pending-booking') || 'null',
      );
      if (pending && user.role === 'CLIENT') {
        sessionStorage.removeItem('pending-booking');
        try {
          createReservation({
            clientId: user.id,
            chambreId: pending.chambreId,
            dateDebut: pending.from,
            dateFin: pending.to,
            nombreAdultes: Number(pending.adults || 2),
            nombreEnfants: Number(pending.children || 0),
          });
        } catch (error) {
          window.dispatchEvent(
            new CustomEvent('auberge-toast', { detail: error.message }),
          );
        }
      }
      navigate(roleBase[demoRole]);
      return;
    }

    if (mode === 'reset') {
      if (form.get('password') !== form.get('confirmation')) {
        window.dispatchEvent(
          new CustomEvent('auberge-toast', {
            detail: 'Les mots de passe ne correspondent pas.',
          }),
        );
        return;
      }
      setFeedback(
        'Démonstration uniquement : aucun mot de passe n’a été modifié ni enregistré.',
      );
      return;
    }

    setFeedback(
      'Simulation uniquement : aucune adresse n’a été contactée. La récupération sera connectée à Laravel.',
    );
  };

  return (
    <>
      <PublicNav />
      <div className="auth-wrap">
        <div className="auth-photo">
          <div>
            <div className="eyebrow">Dar Séléné · Marrakech</div>
            <h2 className="serif" style={{ fontSize: 38 }}>
              L’hospitalité
              <br />
              commence ici.
            </h2>
          </div>
        </div>
        <div className="auth-form">
          <div className="eyebrow">
            {mode === 'login' ? 'Votre espace' : 'Bienvenue à la maison'}
          </div>
          <h1>
            {mode === 'login'
              ? 'Connexion'
              : mode === 'register'
                ? 'Créer un compte'
                : mode === 'forgot'
                  ? 'Mot de passe oublié'
                  : 'Réinitialiser le mot de passe'}
          </h1>
          <p className="muted">
            Retrouvez vos séjours et les informations de votre maison.
          </p>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <div className="form-grid">
                <Input label="Prénom" name="prenom" required />
                <Input label="Nom" name="nom" required />
              </div>
            )}
            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              placeholder={mode === 'login' ? 'demo@darselene.ma' : ''}
              required
            />
            {mode === 'login' && (
              <>
                <Input label="Mot de passe" type="password" required />
                <Select
                  label="Accès de démonstration"
                  value={demoRole}
                  onChange={(event) => setDemoRole(event.target.value)}
                  options={[
                    ['CLIENT', 'Espace client'],
                    ['RECEPTIONNISTE', 'Réception'],
                    ['ADMIN', 'Administrateur'],
                  ]}
                />
                <div className="notice-bar">
                  Démo uniquement : aucun mot de passe n’est vérifié ou
                  enregistré. Les protections d’écran ne sont pas une sécurité
                  réelle.
                </div>
              </>
            )}
            {mode === 'register' && (
              <>
                <Select
                  label="Genre (facultatif)"
                  name="genre"
                  options={[
                    ['', 'Ne pas préciser'],
                    ['F', 'Femme'],
                    ['H', 'Homme'],
                  ]}
                />
                <Input
                  label="Mot de passe"
                  name="password"
                  type="password"
                  minLength="8"
                  required
                />
                <Input
                  label="Confirmer le mot de passe"
                  name="confirmation"
                  type="password"
                  minLength="8"
                  required
                />
                <div className="notice-bar">
                  Prototype seulement : le compte de démonstration conserve
                  vos coordonnées, jamais le mot de passe.
                </div>
              </>
            )}
            {mode === 'forgot' && (
              <div className="notice-bar">
                Aucun e-mail n’est envoyé dans cette démonstration.
              </div>
            )}
            {mode === 'reset' && (
              <>
                <Input
                  label="Nouveau mot de passe"
                  name="password"
                  type="password"
                  minLength="8"
                  required
                />
                <Input
                  label="Confirmer le mot de passe"
                  name="confirmation"
                  type="password"
                  minLength="8"
                  required
                />
                <div className="notice-bar">
                  Cette action ne modifie aucun compte réel.
                </div>
              </>
            )}
            <button
              className="btn primary"
              style={{ width: '100%', marginTop: 8 }}
            >
              {mode === 'login'
                ? 'Entrer dans mon espace'
                : mode === 'register'
                  ? 'Créer mon compte'
                  : 'Continuer'}
            </button>
          </form>
          {feedback && <div className="notice">{feedback}</div>}
          <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
            {mode === 'login' ? (
              <>
                Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
                <br />
                <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
              </>
            ) : mode === 'forgot' ? (
              <>
                <Link href="/reinitialiser-mot-de-passe">
                  Tester la réinitialisation
                </Link>
                <br />
                <Link href="/connexion">Retour à la connexion</Link>
              </>
            ) : (
              <Link href="/connexion">Retour à la connexion</Link>
            )}
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
