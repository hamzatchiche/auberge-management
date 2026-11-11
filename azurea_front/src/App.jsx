import { useEffect, useState } from "react";
import { Link, Route, Switch, useLocation, useParams } from "wouter";
import {BedDouble,CalendarDays,Users,Receipt,CreditCard,Settings,ChartNoAxesCombined,Home,UserRound,LogOut,Menu,X,Plus,Search,ArrowRight,ChevronRight,MapPin,Phone,Check,CircleAlert,DoorOpen,Sparkles,Download,Printer,Pencil,Trash2,Eye,ShieldCheck,
} from "lucide-react";
import {ResponsiveContainer,AreaChart,Area,BarChart,Bar,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,PieChart,Pie,Cell,
} from "recharts";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/QueryClient";
import { useRegister } from "./hooks/useRegister";
import { useLogin } from "./hooks/useLogin";
import { useforgot } from "./hooks/useForgot";
import { useReset } from "./hooks/useReset";
import {saveAuth,clearAuth,getStoredUser,getStoredToken,isAuthenticated,
} from "./services/auth";
import { AuthAPI } from "./services/api";
import {useData,useAuberge,useActions,useAvailableRoomIds,useReservationDetail,
} from "./hooks/Queries";
import { nights, reservationTotal, invoiceTotal, balance, invoiceStatus } from "./lib/Helpers";
import { apiMessage, roomBody, serviceBody, reservationBody, aubergeBody } from "./lib/Normalize";

const money = (n) =>
  new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
const date = (value) => {
  if (!value) return "—";
  const datePart =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}(?:$|T|\s)/.test(value)? value.slice(0, 10): null;
  const parsed =
    value instanceof Date? value: datePart
        ? new Date(`${datePart}T12:00:00`)
        : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};
