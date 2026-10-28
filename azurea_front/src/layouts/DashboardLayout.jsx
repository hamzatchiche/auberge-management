import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BedDouble,
  CalendarDays,
  Users,
  Receipt,
  CreditCard,
  ClipboardList,
  Settings,
  ChartNoAxesCombined,
  Home,
  UserRound,
  LogOut,
  Menu,
  ChevronRight,
  Sparkles,
  DoorOpen,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui';
import { roleBase, roleNames } from '../utils/format';

const navigation = {
  CLIENT: [
    ['Vue d’ensemble', '/client/dashboard', Home],
    ['Mes réservations', '/client/reservations', CalendarDays],
    ['Mes factures', '/client/factures', Receipt],
    ['Mon profil', '/client/profil', UserRound],
  ],
  RECEPTIONNISTE: [
    ['Vue d’ensemble', '/reception/dashboard', Home],
    ['Chambres', '/reception/chambres', BedDouble],
    ['Réservations', '/reception/reservations', CalendarDays],
    ['Clients', '/reception/clients', Users],
    ['Services', '/reception/services', Sparkles],
    ['Factures', '/reception/factures', Receipt],
    ['Paiements espèces', '/reception/paiements', CreditCard],
    ['Arrivées & départs', '/reception/check-in-out', DoorOpen],
  ],
  ADMIN: [
    ['Vue d’ensemble', '/admin/dashboard', Home],
    ['Utilisateurs', '/admin/utilisateurs', Users],
    ['Rôles & accès', '/admin/roles', ShieldCheck],
    ['Configuration', '/admin/configuration', Settings],
    ['Statistiques', '/admin/statistiques', ChartNoAxesCombined],
    ['Rapports', '/admin/rapports', ClipboardList],
  ],
};

export function DashboardLayout({ role, children }) {
  const [path, setPath] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const session = JSON.parse(localStorage.getItem('auberge-session') || 'null');

  const logout = () => {
    localStorage.removeItem('auberge-session');
    setPath('/connexion');
  };

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="side-brand">
          <Link className="brand" href={roleBase[role]}>
            <span className="brand-mark">D</span>
            <span>DAR SÉLÉNÉ</span>
          </Link>
          <div style={{ fontSize: 11, color: '#bfc8d4', margin: '10px 0 0 49px' }}>
            {roleNames[role]}
          </div>
        </div>
        <div className="side-label">Espace de travail</div>
        {navigation[role].map(([label, href, Icon]) => (
          <Link
            onClick={() => setMenuOpen(false)}
            key={href}
            href={href}
            className={`side-link ${path === href ? 'active' : ''}`}
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
            style={{ width: '100%', border: 0, background: 'none' }}
            onClick={logout}
            type="button"
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <Button
            kind="small mobile-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={17} />
          </Button>
          <div className="breadcrumb">
            Auberge Dar Séléné <ChevronRight size={13} /> {roleNames[role]}
          </div>
          <div className="topbar-right">
            <span className="user-label">
              {session?.prenom || 'Équipe'} {session?.nom || ''}
            </span>
            <span className="avatar">{(session?.prenom || 'D')[0]}</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
