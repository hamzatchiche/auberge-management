import { Link } from 'wouter';
import { read } from '../services/mock';

export function PublicNav() {
  return (
    <header className="public-nav">
      <Link href="/" className="brand">
        <span className="brand-mark">D</span>
        <span>DAR SÉLÉNÉ</span>
      </Link>
      <nav className="nav-links">
        <Link href="/">Accueil</Link>
        <Link href="/chambres">Chambres</Link>
        <Link href="/services">Services</Link>
        <Link href="/a-propos">À propos</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className="nav-actions">
        <Link className="btn small" href="/connexion">Connexion</Link>
        <Link className="btn primary small" href="/inscription">Réserver</Link>
      </div>
    </header>
  );
}

export function Footer() {
  const auberge = read().auberge;

  return (
    <footer className="public-footer">
      <div>
        <div className="brand" style={{ color: 'white' }}>
          <span className="brand-mark">D</span>
          DAR SÉLÉNÉ
        </div>
        <p style={{ maxWidth: 320, color: '#cbd2de', lineHeight: 1.7 }}>
          Une maison d’hôtes au cœur de la médina de Marrakech.
        </p>
      </div>
      <div>
        <b>Nous trouver</b>
        <p style={{ color: '#cbd2de' }}>
          {auberge.adresse}
          <br />
          {auberge.ville}
          <br />
          {auberge.telephone}
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
      <small style={{ alignSelf: 'end', color: '#aeb9ca' }}>
        © {new Date().getFullYear()} Dar Séléné · Marrakech
      </small>
    </footer>
  );
}