const brandInitial = (name) => [...String(name || "A")][0].toUpperCase();
const roomImage = (room) => {
  const details = `${room.type || ""} ${room.numero || ""}`.toLowerCase();
  if (/terrasse|terrace/.test(details)) return "/suite-terrasse.jpg";
  if (/famil|family|triple/.test(details)) return "/suite-familiale.jpg";
  if (/double|chambre/.test(details)) return "/chambre-double.jpg";
  return "/dar-selene-hero.jpg";
};
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const roleNames = {
  ADMIN: "Administrateur",
  RECEPTIONNISTE: "Réception",
  CLIENT: "Espace client",
};
const statusNames = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  ANNULEE: "Annulée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  DISPONIBLE: "Disponible",
  OCCUPEE: "Occupée",
  EN_NETTOYAGE: "En nettoyage",
  EN_MAINTENANCE: "En maintenance",
  NON_PAYEE: "Non payée",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE: "Payée",
};
const menus = {
  CLIENT: [
    ["Vue d’ensemble", "/client/dashboard", Home],
    ["Réserver un séjour", "/chambres", BedDouble],
    ["Mes réservations", "/client/reservations", CalendarDays],
    ["Mes factures", "/client/factures", Receipt],
    ["Mon profil", "/client/profil", UserRound],
  ],
  RECEPTIONNISTE: [
    ["Vue d’ensemble", "/reception/dashboard", Home],
    ["Chambres", "/reception/chambres", BedDouble],
    ["Réservations", "/reception/reservations", CalendarDays],
    ["Services", "/reception/services", Sparkles],
    ["Factures", "/reception/factures", Receipt],
    ["Paiements espèces", "/reception/paiements", CreditCard],
    ["Arrivées & départs", "/reception/check-in-out", DoorOpen],
  ],
  ADMIN: [
    ["Vue d’ensemble", "/admin/dashboard", Home],
    ["Utilisateurs", "/admin/utilisateurs", Users],
    ["Configuration", "/admin/configuration", Settings],
    ["Statistiques", "/admin/statistiques", ChartNoAxesCombined],
  ],
};
const roleBase = {
  CLIENT: "/client/dashboard",
  RECEPTIONNISTE: "/reception/dashboard",
  ADMIN: "/admin/dashboard",
};
function toast(msg) {
  if (window.__aubergePendingWrite) {
    msg = "Backend non connecte : aucune modification n a ete envoyee.";
    window.__aubergePendingWrite = null;
  }
  window.dispatchEvent(new CustomEvent("auberge-toast", { detail: msg }));
}
function Button({ children, onClick, kind = "", type = "button", ...props }) {
  return (
    <button type={type} className={`btn ${kind}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
function Status({ value }) {
  const c = ["PAYEE", "DISPONIBLE", "CONFIRMEE", "TERMINEE"].includes(value)
    ? "ok"
    : ["EN_ATTENTE", "PARTIELLEMENT_PAYEE", "EN_NETTOYAGE"].includes(value)
      ? "warn"
      : ["ANNULEE", "EN_MAINTENANCE", "NON_PAYEE"].includes(value)
        ? "bad"
        : "info";
  return <span className={`status ${c}`}>{statusNames[value] || value}</span>;
}
function ToastHost() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const f = (e) => {
      setMessage(e.detail);
      setTimeout(() => setMessage(""), 3000);
    };
    window.addEventListener("auberge-toast", f);
    return () => window.removeEventListener("auberge-toast", f);
  }, []);
  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}
function PublicNav() {
  const { auberge } = useData();
  const [session, setSession] = useState(() =>
    isAuthenticated() ? getStoredUser() : null,
  );
  useEffect(() => {
    const updateSession = () =>
      setSession(isAuthenticated() ? getStoredUser() : null);
    window.addEventListener("auberge-auth", updateSession);
    return () => window.removeEventListener("auberge-auth", updateSession);
  }, []);
  const sessionRole = String(session?.role || "").toUpperCase();
  const accountPath = roleBase[sessionRole] || "/connexion";
  return (
    <header className="public-nav">
      <Link href="/" className="brand">
        <span className="brand-mark">{brandInitial(auberge.nom)}</span>
        <span>{auberge.nom || "Azuveria Médina"}</span>
      </Link>
      <nav className="nav-links">
        <Link href="/">Accueil</Link>
        <Link href="/chambres">Chambres</Link>
        <Link href="/services">Services</Link>
        <Link href="/a-propos">À propos</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className="nav-actions">
        <Link
          className="btn small"
          href={
            session
              ? sessionRole === "CLIENT"
                ? "/client/profil"
                : accountPath
              : "/connexion"
          }
        >
          {session ? (sessionRole === "CLIENT" ? "Mon profil" : "Mon espace") : "Connexion"}
        </Link>
        {(!session || sessionRole === "CLIENT") && (
          <Link className="btn primary small" href="/chambres">
            Réserver un séjour
          </Link>
        )}
      </div>
    </header>
  );
}
function Shell({ role, children }) {
  const [path, setPath] = useLocation();
  const [open, setOpen] = useState(false);
  const session = getStoredUser();
  const { auberge } = useData();
  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch (error) {
      toast(apiMessage(error));
    } finally {
      clearAuth();
      queryClient.clear();
      setPath("/connexion");
    }
  };
  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="side-brand">
          <Link className="brand" href={roleBase[role]}>
            <span className="brand-mark">{brandInitial(auberge.nom)}</span>
            <span>{auberge.nom || "Azuveria Médina"}</span>
          </Link>
          <div
            style={{ fontSize: 11, color: "#bfc8d4", margin: "10px 0 0 49px" }}
          >
            {roleNames[role]}
          </div>
        </div>
        <div className="side-label">Espace de travail</div>
        {menus[role].map(([label, url, Icon]) => (
          <Link
            onClick={() => setOpen(false)}
            key={url}
            href={url}
            className={`side-link ${path === url ? "active" : ""}`}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
        <div className="side-bottom">
          <div className="side-label">Compte</div>
          <Link className="side-link" href="/">
            <Home size={17} />
            Site public
          </Link>
          <button
            className="side-link"
            style={{ width: "100%", border: 0, background: "none" }}
            onClick={logout}
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <Button kind="small mobile-toggle" onClick={() => setOpen(!open)}>
            <Menu size={17} />
          </Button>
          <div className="breadcrumb">
            Auberge {auberge.nom || "Azuveria Médina"} <ChevronRight size={13} /> {roleNames[role]}
          </div>
          <div className="topbar-right">
            <span className="user-label">
              {session?.prenom || "Équipe"} {session?.nom || ""}
            </span>
            <span className="avatar">{(session?.prenom || "D")[0]}</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
function PageHead({ title, subtitle, action }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && (
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
function Metric({ label, value, icon: Icon, note }) {
  return (
    <div className="metric">
      <div className="metric-top">
        {label}
        <Icon size={18} color="#b28c4b" />
      </div>
      <div className="metric-value">{value}</div>
      {note && (
        <div className="muted" style={{ fontSize: 11, marginTop: 5 }}>
          {note}
        </div>
      )}
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button aria-label="Fermer" className="btn small" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Input({ label, ...props }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <input className="input" {...props} />
    </div>
  );
}
function Select({ label, options, ...props }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <select className="select" {...props}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
function FormButton({ children }) {
  return (
    <button className="btn primary" type="submit">
      {children}
    </button>
  );
}

function HomePage() {
  const data = useData();
  const [, setPath] = useLocation();
  const [dates, setDates] = useState({
    from: "",
    to: "",
    adults: "2",
    children: "0",
  });
  return (
    <>
      <PublicNav />
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">{data.auberge.ville || "Maison d’hôtes"}</div>
          <h1>
            Une maison,
            <br />
            mille attentions.
          </h1>
          <p>
            Au cœur {data.auberge.ville ? `d’${data.auberge.ville}` : "de la ville"}, {data.auberge.nom || "la maison"} vous accueille dans une atmosphère paisible, où l’hospitalité marocaine et le confort se rencontrent.
          </p>
          <Link className="btn gold" href="/chambres">
            Découvrir la maison <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <div className="search-wrap">
        <form
          className="search-box"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !dates.from ||
              !dates.to ||
              dates.from < localToday() ||
              dates.to <= dates.from
            ) {
              toast("La date de départ doit être après la date d’arrivée.");
              return;
            }
            sessionStorage.setItem("auberge-search", JSON.stringify(dates));
            setPath("/chambres");
          }}
        >
          <div className="field">
            <label>Arrivée</label>
            <input
              required
              className="input"
              type="date"
              min={localToday()}
              value={dates.from}
              onChange={(e) => setDates({ ...dates, from: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Départ</label>
            <input
              required
              className="input"
              type="date"
              min={dates.from || localToday()}
              value={dates.to}
              onChange={(e) => setDates({ ...dates, to: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Adultes</label>
            <select
              className="select"
              value={dates.adults}
              onChange={(e) => setDates({ ...dates, adults: e.target.value })}
            >
              {[1, 2, 3, 4].map((n) => (
                <option value={n} key={n}>
                  {n} adulte{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Enfants</label>
            <select
              className="select"
              value={dates.children}
              onChange={(e) => setDates({ ...dates, children: e.target.value })}
            >
              {[0, 1, 2, 3].map((n) => (
                <option value={n} key={n}>
                  {n} enfant{n > 1 ? "s" : ""}
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
            <h2>
              Votre refuge{data.auberge.ville ? ` à ${data.auberge.ville}` : ""}
            </h2>
          </div>
          <Link className="btn" href="/chambres">
            Toutes les chambres <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid rooms-grid">
          {data.rooms.slice(0, 3).map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </div>
      </section>
      <section className="section" style={{ background: "#f0eee8" }}>
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
            .filter((s) => s.actif)
            .slice(0, 3)
            .map((s) => (
              <div className="panel" key={s.id}>
                <Sparkles color="#c5a059" />
                <h3 style={{ marginTop: 17 }}>{s.nom}</h3>
                <p className="muted">{s.description}</p>
                <b>{money(s.prixUnitaire)}</b>
              </div>
            ))}
        </div>
      </section>
      <section className="section">
        <div className="room-detail">
          <img
            src="/dar-selene-hero.jpg"
            alt={`Maison d’hôtes ${data.auberge.nom || "à Agadir"}`}
          />
          <div style={{ alignSelf: "center" }}>
            <div className="eyebrow">L’esprit {data.auberge.nom || "de la maison"}</div>
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
        <div className="grid property-gallery">
          {[
            ["/chambre-double.jpg", "Chambre double"],
            ["/suite-familiale.jpg", "Suite familiale"],
            ["/suite-terrasse.jpg", "Suite avec terrasse"],
          ].map(([src, alt]) => (
            <img
              key={src}
              src={src}
              alt={alt}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
            />
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
function RoomCard({ room, availability }) {
  const ops = ["EN_NETTOYAGE", "EN_MAINTENANCE"].includes(room.statut);
  const label = ops
    ? statusNames[room.statut]
    : availability === true
      ? "Disponible à ces dates"
      : availability === false
        ? "Indisponible à ces dates"
        : "Disponibilité à confirmer";
  return (
    <article className="room-card">
      <Link href={`/chambres/${room.id}`}>
        <img
          className="room-img"
          src={roomImage(room)}
          alt={`${room.type || "Chambre"} ${room.numero}`}
          loading="lazy"
        />
      </Link>
      <div className="room-body">
        <div className="eyebrow">{room.type}</div>
        <h3>Chambre {room.numero}</h3>
        <div className="muted" style={{ fontSize: 13 }}>
          <Users size={14} style={{ verticalAlign: "middle" }} /> Jusqu’à{" "}
          {room.capacite} personnes
        </div>
        <div style={{ marginTop: 9 }}>
          <span
            className={`status ${ops || availability === false ? "bad" : availability === true ? "ok" : "warn"}`}
          >
            {label}
          </span>
        </div>
        <div className="room-meta">
          <span className="price">
            {money(room.prixNuit)}{" "}
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
function Footer() {
  const { auberge: a } = useData();
  return (
    <footer className="public-footer">
      <div>
        <div className="brand" style={{ color: "white" }}>
          <span className="brand-mark">{brandInitial(a.nom)}</span>
          {a.nom || "Azuveria Médina"}
        </div>
        <p style={{ maxWidth: 320, color: "#cbd2de", lineHeight: 1.7 }}>
          Une maison d’hôtes{a.ville ? ` à ${a.ville}` : ""}.
        </p>
      </div>
      <div>
        <b>Nous trouver</b>
        <p style={{ color: "#cbd2de" }}>
          {a.adresse}
          <br />
          {a.ville}
          <br />
          {a.telephone}
        </p>
      </div>
      <div>
        <b>Explorer</b>
        <p>
          <Link href="/chambres">Chambres</Link>
          <br />
          <Link href="/services">Services</Link>
          <br />
          <Link href="/contact">Contact</Link>
        </p>
      </div>
      <small style={{ alignSelf: "end", color: "#aeb9ca" }}>
        © {new Date().getFullYear()} {a.nom || "Azuveria Médina"}{a.ville ? ` · ${a.ville}` : ""}
      </small>
    </footer>
  );
}
function RoomsPage() {
  const data = useData();
  const search = JSON.parse(sessionStorage.getItem("auberge-search") || "{}");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [capacity, setCapacity] = useState(
    search.adults
      ? String(Number(search.adults) + Number(search.children || 0))
      : "",
  );
  const [maxPrice, setMaxPrice] = useState("");
  const [from, setFrom] = useState(search.from || "");
  const [to, setTo] = useState(search.to || "");
  const validDates = (!from && !to) || Boolean(from && to && to > from);
  const availability = useAvailableRoomIds(
    from,
    to,
    Number(search.adults || 1),
    Number(search.children || 0),
    Boolean(from && to && validDates),
  );
  const freeIds = availability.data;
  const isFree = (id) => (freeIds ? freeIds.includes(String(id)) : undefined);
  const eligible = data.rooms.filter(
    (r) =>
      !["EN_NETTOYAGE", "EN_MAINTENANCE"].includes(r.statut) &&
      (!q ||
        r.numero.includes(q) ||
        r.type.toLowerCase().includes(q.toLowerCase())) &&
      (!type || r.type === type) &&
      (!capacity || r.capacite >= Number(capacity)) &&
      (!maxPrice || r.prixNuit <= Number(maxPrice)) &&
      ((!from && !to) || (validDates && isFree(r.id) === true)),
  );
  return (
    <>
      <PublicNav />
      <section className="section">
        <div className="eyebrow">Séjourner à {data.auberge.nom || "l’auberge"}</div>
        <h1 className="page-title">Nos chambres</h1>
        <p className="muted">
          Des espaces singuliers, pensés pour le repos et les retrouvailles.
        </p>
        <div className="panel" style={{ marginTop: 24 }}>
          <div className="filters">
            <input
              className="input"
              placeholder="Rechercher une chambre…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Tous les types</option>
              {[...new Set(data.rooms.map((r) => r.type))].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              className="select"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            >
              <option value="">Toute capacité</option>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} personne{n > 1 ? "s" : ""} et +
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Prix max / nuit (MAD)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <input
              aria-label="Date d’arrivée"
              type="date"
              className="input"
              min={localToday()}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              aria-label="Date de départ"
              type="date"
              className="input"
              min={from || localToday()}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {!validDates && (
            <div className="error-text">
              Sélectionnez les deux dates et choisissez un départ après
              l’arrivée.
            </div>
          )}
          {validDates && from && to && availability.isLoading && (
            <div className="notice" role="status">Vérification des disponibilités…</div>
          )}
          {availability.error && (
            <div className="warning" role="alert">{apiMessage(availability.error)}</div>
          )}
        </div>
        <div className="grid rooms-grid">
          {eligible.map((r) => (
            <RoomCard
              key={r.id}
              room={r}
              availability={from && to ? isFree(r.id) : undefined}
            />
          ))}
        </div>
        {!eligible.length && (
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
function RoomDetail({ id }) {
  const data = useData(),
    [, setPath] = useLocation();
  const actions = useActions();
  const r = data.rooms.find((x) => String(x.id) === String(id)),
    search = JSON.parse(sessionStorage.getItem("auberge-search") || "{}"),
    pending = JSON.parse(sessionStorage.getItem("pending-booking") || "null"),
    initial = pending && String(pending.chambreId) === String(r?.id) ? pending : search;
  const [dates, setDates] = useState({
    from: initial.from || "",
    to: initial.to || "",
    adults: initial.adults || "2",
    children: initial.children || "0",
  });
  const validRange = Boolean(dates.from && dates.to && dates.to > dates.from);
  const availability = useAvailableRoomIds(
    dates.from,
    dates.to,
    Number(dates.adults),
    Number(dates.children),
    validRange,
  );
  const freeIds = availability.data;
  if (!r) return <PublicNav />;
  const guestCount = Number(dates.adults) + Number(dates.children),
    dateAvailable = validRange && freeIds ? freeIds.includes(String(r.id)) : null;
  return (
    <>
      <PublicNav />
      <section className="section">
        <div className="breadcrumb">
          <Link href="/chambres">Chambres</Link> / Chambre {r.numero}
        </div>
        <div className="room-detail">
          <img
            src={roomImage(r)}
            alt={`${r.type || "Chambre"} ${r.numero}`}
          />
          <div>
            <div className="eyebrow">{r.type}</div>
            <h1 className="page-title">Chambre {r.numero}</h1>
            <p>
              <Users size={15} /> Jusqu’à {r.capacite} personnes
            </p>
            <h2>
              {money(r.prixNuit)} <small className="muted">/ nuit</small>
            </h2>
            {dateAvailable !== null && (
              <div className={dateAvailable ? "notice" : "warning"}>
                {dateAvailable
                  ? "Disponible aux dates choisies."
                  : "Indisponible aux dates choisies ou chambre en préparation."}
              </div>
            )}
            {validRange && availability.isLoading && (
              <div className="notice" role="status">Vérification des disponibilités…</div>
            )}
            {availability.error && (
              <div className="warning" role="alert">{apiMessage(availability.error)}</div>
            )}
            <form
              className="panel"
              style={{ marginTop: 22 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!(dates.to > dates.from)) {
                  toast("La date de départ doit suivre la date d’arrivée.");
                  return;
                }
                if (dates.from < localToday()) {
                  toast("La date d’arrivée ne peut pas être dans le passé.");
                  return;
                }
                if (guestCount > r.capacite) {
                  toast(
                    "Le nombre de voyageurs dépasse la capacité de cette chambre.",
                  );
                  return;
                }
                if (dateAvailable === false) {
                  toast("Chambre indisponible aux dates choisies.");
                  return;
                }
                const session = isAuthenticated() ? getStoredUser() : null;
                if (!session) {
                  sessionStorage.setItem(
                    "pending-booking",
                    JSON.stringify({ ...dates, chambreId: r.id }),
                  );
                  setPath("/connexion");
                  return;
                }
                if (String(session.role).toUpperCase() !== "CLIENT") {
                  toast("Seuls les clients peuvent réserver.");
                  return;
                }
                actions.createReservation.mutate(
                  { chambreId: r.id, body: reservationBody(dates) },
                  {
                    onSuccess: () => {
                      if (String(pending?.chambreId) === String(r.id)) {
                        sessionStorage.removeItem("pending-booking");
                      }
                      toast("Votre demande de réservation est envoyée.");
                      setPath("/client/reservations");
                    },
                    onError: (err) => toast(apiMessage(err)),
                  },
                );
              }}
            >
              <b>Préparer votre séjour</b>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <Input
                  label="Arrivée"
                  type="date"
                  min={localToday()}
                  required
                  value={dates.from}
                  onChange={(e) => setDates({ ...dates, from: e.target.value })}
                />
                <Input
                  label="Départ"
                  type="date"
                  min={dates.from || localToday()}
                  required
                  value={dates.to}
                  onChange={(e) => setDates({ ...dates, to: e.target.value })}
                />
                <Select
                  label="Adultes"
                  value={dates.adults}
                  onChange={(e) =>
                    setDates({ ...dates, adults: e.target.value })
                  }
                  options={[1, 2, 3, 4].map((n) => [
                    String(n),
                    `${n} adulte${n > 1 ? "s" : ""}`,
                  ])}
                />
                <Select
                  label="Enfants"
                  value={dates.children}
                  onChange={(e) =>
                    setDates({ ...dates, children: e.target.value })
                  }
                  options={[0, 1, 2, 3].map((n) => [
                    String(n),
                    `${n} enfant${n > 1 ? "s" : ""}`,
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
function PublicSimple({ type }) {
  const d = useData();
  if (type === "services")
    return (
      <>
        <PublicNav />
        <section className="section">
          <div className="eyebrow">Nos services</div>
          <h1 className="page-title">Les attentions de la maison</h1>
          <p className="muted">
            Des services disponibles pendant votre sejour.
          </p>
          <div className="grid rooms-grid" style={{ marginTop: 28 }}>
            {d.services
              .filter((s) => s.actif)
              .map((s) => (
                <div className="panel" key={s.id}>
                  <Sparkles color="#C5A059" />
                  <h3 style={{ marginTop: 16 }}>{s.nom}</h3>
                  <p className="muted">{s.description}</p>
                  <b>{money(s.prixUnitaire)}</b>
                </div>
              ))}
          </div>
        </section>
        <Footer />
      </>
    );
  if (type === "about")
    return (
      <>
        <PublicNav />
        <section className="section">
          <div className="room-detail">
            <img
              src="/dar-selene-hero.jpg"
              alt={`Maison d’hôtes ${d.auberge.nom || "à Agadir"}`}
            />
            <div>
              <div className="eyebrow">Notre maison</div>
              <h1 className="page-title">Une adresse à {d.auberge.ville || "découvrir"}.</h1>
              <p className="muted" style={{ lineHeight: 1.9 }}>
                {d.auberge.description || ""}
              </p>
              <Link className="btn primary" href="/chambres">
                Trouver une chambre
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  return (
    <>
      <PublicNav />
      <section className="section">
        <div className="eyebrow">Contact</div>
        <h1 className="page-title">Nous trouver</h1>
        <div className="contact-row">
          <div>
            <p className="muted">Coordonnees de la maison.</p>
            <p>
              <MapPin size={16} /> {d.auberge.adresse || "Non renseigne"},{" "}
              {d.auberge.ville || "Non renseigne"}
            </p>
            <p>
              <Phone size={16} /> {d.auberge.telephone || "Non renseigne"}
            </p>
            <div className="notice-bar">
              Le formulaire de contact sera ajoute lorsque son endpoint sera
              disponible.
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

function AuthPage({ mode }) {
  const { auberge } = useData();
  const actions = useActions();
  const [feedback, setFeedback] = useState("");
  const [, setpath] = useLocation();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const forgotMutation = useforgot();
  const resetMutation = useReset();

  // lien du mail : /reset-password?token=...&email=...
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("token") || "";
  const resetEmail = params.get("email") || "";

  const isPending =
    registerMutation.isPending ||
    loginMutation.isPending ||
    forgotMutation.isPending ||
    resetMutation.isPending;

  const fail = (error) => setFeedback(apiMessage(error));

  const submit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback("");

    if (mode === "register") {
      const payload = {
        nom: formData.get("nom"),
        prenom: formData.get("prenom"),
        genre: formData.get("genre"),
        email: formData.get("email"),
        password: formData.get("password"),
        password_confirmation: formData.get("password_confirmation"),
      };
      if (payload.password !== payload.password_confirmation) {
        setFeedback("Les mots de passe ne correspondent pas.");
        return;
      }
      registerMutation.mutate(payload, {
        onSuccess: (response) =>
          setFeedback(response?.message || "Compte créé avec succès."),
        onError: fail,
      });
    }

    if (mode === "login") {
      const payload = {
        email: formData.get("email"),
        password: formData.get("password"),
      };
      loginMutation.mutate(payload, {
        onSuccess: (response) => {
          const role = String(response.user.role).toUpperCase();
          queryClient.clear(); // pas de cache d'un ancien compte
          saveAuth({
            token: response.token,
            user: { ...response.user, role },
          });
          AuthAPI.me().then((profile) => {
            saveAuth({
              token: getStoredToken(),
              user: { ...response.user, ...profile?.user, role },
            });
            const pending = JSON.parse(
              sessionStorage.getItem("pending-booking") || "null",
            );
            if (role === "CLIENT" && pending?.chambreId) {
              actions.createReservation.mutate(
                {
                  chambreId: pending.chambreId,
                  body: reservationBody(pending),
                },
                {
                  onSuccess: () => {
                    sessionStorage.removeItem("pending-booking");
                    toast("Votre demande de réservation est envoyée.");
                    setpath("/client/reservations");
                  },
                  onError: (error) => {
                    fail(error);
                    setpath(`/chambres/${pending.chambreId}`);
                  },
                },
              );
              return;
            }
            setpath(roleBase[role] || "/");
          }).catch((error) => {
            fail(error);
            const pending = JSON.parse(
              sessionStorage.getItem("pending-booking") || "null",
            );
            setpath(
              role === "CLIENT" && pending?.chambreId
                ? `/chambres/${pending.chambreId}`
                : roleBase[role] || "/",
            );
          });
        },
        onError: fail,
      });
    }

    if (mode === "forgot") {
      forgotMutation.mutate(
        { email: formData.get("email") },
        {
          onSuccess: (response) =>
            setFeedback(
              response?.message || "Lien de réinitialisation envoyé avec succès.",
            ),
          onError: fail,
        },
      );
    }

    if (mode === "reset") {
      const payload = {
        email: formData.get("email"),
        token: formData.get("token"),
        password: formData.get("password"),
        password_confirmation: formData.get("password_confirmation"),
      };
      if (payload.password !== payload.password_confirmation) {
        setFeedback("Les mots de passe ne correspondent pas.");
        return;
      }
      resetMutation.mutate(payload, {
        onSuccess: (response) => {
          setFeedback(
            response?.message || "Mot de passe réinitialisé avec succès.",
          );
          setTimeout(() => setpath("/connexion"), 1500);
        },
        onError: fail,
      });
    }
  };

  return (
    <>
      <PublicNav />

      <div className="auth-wrap">
        <div className="auth-photo">
          <div>
            <div className="eyebrow">
              {auberge.nom || "Azuveria Médina"}
              {auberge.ville ? ` · ${auberge.ville}` : ""}
            </div>

            <h2 className="serif" style={{ fontSize: 38 }}>
              L hospitalite
              <br />
              commence ici.
            </h2>
          </div>
        </div>

        <div className="auth-form">
          <div className="eyebrow">Votre espace</div>

          <h1>
            {mode === "login"
              ? "Connexion"
              : mode === "register"
                ? "Creer un compte"
                : mode === "forgot"
                  ? "Mot de passe oublie"
                  : "Reinitialiser le mot de passe"}
          </h1>

          <p className="muted">
            Retrouvez vos sejours et les informations de votre maison.
          </p>

          <form onSubmit={submit}>
            {mode === "register" && (
              <div className="form-grid">
                <Input label="Prenom" name="prenom" maxLength="20" required />
                <Input label="Nom" name="nom" maxLength="20" required />
              </div>
            )}

            {mode === "register" && (
              <Select
                label="Genre"
                name="genre"
                options={[
                  ["femme", "Femme"],
                  ["homme", "Homme"],
                ]}
              />
            )}

            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              required
              defaultValue={mode === "reset" ? resetEmail : undefined}
              readOnly={mode === "reset"}
            />

            {mode === "reset" && (
              <input type="hidden" name="token" value={resetToken} />
            )}

            {(mode === "login" || mode === "register" || mode === "reset") && (
              <>
                <Input
                  label="Mot de passe"
                  name="password"
                  type="password"
                  minLength="8"
                  required
                />

                {mode !== "login" && (
                  <Input
                    label="Confirmer le mot de passe"
                    name="password_confirmation"
                    type="password"
                    minLength="8"
                    required
                  />
                )}
              </>
            )}

            <button
              className="btn primary"
              type="submit"
              style={{ width: "100%", marginTop: 8 }}
              disabled={isPending}
            >
              {isPending
                ? "Chargement..."
                : mode === "login"
                  ? "Se connecter"
                  : mode === "register"
                    ? "Creer mon compte"
                    : "Continuer"}
            </button>
          </form>

          {feedback && (
            <div className="notice" role="status">
              {feedback}
            </div>
          )}

          <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
            {mode === "login" ? (
              <>
                Pas encore de compte ?{" "}
                <Link href="/inscription">Creer un compte</Link>
                <br />
                <Link href="/mot-de-passe-oublie">Mot de passe oublie ?</Link>
              </>
            ) : (
              <Link href="/connexion">Retour a la connexion</Link>
            )}
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}


function DashboardPage({ role }) {
  const d = useData(),
    today = localToday(),
    bookings = d.reservations,
    occupied = d.rooms.filter((r) => r.statut === "OCCUPEE").length,
    collected = d.invoices.reduce((a, i) => a + i.montantPaye, 0);
  if (role === "CLIENT") {
    const me = JSON.parse(localStorage.getItem("auberge-session") || "{}"),
      mine = bookings,
      upcoming = mine.find((b) =>
        ["CONFIRMEE", "EN_ATTENTE"].includes(b.statut),
      );
    return (
      <>
        <PageHead
          title={me.prenom ? `Bonjour ${me.prenom},` : "Bonjour,"}
          subtitle="Votre prochaine escapade se prépare ici."
          action={
            <Link className="btn primary" href="/chambres">
              <BedDouble size={15} />
              Réserver un séjour
            </Link>
          }
        />
        <div className="cards">
          <Metric
            label="Réservations actives"
            value={
              mine.filter((b) =>
                ["CONFIRMEE", "EN_ATTENTE", "EN_COURS"].includes(b.statut),
              ).length
            }
            icon={CalendarDays}
          />
          <Metric
            label="Séjours terminés"
            value={mine.filter((b) => b.statut === "TERMINEE").length}
            icon={Check}
          />
          <Metric
            label="Solde à régler"
            value={money(
              d.invoices
                .filter((i) => mine.some((b) => b.id === i.reservationId))
                .reduce((s, i) => s + balance(i), 0),
            )}
            icon={Receipt}
          />
        </div>
        {upcoming && (
          <div
            className="panel"
            style={{ background: "#293d60", color: "white" }}
          >
            <div className="eyebrow">Votre prochain séjour</div>
            <h2 className="serif" style={{ fontSize: 26 }}>
              Chambre {upcoming.chambre?.numero} ·{" "}
              {date(upcoming.dateDebut)}
            </h2>
            <p>
              {date(upcoming.dateDebut)} – {date(upcoming.dateFin)} ·{" "}
              {upcoming.reference}
            </p>
            <Link
              className="btn gold"
              href={`/client/reservations/${upcoming.id}`}
            >
              Voir les détails
            </Link>
          </div>
        )}
        <PageHead title="Derniers séjours" />
        <ReservationsTable role={role} rows={mine.slice(0, 5)} client />
      </>
    );
  }
  if (role === "RECEPTIONNISTE") {
    const arrivals = bookings.filter(
        (b) => b.dateDebut === today && b.statut === "CONFIRMEE",
      ),
      departures = bookings.filter(
        (b) => b.dateFin === today && b.statut === "EN_COURS",
      );
    return (
      <>
        <PageHead
          title="Accueil"
          subtitle="Le point d’accueil de votre journée."
        />
        <div className="cards">
          <Metric
            label="Arrivées aujourd’hui"
            value={arrivals.length}
            icon={DoorOpen}
          />
          <Metric
            label="Départs aujourd’hui"
            value={departures.length}
            icon={LogOut}
          />
          <Metric
            label="Chambres occupées"
            value={`${occupied} / ${d.rooms.length}`}
            icon={BedDouble}
          />
          <Metric
            label="À nettoyer"
            value={d.rooms.filter((r) => r.statut === "EN_NETTOYAGE").length}
            icon={Sparkles}
          />
        </div>
        <div className="stat-columns">
          <div className="panel">
            <h3>Occupation de la semaine</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={Array.from({ length: 7 }, (_, i) => {
                    const day = new Date();
                    day.setDate(day.getDate() - day.getDay() + i + 1);
                    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                    return {
                      j: new Intl.DateTimeFormat("fr-FR", {
                        weekday: "short",
                      }).format(day),
                      t: bookings.filter(
                        (b) =>
                          b.dateDebut <= key &&
                          b.dateFin > key &&
                          b.statut !== "ANNULEE",
                      ).length,
                    };
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="j" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    dataKey="t"
                    stroke="#c5a059"
                    fill="#efe4cc"
                    name="Chambres"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="panel">
            <h3>À suivre</h3>
            <p>
              <Status value="EN_ATTENTE" />{" "}
              {bookings.filter((b) => b.statut === "EN_ATTENTE").length}{" "}
              demandes à confirmer
            </p>
            <p>
              <Status value="DISPONIBLE" />{" "}
              {d.rooms.filter((r) => r.statut === "DISPONIBLE").length} chambres
              disponibles
            </p>
            <h3 style={{ marginTop: 24 }}>Paiements récents</h3>
            {d.payments.slice(0, 3).map((p) => (
              <p key={p.id} className="muted">
                {money(p.montant)} · Espèces · {date(p.datePaiement)}
              </p>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Arrivées attendues</h3>
          <ReservationsTable role={role} rows={arrivals} />
        </div>
      </>
    );
  }
  const clients = d.users.filter((u) => u.role === "CLIENT").length,
    balanceTotal = d.invoices.reduce((s, i) => s + balance(i), 0),
    activity = [
      ...d.payments.map((p) => ({
        date: p.datePaiement,
        text: `Paiement espèces · ${money(p.montant)}`,
      })),
      ...bookings.map((b) => ({
        date: b.dateDebut,
        text: `Séjour ${b.reference} · ${statusNames[b.statut]}`,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  return (
    <>
      <PageHead
        title="Tableau de bord"
        subtitle={`Vue d’ensemble de ${d.auberge.nom || "l’auberge"}.`}
      />
      <div className="cards">
        <Metric
          label="Réservations"
          value={bookings.length}
          icon={CalendarDays}
          note="Tous statuts"
        />
        <Metric
          label="Occupation"
          value={`${Math.round((occupied / Math.max(1, d.rooms.length)) * 100)}%`}
          icon={BedDouble}
        />
        <Metric
          label="Recettes encaissées"
          value={money(collected)}
          icon={CreditCard}
        />
        <Metric
          label="Soldes à percevoir"
          value={money(balanceTotal)}
          icon={Receipt}
        />
        <Metric label="Clients" value={clients} icon={Users} />
      </div>
      <div className="stat-columns">
        <div className="panel">
          <h3>Recettes mensuelles</h3>
          <RevenueChart />
        </div>
        <div className="panel">
          <h3>État des chambres</h3>
          <RoomPie rooms={d.rooms} />
        </div>
      </div>
      <div className="stat-columns">
        <div className="panel">
          <h3>Réservations dans le temps</h3>
          <ReservationsTrend reservations={bookings} />
        </div>
        <div className="panel">
          <h3>Activité récente</h3>
          {activity.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "11px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <b>{item.text}</b>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {date(item.date)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3>Réservations récentes</h3>
        <ReservationsTable role={role} rows={bookings.slice(0, 5)} />
      </div>
    </>
  );
}
function ReservationsTrend({ reservations }) {
  const now = new Date(),
    months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1),
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
        count: reservations.filter(
          (b) => b.dateDebut.slice(0, 7) === key && b.statut !== "ANNULEE",
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
function RevenueChart({ data: chartData }) {
  const { payments } = useData();
  const data =
    chartData ||
    (() => {
      const now = new Date();
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1),
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return {
          mois: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
          montant: payments
            .filter((p) => String(p.datePaiement).slice(0, 7) === key)
            .reduce((s, p) => s + p.montant, 0),
        };
      });
    })();
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="mois" />
          <YAxis />
          <Tooltip formatter={(v) => money(v)} />
          <Bar dataKey="montant" fill="#2A3B5F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function RoomPie({ rooms }) {
  const data = [
    {
      name: "Disponible",
      value: rooms.filter((x) => x.statut === "DISPONIBLE").length,
    },
    {
      name: "Occupée",
      value: rooms.filter((x) => x.statut === "OCCUPEE").length,
    },
    {
      name: "À préparer",
      value: rooms.filter((x) => x.statut === "EN_NETTOYAGE").length,
    },
    {
      name: "Maintenance",
      value: rooms.filter((x) => x.statut === "EN_MAINTENANCE").length,
    },
  ];
  const colors = ["#c5a059", "#2A3B5F", "#d5c6a8", "#b3675d"];
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={88}
            paddingAngle={3}
          >
            {data.map((x, i) => (
              <Cell key={x.name} fill={colors[i]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          fontSize: 11,
          flexWrap: "wrap",
        }}
      >
        {data.map((x, i) => (
          <span key={x.name}>
            <i
              style={{
                background: colors[i],
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 9,
                marginRight: 5,
              }}
            />
            {x.name} {x.value}
          </span>
        ))}
      </div>
    </div>
  );
}
function ReservationsTable({role, rows, client = false }) {
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>
                <b>{b.reference}</b>
              </td>
              <td>
                {b.client?.prenom} {b.client?.nom}
              </td>
              <td>{b.chambre?.numero}</td>
              <td>{date(b.dateDebut)}</td>
              <td>{date(b.dateFin)}</td>
              <td>{money(reservationTotal(b))}</td>
              <td>
                <Status value={b.statut} />
              </td>
              {role==="RECEPTIONNISTE" &&(
              <td>
                <Link
                  className="btn small"
                  href={`/${client ? "client" : "reception"}/reservations/${b.id}`}
                >
                  <Eye size={14} />
                  Voir
                </Link>
              </td>)}
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
function InvoiceView({ invoice, client = false, receptionist = false }) {
  const actions = useActions();
  const { auberge, reservations } = useData();
  const b =
    invoice.reservation ??
    reservations.find((x) => x.id === invoice.reservationId);
  if (!b) return <div className="empty">Réservation associée introuvable.</div>;
  const room = b.chambre,
    rate = b.prixNuitApplique ?? room?.prixNuit ?? 0;
  const invoiceLines = invoice.lignesFacture || [];
  return (
    <>
      <div className="panel" id="invoice-print">
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 15 }}
        >
          <div>
            <div className="brand">
              <span className="brand-mark">{brandInitial(auberge.nom)}</span>
              {auberge.nom || "Azuveria Médina"}
            </div>
            <p className="muted">
              {auberge.adresse} · {auberge.ville}
              <br />
              {auberge.telephone}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow">Facture</div>
            <h2 className="serif">{invoice.numero}</h2>
            <span>Émise le {date(invoice.dateEmission)}</span>
          </div>
        </div>
        <hr
          style={{
            border: 0,
            borderTop: "1px solid var(--line)",
            margin: "20px 0",
          }}
        />
        <div className="form-grid">
          <div>
            <b>Client</b>
            <p>
              {b.client?.prenom} {b.client?.nom}
              <br />
              {b.client?.email}
            </p>
          </div>
          <div>
            <b>Séjour</b>
            <p>
              Réf. {b.reference} · Chambre {room?.numero}
              <br />
              {date(b.dateDebut)} – {date(b.dateFin)}
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
              {invoiceLines.length ? invoiceLines.map((line, index) => (
                <tr key={line.id ?? index}>
                  <td>{line.description}</td>
                  <td>{line.quantite}</td>
                  <td>{money(line.prixUnitaire)}</td>
                  <td>{money(line.sousTotal)}</td>
                </tr>
              )) : (
                <tr>
                  <td>Chambre {room?.numero} — {nights(b)} nuit(s)</td>
                  <td>{nights(b)}</td>
                  <td>{money(rate)}</td>
                  <td>{money(nights(b) * rate)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ maxWidth: 300, margin: "20px 0 0 auto" }}>
          <p>
            Total{" "}
            <b style={{ float: "right" }}>{money(invoiceTotal(invoice))}</b>
          </p>
          <p>
            Déjà réglé{" "}
            <b style={{ float: "right" }}>{money(invoice.montantPaye)}</b>
          </p>
          <p>
            Solde restant{" "}
            <b style={{ float: "right", color: "#a34e45" }}>
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
      <div className="no-print" style={{ display: "flex", gap: 10 }}>
        <Button onClick={() => window.print()}>
          <Printer size={15} />
          Imprimer
        </Button>
        {client && (
          <span className="muted" style={{ alignSelf: "center", fontSize: 12 }}>
            Pour régler, adressez-vous à la réception.
          </span>
        )}
        {receptionist && invoice.statut === "PAYEE" && (
          <Button
            onClick={() =>
              actions.resendPaymentConfirmation.mutate(invoice.id, {
                onSuccess: () => toast("Confirmation de paiement renvoyée."),
                onError: (error) => toast(apiMessage(error)),
              })
            }
          >
            Renvoyer la confirmation
          </Button>
        )}
      </div>
    </>
  );
}
function DataPage({ role, path, id }) {
  const [, setPath] = useLocation();
  const data = useData();
  const actions = useActions();
  const isReservationDetail =
    path.startsWith("/client/reservations/") ||
    path.startsWith("/reception/reservations/");
  const reservationDetail = useReservationDetail(id, role, isReservationDetail);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState("");
  const [edit, setEdit] = useState(null);
  const [selection, setSelection] = useState("");
  const [serviceSelection, setServiceSelection] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState("1");
  const [filterRole, setFilterRole] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const receptionist = role === "RECEPTIONNISTE";
  const client = role === "CLIENT";
  const editItem = (type, item = null) => {
    setEdit(item);
    setModal(type);
  };
  const fail = (e) => toast(apiMessage(e));
  if (data.error) {
    return <div className="warning" role="alert">{apiMessage(data.error)}</div>;
  }
  if (data.isLoading) {
    return <div className="panel" role="status">Chargement des données…</div>;
  }
  if (isReservationDetail && reservationDetail.isLoading) {
    return <div className="panel" role="status">Chargement de la réservation…</div>;
  }
  if (isReservationDetail && reservationDetail.error) {
    return <div className="warning" role="alert">{apiMessage(reservationDetail.error)}</div>;
  }
  const saveModal = (values) => {
    const done = {
      onSuccess: () => {
        toast(
          modal === "receptionniste"
            ? "Compte créé. Un lien d’activation a été envoyé par e-mail."
            : edit
              ? "Enregistré."
              : "Ajouté.",
        );
        setModal("");
      },
      onError: fail,
    };
    if (modal === "receptionniste") {
      actions.createReceptionniste.mutate(values, done);
      return;
    }
    const isRoom = modal === "room";
    const body = isRoom ? roomBody(values) : serviceBody(values);
    const m = isRoom
      ? edit ? actions.updateRoom : actions.createRoom
      : edit ? actions.updateService : actions.createService;
    m.mutate(edit ? { id: edit.id, body } : body, done);
  };
  if (path.endsWith("/dashboard")) return <DashboardPage role={role} />;
  const canCancel = (b) => {
    const createdAt = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
    return b.statut === "CONFIRMEE" &&
      b.dateDebut > new Date().toISOString().slice(0, 10) &&
      Number.isFinite(createdAt) &&
      Date.now() <= createdAt + 24 * 60 * 60 * 1000;
  };
  if (path === "/client/reservations" || path === "/reception/reservations") {
    let rows = data.reservations.filter(
      (b) =>
        (!query ||
          `${b.reference} ${b.client?.prenom} ${b.client?.nom} ${b.chambre?.numero}`
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!status || b.statut === status) &&
        (!dateFrom || b.dateFin >= dateFrom) &&
        (!dateTo || b.dateDebut <= dateTo),
    );
    return (
      <>
        <PageHead
          title={client ? "Mes réservations" : "Réservations"}
          subtitle={
            client
              ? "Retrouvez les informations de vos séjours."
              : "Suivez les demandes et séjours de la maison."
          }
        />
        <div className="panel">
          <div className="filters">
            <input
              className="input"
              placeholder="Référence, client, chambre…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              {[
                "EN_ATTENTE",
                "CONFIRMEE",
                "EN_COURS",
                "TERMINEE",
                "ANNULEE",
              ].map((s) => (
                <option value={s} key={s}>
                  {statusNames[s]}
                </option>
              ))}
            </select>
            <input
              className="input"
              aria-label="Séjour à partir du"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              className="input"
              aria-label="Séjour jusqu’au"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <ReservationsTable role={role} rows={rows} client={client} />
        </div>
        {modal && (
          <EntityModal type={modal} item={edit} onClose={() => setModal("")} onSubmit={saveModal} />
        )}
      </>
    );
  }
  if (
    path.startsWith("/client/reservations/") ||
    path.startsWith("/reception/reservations/")
  ) {
    const b = reservationDetail.data ??
      data.reservations.find((x) => String(x.id) === String(id));
    if (!b) return <EmptyPage text="Cette réservation est introuvable." />;
    const inv = data.invoices.find((i) => i.reservationId === b.id);
    return (
      <>
        <div className="breadcrumb">
          <Link href={`/${client ? "client" : "reception"}/reservations`}>
            Réservations
          </Link>{" "}
          / {b.reference}
        </div>
        <PageHead title={`Réservation ${b.reference}`} />
        <div className="stat-columns">
          <div className="panel">
            <h3>Détails du séjour</h3>
            <p>
              <b>Client :</b> {b.client?.prenom}{" "}
              {b.client?.nom}
            </p>
            <p>
              <b>Chambre :</b> {b.chambre?.numero} —{" "}
              {b.chambre?.type}
            </p>
            <p>
              <b>Arrivée :</b> {date(b.dateDebut)}
            </p>
            <p>
              <b>Départ :</b> {date(b.dateFin)}
            </p>
            <p>
              <b>Voyageurs :</b> {b.nombreAdultes} adulte(s), {b.nombreEnfants}{" "}
              enfant(s)
            </p>
            <p>
              <b>Montant estimé :</b> {money(reservationTotal(b))}
            </p>
            <Status value={b.statut} />
            {b.services.length > 0 && (
              <div>
                <h4>Services associés</h4>
                {b.services.map((service, index) => (
                  <p key={service.id ?? `${service.serviceId}-${index}`}>
                    {service.nom} × {service.quantite} —{" "}
                    {money(service.quantite * service.prixUnitaireApplique)}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="panel">
            <h3>Actions</h3>
            {receptionist && b.statut === "CONFIRMEE" && (
              <Button kind="primary" onClick={() => bookingCheckin(b, actions)}>
                Effectuer le check-in
              </Button>
            )}
            {receptionist && b.statut === "EN_COURS" && (
              <Button kind="primary" onClick={() => bookingCheckout(b, actions)}>
                Effectuer le check-out
              </Button>
            )}
            {inv && (
              <p>
                <Link
                  className="btn"
                  href={`/${client ? "client" : "reception"}/factures/${inv.id}`}
                >
                  Consulter la facture {inv.numero}
                </Link>
              </p>
            )}
            {client && inv && balance(inv) > 0 && b.statut !== "ANNULEE" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!serviceSelection) {
                    toast("Choisissez un service.");
                    return;
                  }
                  actions.addReservationService.mutate(
                    {
                      id: b.id,
                      body: {
                        services: [{
                          service_id: Number(serviceSelection),
                          quantite: Number(serviceQuantity),
                        }],
                      },
                    },
                    {
                      onSuccess: () => {
                        toast("Service ajouté à la réservation.");
                        setServiceSelection("");
                        setServiceQuantity("1");
                      },
                      onError: fail,
                    },
                  );
                }}
              >
                <h4>Ajouter un service</h4>
                <Select
                  label="Service"
                  value={serviceSelection}
                  onChange={(event) => setServiceSelection(event.target.value)}
                  options={[
                    ["", "Choisir un service"],
                    ...data.services
                      .filter((service) => service.actif)
                      .map((service) => [
                        service.id,
                        `${service.nom} — ${money(service.prixUnitaire)}`,
                      ]),
                  ]}
                />
                <Input
                  label="Quantité"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={serviceQuantity}
                  onChange={(event) => setServiceQuantity(event.target.value)}
                />
                <FormButton>Ajouter à la facture</FormButton>
              </form>
            )}
            {canCancel(b) && (
              <Button
                kind="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Confirmer l’annulation de cette réservation ?",
                    )
                  )
                    actions.cancelReservation.mutate(b.id, {
                      onSuccess: () => toast("Réservation annulée."),
                      onError: fail,
                    });
                }}
              >
                Annuler la réservation
              </Button>
            )}
            {!canCancel(b) && !receptionist && (
              <p className="muted" style={{ fontSize: 12 }}>
                Annulation possible uniquement avant la date d’arrivée, pour une
                demande en attente ou confirmée.
              </p>
            )}
          </div>
        </div>
      </>
    );
  }
  if (path === "/client/factures" || path === "/reception/factures") {
    const mine = data.invoices;
    return (
      <>
        <PageHead
          title={client ? "Mes factures" : "Facturation"}
          subtitle={
            client
              ? "Consultez les montants et soldes de vos séjours."
              : "Factures calculées à partir des nuits et services associés."
          }
        />
        <div className="panel">
          <div className="table-wrap">
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
                {mine.map((i) => {
                  const b = data.reservations.find(
                    (x) => x.id === i.reservationId,
                  );
                  return (
                    <tr key={i.id}>
                      <td>
                        <b>{i.numero}</b>
                      </td>
                      <td>{date(i.dateEmission)}</td>
                      <td>{b?.reference}</td>
                      <td>{money(invoiceTotal(i))}</td>
                      <td>{money(i.montantPaye)}</td>
                      <td>{money(balance(i))}</td>
                      <td>
                        <Status value={invoiceStatus(i)} />
                      </td>
                      <td>
                        <Link
                          className="btn small"
                          href={`/${client ? "client" : "reception"}/factures/${i.id}`}
                        >
                          <Eye size={14} />
                          Détail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!mine.length && (
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
  if (
    path.startsWith("/client/factures/") ||
    path.startsWith("/reception/factures/")
  ) {
    const inv = data.invoices.find((i) => String(i.id) === String(id));
    return inv ? (
      <>
        <PageHead title={`Facture ${inv.numero}`} />
        <InvoiceView
          invoice={inv}
          client={client}
          receptionist={receptionist}
        />
      </>
    ) : (
      <EmptyPage text="Facture introuvable." />
    );
  }
  if (path === "/client/profil") {
    const me = getStoredUser() || {};
    return (
      <>
        <PageHead
          title="Mon profil"
          subtitle="Gerez les informations de votre compte."
        />
        <div className="panel" style={{ maxWidth: 680 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              actions.updateProfile.mutate(f, {
                onSuccess: () => {
                  saveAuth({ token: getStoredToken(), user: { ...me, ...f } });
                  toast("Profil mis à jour.");
                },
                onError: fail,
              });
            }}
          >
            <div className="form-grid">
              <Input
                name="prenom"
                label="Prenom"
                defaultValue={me.prenom || ""}
                required
              />
              <Input
                name="nom"
                label="Nom"
                defaultValue={me.nom || ""}
                required
              />
              <Input
                label="Adresse e-mail"
                type="email"
                value={me.email || ""}
                readOnly
              />
              <Select
                name="genre"
                label="Genre"
                defaultValue={me.genre || "femme"}
                options={[
                  ["femme", "Femme"],
                  ["homme", "Homme"],
                ]}
              />
            </div>
            <FormButton>Enregistrer mon profil</FormButton>
          </form>
          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--line)",
              margin: "28px 0",
            }}
          />
          <h3>Changer le mot de passe</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = Object.fromEntries(new FormData(form));
              if (f.password !== f.password_confirmation) {
                toast("Les mots de passe ne correspondent pas.");
                return;
              }
              actions.changePassword.mutate(f, {
                onSuccess: () => {
                  toast("Mot de passe modifié. Reconnectez-vous.");
                  form.reset();
                  clearAuth();
                  queryClient.clear();
                  setPath("/connexion");
                },
                onError: fail,
              });
            }}
          >
            <Input
              name="current_password"
              label="Mot de passe actuel"
              type="password"
              required
            />
            <Input
              name="password"
              label="Nouveau mot de passe"
              type="password"
              minLength="8"
              required
            />
            <Input
              name="password_confirmation"
              label="Confirmer le nouveau mot de passe"
              type="password"
              minLength="8"
              required
            />
            <FormButton>Mettre a jour</FormButton>
          </form>
        </div>
      </>
    );
  }
  if (path === "/reception/chambres")
    return (
      <>
        <PageHead
          title="Chambres"
          subtitle={`État opérationnel des chambres de ${data.auberge.nom || "l’auberge"}.`}
          action={
            <Button kind="primary" onClick={() => editItem("room")}>
              <Plus size={15} />
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
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tous les états</option>
              {["DISPONIBLE", "OCCUPEE", "EN_NETTOYAGE", "EN_MAINTENANCE"].map(
                (x) => (
                  <option key={x} value={x}>
                    {statusNames[x]}
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
                {data.rooms
                  .filter(
                    (r) =>
                      (!query || r.numero.includes(query)) &&
                      (!status || r.statut === status),
                  )
                  .map((r) => (
                    <tr key={r.id}>
                      <td>
                        <b>{r.numero}</b>
                      </td>
                      <td>{r.type}</td>
                      <td>{r.capacite}</td>
                      <td>{money(r.prixNuit)}</td>
                      <td>
                        <Status value={r.statut} />
                      </td>
                      <td>
                        <Button
                          kind="small"
                          onClick={() => editItem("room", r)}
                        >
                          <Pencil size={14} />
                          Modifier
                        </Button>{" "}
                        <select
                          aria-label="Changer le statut"
                          className="select"
                          style={{ width: 145, padding: 7 }}
                          value={r.statut}
                          onChange={(e) =>
                            actions.setRoomStatus.mutate(
                              {
                                id: r.id,
                                body: { status: e.target.value.toLowerCase() },
                              },
                              {
                                onSuccess: () => toast("Statut de la chambre mis à jour."),
                                onError: fail,
                              },
                            )
                          }
                        >
                          {[
                            "DISPONIBLE",
                            "OCCUPEE",
                            "EN_NETTOYAGE",
                            "EN_MAINTENANCE",
                          ].map((x) => (
                            <option value={x} key={x}>
                              {statusNames[x]}
                            </option>
                          ))}
                        </select>{" "}
                        <Button
                          kind="small danger"
                          onClick={() => {
                            if (window.confirm("Supprimer cette chambre ?"))
                              actions.deleteRoom.mutate(r.id, {
                                onSuccess: () => toast("Chambre supprimée."),
                                onError: fail,
                              });
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        {modal && (
          <EntityModal type={modal} item={edit} onClose={() => setModal("")} onSubmit={saveModal} />
        )}
      </>
    );
  if (path === "/reception/services") {
    return (
      <>
        <PageHead
          title="Services"
          subtitle="Les prestations proposées aux voyageurs."
          action={
            <Button kind="primary" onClick={() => editItem("service")}>
              <Plus size={15} />
              Ajouter un service
            </Button>
          }
        />
        <div className="panel">
          <div className="table-wrap">
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
                {data.services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.nom}</b>
                    </td>
                    <td>{s.description}</td>
                    <td>{money(s.prixUnitaire)}</td>
                    <td>
                      <Status value={s.actif ? "DISPONIBLE" : "ANNULEE"} />
                    </td>
                    <td>
                      <Button
                        kind="small"
                        onClick={() => editItem("service", s)}
                      >
                        <Pencil size={14} />
                        Modifier
                      </Button>{" "}
                      <Button
                        kind="small"
                        onClick={() =>
                          actions.updateService.mutate(
                            {
                              id: s.id,
                              body: serviceBody({ ...s, actif: !s.actif }),
                            },
                            { onError: fail },
                          )
                        }
                      >
                        {s.actif ? "Désactiver" : "Activer"}
                      </Button>{" "}
                      <Button
                        kind="small danger"
                        onClick={() => {
                          if (window.confirm("Supprimer ce service ?"))
                            actions.deleteService.mutate(s.id, {
                              onSuccess: () => toast("Service supprimé."),
                              onError: fail,
                            });
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {modal && (
          <EntityModal type={modal} item={edit} onClose={() => setModal("")} onSubmit={saveModal} />
        )}
      </>
    );
  }
  if (path === "/reception/paiements") {
    const outstanding = data.invoices.filter((i) => balance(i) > 0);
    return (
      <>
        <PageHead
          title="Paiements en especes"
          subtitle="Enregistrez les reglements realises a la reception."
        />
        <div className="panel">
          <h3>Nouveau reglement</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selection) {
                toast("Choisissez une facture à régler.");
                return;
              }
              actions.payInvoice.mutate(
                { id: selection, body: {} },
                {
                  onSuccess: () => {
                    toast("Paiement intégral enregistré.");
                    setSelection("");
                  },
                  onError: (error) => {
                    fail(error);
                    if (error.status === 503 && error.data?.facture) {
                      queryClient.invalidateQueries({ queryKey: ["invoices"] });
                    }
                  },
                },
              );
            }}
          >
            <Select
              label="Facture a regler"
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              options={[
                ["", "Choisir une facture"],
                ...outstanding.map((i) => [
                  i.id,
                  `${i.numero} ? solde ${money(balance(i))}`,
                ]),
              ]}
            />
            <Input
              label="Montant à régler (MAD)"
              value={
                selection
                  ? money(balance(data.invoices.find((i) => String(i.id) === String(selection)) || {}))
                  : "Sélectionnez une facture"
              }
              readOnly
            />
            <div className="notice-bar" style={{ marginBottom: 15 }}>
              Mode de paiement : especes uniquement.
            </div>
            <button className="btn primary" disabled={!selection}>
              Enregistrer le paiement
            </button>
          </form>
        </div>
      </>
    );
  }
  if (path === "/reception/check-in-out") {
    const today = localToday();
    const arrivals = data.reservations.filter(
      (b) => b.dateDebut === today && b.statut === "CONFIRMEE",
    );
    const departures = data.reservations.filter(
      (b) => b.dateFin === today && b.statut === "EN_COURS",
    );
    return (
      <>
        <PageHead
          title="Arrivées & départs"
          subtitle={`Préparez l’accueil et clôturez les séjours du ${date(today)}.`}
        />
        <div className="stat-columns">
          <div className="panel">
            <h3>
              <DoorOpen size={17} /> Arrivées attendues
            </h3>
            {arrivals.map((b) => (
              <CheckRow
                key={b.id}
                b={b}
                action="Arrivée"
                onAction={() => bookingCheckin(b, actions)}
              />
            ))}
            {!arrivals.length && (
              <div className="empty">Aucune arrivée prévue aujourd’hui.</div>
            )}
          </div>
          <div className="panel">
            <h3>
              <LogOut size={17} /> Départs attendus
            </h3>
            {departures.map((b) => (
              <CheckRow
                key={b.id}
                b={b}
                action="Départ"
                onAction={() => bookingCheckout(b, actions)}
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
  if (path === "/admin/utilisateurs") {
    const rows = data.users.filter(
      (u) =>
        (!filterRole || u.role === filterRole) &&
        `${u.prenom} ${u.nom} ${u.email}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return (
      <>
        <PageHead
          title="Utilisateurs"
          subtitle="Comptes clients, réception et administration."
          action={
            <Button kind="primary" onClick={() => editItem("receptionniste")}>
              <Plus size={15} />
              Ajouter un réceptionniste
            </Button>
          }
        />
        <div className="panel">
          <div className="filters">
            <input
              className="input"
              placeholder="Nom ou e-mail"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Tous les roles</option>
              {Object.entries(roleNames).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
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
                  <th>Role</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.prenom} {u.nom}
                    </td>
                    <td>{u.email}</td>
                    <td>{roleNames[u.role] || u.role}</td>
                    <td>
                      {u.role === "RECEPTIONNISTE" && (
                        <Button
                          kind="small danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Supprimer le compte de ${u.prenom} ${u.nom} ?`,
                              )
                            )
                              actions.removeReceptionniste.mutate(
                                { id: u.id, user_id: u.id, email: u.email },
                                {
                                  onSuccess: () => toast("Compte supprimé."),
                                  onError: fail,
                                },
                              );
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="empty">Aucun utilisateur a afficher.</div>
            )}
          </div>
        </div>
        {modal && (
          <EntityModal
            type={modal}
            item={edit}
            onClose={() => setModal("")}
            onSubmit={saveModal}
          />
        )}
      </>
    );
  }
  if (path === "/admin/configuration") {
    const a = data.auberge;
    return (
      <>
        <PageHead
          title="Configuration de l’auberge"
          subtitle="Une seule maison, un seul espace de configuration."
        />
        <div className="panel" style={{ maxWidth: 760 }}>
          <form
            key={a.id ?? "auberge"}
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              actions.updateAuberge.mutate(
                { id: a.id, body: aubergeBody(f) },
                {
                  onSuccess: () => toast("Configuration enregistrée."),
                  onError: fail,
                },
              );
            }}
          >
            <Input
              label="Nom de l’auberge"
              name="nom"
              defaultValue={a.nom}
              required
            />
            <div className="form-grid">
              <Input label="Adresse" name="adresse" defaultValue={a.adresse} required />
              <Input label="Ville" name="ville" defaultValue={a.ville} required />
              <Input
                label="Téléphone"
                name="telephone"
                defaultValue={a.telephone}
                required
              />
            </div>
            <div className="form-field">
              <label>Description</label>
              <textarea
                className="textarea"
                name="description"
                defaultValue={a.description}
                required
              />
            </div>
            <FormButton>Enregistrer les informations</FormButton>
          </form>
        </div>
      </>
    );
  }
  if (path === "/admin/statistiques")
    return <AdminReports data={data} path={path} />;
  return <EmptyPage text="Cette page n’existe pas dans cet espace." />;
}

