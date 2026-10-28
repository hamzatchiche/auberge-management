import { useState } from 'react';
import { useMockData } from '../../hooks/useMockData';
import { entity, saveEntity } from '../../services/mock';
import { Button, FormButton, Input, PageHead } from '../../components/ui';
import { DashboardPage } from '../management/DashboardPages';
import {
  EmptyPage,
  InvoiceDetailPage,
  InvoicesPage,
  ReservationDetailPage,
  ReservationsPage,
} from '../shared/ReservationPages';
import { notify } from '../../components/ManagementData';

export function ClientPage({ path, id }) {
  if (path === '/client/dashboard') return <DashboardPage role="CLIENT" />;
  if (path === '/client/reservations') {
    return <ReservationsPage role="CLIENT" />;
  }
  if (path.startsWith('/client/reservations/')) {
    return <ReservationDetailPage role="CLIENT" id={id} />;
  }
  if (path === '/client/factures') return <InvoicesPage role="CLIENT" />;
  if (path.startsWith('/client/factures/')) {
    return <InvoiceDetailPage role="CLIENT" id={id} />;
  }
  if (path === '/client/profil') return <ClientProfile />;
  return <EmptyPage text="Cette page n’existe pas dans votre espace." />;
}

function ClientProfile() {
  const data = useMockData();
  const [passwordNotice, setPasswordNotice] = useState('');
  const session = JSON.parse(localStorage.getItem('auberge-session') || '{}');

  const updateProfile = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const users = entity('users').map((user) =>
      user.id === session.id
        ? {
            ...user,
            prenom: form.get('prenom'),
            nom: form.get('nom'),
            email: form.get('email'),
            tel: form.get('tel'),
          }
        : user,
    );
    saveEntity('users', users);
    const updatedUser = users.find((user) => user.id === session.id);
    localStorage.setItem('auberge-session', JSON.stringify(updatedUser));
    notify('Profil mis à jour.');
  };

  return (
    <>
      <PageHead
        title="Mon profil"
        subtitle="Gérez les informations de votre compte."
      />
      <div className="panel" style={{ maxWidth: 680 }}>
        <form onSubmit={updateProfile}>
          <div className="form-grid">
            <Input
              label="Prénom"
              name="prenom"
              defaultValue={session.prenom || ''}
              required
            />
            <Input
              label="Nom"
              name="nom"
              defaultValue={session.nom || ''}
              required
            />
            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              defaultValue={session.email || ''}
              required
            />
            <Input
              label="Téléphone"
              name="tel"
              defaultValue={session.tel || ''}
            />
          </div>
          <FormButton>Enregistrer mon profil</FormButton>
        </form>
        <hr
          style={{
            border: 0,
            borderTop: '1px solid var(--line)',
            margin: '28px 0',
          }}
        />
        <h3>Changer le mot de passe</h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPasswordNotice(
              'Cette action sera connectée à l’API Laravel. Aucun mot de passe n’est modifié dans la démo.',
            );
          }}
        >
          <Input label="Mot de passe actuel" type="password" required />
          <Input
            label="Nouveau mot de passe"
            type="password"
            minLength="8"
            required
          />
          <FormButton>Mettre à jour</FormButton>
        </form>
        {passwordNotice && <div className="notice">{passwordNotice}</div>}
      </div>
    </>
  );
}