function AdminReports({ data, path }) {
  const now = localToday(),
    initialFrom = (() => {
      const x = new Date();
      x.setDate(x.getDate() - 180);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    })();
  const [from, setFrom] = useState(initialFrom),
    [to, setTo] = useState(now);
  const rangeOK = from && to && to >= from;
  const bookings = rangeOK
    ? data.reservations.filter((b) => b.dateDebut <= to && b.dateFin >= from)
    : [];
  const paid = rangeOK
    ? data.payments.filter(
        (p) => p.datePaiement >= from && p.datePaiement <= to,
      )
    : [];
  const unpaid = rangeOK
    ? data.invoices.filter(
        (i) => balance(i) > 0 && bookings.some((b) => b.id === i.reservationId),
      )
    : [];
  const span = rangeOK
    ? Math.max(
        1,
        Math.ceil(
          (new Date(to + "T12:00:00") - new Date(from + "T12:00:00")) /
            86400000,
        ) + 1,
      )
    : 1;
  const occupiedNights = bookings
    .filter((b) => b.statut !== "ANNULEE")
    .reduce((sum, b) => {
      const a = Math.max(
          new Date(from + "T12:00:00").getTime(),
          new Date(b.dateDebut + "T12:00:00").getTime(),
        ),
        z = Math.min(
          new Date(to + "T12:00:00").getTime(),
          new Date(b.dateFin + "T12:00:00").getTime(),
        );
      return sum + Math.max(0, Math.ceil((z - a) / 86400000));
    }, 0);
  const occupancy = Math.min(
    100,
    Math.round(
      (occupiedNights / (span * Math.max(1, data.rooms.length))) * 100,
    ),
  );
  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5 + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inRange = `${key}-31` >= from && `${key}-01` <= to;
    return {
      key,
      mois: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
      count: inRange
        ? bookings.filter(
            (b) => b.dateDebut.slice(0, 7) === key && b.statut !== "ANNULEE",
          ).length
        : 0,
      montant: inRange
        ? paid
            .filter((p) => String(p.datePaiement).slice(0, 7) === key)
            .reduce((s, p) => s + p.montant, 0)
        : 0,
    };
  });
  const exportCsv = () => {
    const lines = [
      [
        "Référence",
        "Client",
        "Chambre",
        "Arrivée",
        "Départ",
        "Statut",
        "Total MAD",
      ],
      ...bookings.map((b) => [
        b.reference,
        `${b.client?.prenom} ${b.client?.nom}`,
        b.chambre?.numero,
        b.dateDebut,
        b.dateFin,
        statusNames[b.statut],
        reservationTotal(b),
      ]),
    ];
    const blob = new Blob(
      [
        "\ufeff" +
          lines
            .map((x) =>
              x.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";"),
            )
            .join("\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rapport-dar-selene.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <PageHead
        title={"Statistiques"}
        subtitle="Indicateurs calculés sur la période sélectionnée."
        action={
          <Button onClick={exportCsv}>
            <Download size={15} />
            Exporter CSV
          </Button>
        }
      />
      <div className="filters">
        <Input
          label="Du"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="Au"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Button
          onClick={() =>
            toast(
              rangeOK ? "Période appliquée." : "Choisissez une période valide.",
            )
          }
        >
          Appliquer
        </Button>
      </div>
      {!rangeOK && (
        <div className="warning">
          La date de fin doit être égale ou postérieure à la date de début.
        </div>
      )}
      <div className="cards">
        <Metric
          label="Réservations de la période"
          value={bookings.length}
          icon={CalendarDays}
        />
        <Metric
          label="Recettes encaissées"
          value={money(paid.reduce((s, p) => s + p.montant, 0))}
          icon={CreditCard}
        />
        <Metric
          label="Factures avec solde"
          value={unpaid.length}
          icon={Receipt}
        />
        <Metric
          label="Occupation estimée"
          value={`${occupancy}%`}
          icon={BedDouble}
        />
      </div>
      <div className="stat-columns">
        <div className="panel">
          <h3>Recettes encaissées par mois</h3>
          <RevenueChart
            data={trend.map(({ mois, montant }) => ({ mois, montant }))}
          />
        </div>
        <div className="panel">
          <h3>Réservations dans le temps</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" />
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
        </div>
      </div>
      <div className="panel">
        <h3>Séjours sur la période</h3>
        <ReservationsTable rows={bookings} />
      </div>
    </>
  );
}

function bookingCheckin(b, actions) {
  if (b.statut === "ANNULEE") {
    toast("Une reservation annulee ne peut pas faire l objet d un check-in.");
    return;
  }
  if (!window.confirm("Confirmer le check-in de cette reservation ?")) return;
  actions.checkIn.mutate(b.id, {
    onSuccess: () => toast("Check-in effectué."),
    onError: (e) => toast(apiMessage(e)),
  });
}
function bookingCheckout(b, actions) {
  if (
    !window.confirm(`Confirmer le départ de la chambre ${b.chambre?.numero} ?`)
  )
    return;
  actions.checkOut.mutate(b.id, {
    onSuccess: () => toast("Check-out effectué. Chambre envoyée au nettoyage."),
    onError: (e) => toast(apiMessage(e)),
  });
}
function CheckRow({ b, action, onAction }) {
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
      <b>
        {b.chambre?.numero} · {b.client?.prenom}{" "}
        {b.client?.nom}
      </b>
      <div className="muted" style={{ fontSize: 12, margin: "5px 0 10px" }}>
        {b.reference} · {date(b.dateDebut)} – {date(b.dateFin)}
      </div>
      <Button kind="small primary" onClick={onAction}>
        Confirmer {action.toLowerCase()}
      </Button>
    </div>
  );
}
function EmptyPage({ text }) {
  return (
    <div className="panel empty">
      <CircleAlert size={25} />
      <p>{text}</p>
      <Link className="btn" href="/">
        Retour à l’accueil
      </Link>
    </div>
  );
}
function EntityModal({ type, item, onClose, onSubmit }) {
  const title = {
    room: item ? "Modifier la chambre" : "Ajouter une chambre",
    service: item ? "Modifier le service" : "Ajouter un service",
    receptionniste: "Ajouter un réceptionniste",
  }[type];
  const submit = (e) => {
    e.preventDefault();
    onSubmit(Object.fromEntries(new FormData(e.currentTarget)));
  };
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit}>
        {type === "room" && (
          <>
            <div className="form-grid">
              <Input
                label="Numero"
                name="numero"
                defaultValue={item?.numero}
                required
              />
              <Select
                label="Type"
                name="type"
                defaultValue={item?.type || "Chambre double"}
                options={[
                  "Chambre double",
                  "Chambre superieure",
                  "Suite familiale",
                  "Suite terrasse",
                ].map((x) => [x, x])}
              />
              <Input
                label="Capacite"
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
          </>
        )}
        {type === "service" && (
          <>
            <Input
              label="Nom du service"
              name="nom"
              defaultValue={item?.nom}
              required
            />
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
              label="Etat"
              name="actif"
              defaultValue={String(item?.actif ?? true)}
              options={[
                ["true", "Actif"],
                ["false", "Inactif"],
              ]}
            />
          </>
        )}
        {type === "receptionniste" && (
          <>
            <div className="form-grid">
              <Input label="Prenom" name="prenom" required />
              <Input label="Nom" name="nom" required />
            </div>
            <Select
              label="Genre"
              name="genre"
              options={[
                ["femme", "Femme"],
                ["homme", "Homme"],
              ]}
            />
            <Input label="Adresse e-mail" name="email" type="email" maxLength="255" required />
          </>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 9,
            marginTop: 18,
          }}
        >
          <Button onClick={onClose} type="button">
            Annuler
          </Button>
          <FormButton>Enregistrer</FormButton>
        </div>
      </form>
    </Modal>
  );
}

const routePaths = [
  "/",
  "/chambres",
  "/chambres/:id",
  "/services",
  "/a-propos",
  "/contact",
  "/inscription",
  "/connexion",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/reset-password",
  "/client/dashboard",
  "/client/reservations",
  "/client/reservations/:id",
  "/client/factures",
  "/client/factures/:id",
  "/client/profil",
  "/reception/dashboard",
  "/reception/chambres",
  "/reception/reservations",
  "/reception/reservations/:id",
  "/reception/services",
  "/reception/factures",
  "/reception/paiements",
  "/reception/check-in-out",
  "/admin/dashboard",
  "/admin/utilisateurs",
  "/admin/configuration",
  "/admin/statistiques",
];
function AccessDenied() {
  const [, setPath] = useLocation();
  return (
    <>
      <PublicNav />
      <section
        className="section"
        style={{ textAlign: "center", minHeight: 500, paddingTop: 100 }}
      >
        <ShieldCheck size={42} color="#C5A059" />
        <h1 className="page-title">Accès réservé</h1>
        <p className="muted">Connectez-vous pour consulter cet espace.</p>
        <Button kind="primary" onClick={() => setPath("/connexion")}>
          Connexion
        </Button>
      </section>
      <Footer />
    </>
  );
}
function RoutePage() {
  const [path, setPath] = useLocation();
  const params = useParams();
  useEffect(() => {
    if (path === "/connexion" || path === "/inscription") {
      const role = isAuthenticated()
        ? String(getStoredUser()?.role || "").toUpperCase()
        : "";
      if (roleBase[role]) setPath(roleBase[role]);
    }
  }, [path, setPath]);
  if (path === "/") return <HomePage />;
  if (path === "/chambres") return <RoomsPage />;
  if (path.startsWith("/chambres/"))
    return <RoomDetail id={params.id || path.split("/").pop()} />;
  if (["/services", "/a-propos", "/contact"].includes(path))
    return (
      <PublicSimple
        type={
          {
            "/services": "services",
            "/a-propos": "about",
            "/contact": "contact",
          }[path]
        }
      />
    );
  if (
    [
      "/connexion",
      "/inscription",
      "/mot-de-passe-oublie",
      "/reinitialiser-mot-de-passe",
      "/reset-password",
    ].includes(path)
  )
    return (
      <AuthPage
        mode={
          {
            "/connexion": "login",
            "/inscription": "register",
            "/mot-de-passe-oublie": "forgot",
            "/reinitialiser-mot-de-passe": "reset",
            "/reset-password": "reset",
          }[path]
        }
      />
    );
  const group = path.split("/")[1];
  if (["client", "reception", "admin"].includes(group)) {
    const role =
      group === "client"
        ? "CLIENT"
        : group === "reception"
          ? "RECEPTIONNISTE"
          : "ADMIN";
    const session = isAuthenticated() ? getStoredUser() : null;
    if (!session || String(session.role).toUpperCase() !== role) {
      return <AccessDenied />;
    }
    const supported =
      role === "CLIENT"
        ? [
            "/client/dashboard",
            "/client/reservations",
            "/client/factures",
            "/client/profil",
          ].includes(path) ||
          path.startsWith("/client/reservations/") ||
          path.startsWith("/client/factures/")
        : role === "RECEPTIONNISTE"
          ? [
              "/reception/dashboard",
              "/reception/chambres",
              "/reception/reservations",
              "/reception/services",
              "/reception/factures",
              "/reception/paiements",
              "/reception/check-in-out",
            ].includes(path) ||
            path.startsWith("/reception/reservations/") ||
            path.startsWith("/reception/factures/")
          : [
              "/admin/dashboard",
              "/admin/utilisateurs",
              "/admin/configuration",
              "/admin/statistiques",
            ].includes(path);
    if (!supported)
      return (
        <EmptyPage text="Cette page n’est pas disponible dans l’API du backend." />
      );
    return (
      <Shell role={role}>
        <DataPage
          role={role}
          path={path}
          id={params.id || path.split("/").pop()}
        />
      </Shell>
    );
  }
  return <EmptyPage text="Page introuvable." />;
}
function NotFoundPage() {
  return (
    <>
      <PublicNav />
      <EmptyPage text="La page demandée est introuvable." />
      <Footer />
    </>
  );
}
function PageTitle() {
  const { data: auberge } = useAuberge();
  useEffect(() => {
    const name = auberge?.nom || "Azuveria Médina";
    const city = auberge?.ville ? ` à ${auberge.ville}` : "";
    document.title = `${name} — Maison d’hôtes${city}`;
  }, [auberge?.nom, auberge?.ville]);
  return null;
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PageTitle />
      <Switch>
        {routePaths.map((p) => (
          <Route key={p} path={p} component={RoutePage} />
        ))}
        <Route component={NotFoundPage} />
      </Switch>
      <ToastHost />
    </QueryClientProvider>
  );
}
export default App;
