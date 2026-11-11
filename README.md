# Azuveria Médina

Application de gestion et de réservation pour une maison d’hôtes à Agadir.
Le dépôt réunit une interface React/Vite et une API Laravel protégée par
Laravel Sanctum.

## Sommaire

- [Aperçu](#aperçu)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation et lancement](#installation-et-lancement)
- [Fonctionnalités](#fonctionnalités)
- [API et accès](#api-et-accès)
- [Tests et vérifications](#tests-et-vérifications)
- [Structure du dépôt](#structure-du-dépôt)

## Aperçu

| Partie | Technologie | Répertoire |
| --- | --- | --- |
| Site public et espaces de gestion | React 18, Vite, TanStack Query | `azurea_front/` |
| API, authentification et règles métier | Laravel 13, PHP 8.3+, Sanctum | `azurea_back/` |
| Base de données | MySQL en développement courant; SQLite est également configuré pour les tests | `azurea_back/` |

L’interface lit les informations de l’auberge, les chambres et les services
depuis l’API. Les réservations, factures, paiements et comptes sont gérés par
Laravel et la base de données. Le navigateur n’utilise pas de jeu de données
de démonstration pour ces opérations.

## Architecture

```text
Navigateur
   │
   ├── React / Vite (azurea_front)
   │      └── client HTTP + TanStack Query
   │
   └── API Laravel (azurea_back, préfixe /api)
          ├── Sanctum et autorisations par rôle
          ├── services métier
          └── base de données
```

Le client web envoie les requêtes à l’adresse configurée avec
`VITE_API_URL`. Après connexion, il transmet le jeton Sanctum dans l’en-tête
`Authorization`. Les réponses Laravel sont normalisées par le frontend avant
d’être présentées à l’écran.

## Prérequis

- PHP **8.3 ou ultérieur**, Composer et les extensions PHP requises par Laravel.
- Node.js et npm.
- Un serveur de base de données configuré dans Laravel (MySQL recommandé pour
  le développement courant; SQLite est utilisé par la configuration des tests).

## Installation et lancement

Les deux applications se lancent dans des terminaux séparés, depuis la racine
du dépôt.

### 1. Configurer l’API Laravel

```powershell
Set-Location .\azurea_back
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Configurez ensuite `azurea_back/.env` avec les paramètres de votre base de
données (`DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`
et `DB_PASSWORD`). Vérifiez également les paramètres de messagerie si votre
environnement doit réellement envoyer des courriels.

Créez les tables puis démarrez l’API :

```powershell
php artisan migrate
php artisan serve --host 127.0.0.1 --port 8000
```

L’API est alors disponible à `http://127.0.0.1:8000/api`.

> **Données initiales :** les migrations créent la structure de la base, mais
> ne créent pas de fiche auberge, de chambres ou de services. Avant d’utiliser
> le site, renseignez ces données dans la base. Le seeder Laravel fourni crée
> uniquement un utilisateur d’exemple et ne constitue pas un compte
> administrateur prêt à l’emploi.

### 2. Configurer et démarrer le frontend

Dans un autre terminal :

```powershell
Set-Location .\azurea_front
npm ci
```

Créez `azurea_front/.env` (ou adaptez le fichier local existant) et indiquez
l’URL de l’API :

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api
```

Démarrez le site :

```powershell
npm run dev
```

Vite affiche l’adresse locale du site (généralement
`http://localhost:5173`). Pour un autre port ou un autre nom d’hôte, adaptez
`VITE_API_URL` et autorisez l’origine du frontend dans la configuration
serveur appropriée.

### Build de production

```powershell
Set-Location .\azurea_front
npm run build
```

Les fichiers compilés sont écrits dans `azurea_front/dist/public/`. Ils doivent
être servis par un hébergement statique ou par le serveur web choisi pour le
déploiement.

## Fonctionnalités

### Site public

- Présentation de l’auberge et de ses coordonnées.
- Consultation et filtrage des chambres et des services.
- Recherche de disponibilités et demande de réservation.
- Inscription, connexion et récupération du mot de passe.

### Espace client

- Consultation des réservations et des factures personnelles.
- Mise à jour du profil et du mot de passe.
- Accès au parcours de réservation après connexion.

### Réception

- Gestion des chambres, de leur état et des services.
- Consultation des réservations et des factures.
- Enregistrement des paiements en espèces et gestion des arrivées/départs.

### Administration

- Consultation des utilisateurs, réservations et factures.
- Modification des informations de l’auberge.
- Consultation des indicateurs, calculés dans le frontend à partir des données
  renvoyées par l’API.

Les opérations disponibles dépendent des routes et du rôle autorisé par le
backend. Le paiement partiel et le paiement en ligne ne sont pas pris en charge
par le parcours actuel.

## API et accès

Toutes les routes sont préfixées par `/api`.

| Usage | Routes principales |
| --- | --- |
| Informations publiques | `GET /auberge`, `GET /chambres`, `GET /services` |
| Disponibilité | `GET /availablechambres` |
| Authentification | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` |
| Espace client | `/me`, `/me/reservations`, `/me/factures` |
| Réservation | `POST /chambres/{chambre}/reservation` |
| Réception | Réservations, factures, chambres, services et séjours |
| Administration | Utilisateurs, réservations, factures et configuration de l’auberge |

Les routes protégées exigent un jeton Sanctum. Les routes de réception et
d’administration appliquent également un contrôle de rôle. Les listes paginées
sont parcourues par le frontend afin de charger les résultats nécessaires.

Pour une réservation, la disponibilité utilise les paramètres
`date_debut`, `date_fin`, `nombre_adultes` et `nombre_enfants`. Le backend
applique ses propres validations et règles métier; une disponibilité affichée
ne remplace pas la validation lors de l’envoi de la réservation.

## Tests et vérifications

Depuis la racine du dépôt :

```powershell
Push-Location .\azurea_front
npm run build
Pop-Location

Push-Location .\azurea_back
php artisan test
Pop-Location
```

Le frontend expose aussi `npm run typecheck`, qui exécute actuellement le build
Vite. Le build peut afficher un avertissement non bloquant si le bundle
JavaScript dépasse la taille recommandée par Vite.

## Structure du dépôt

```text
.
├── README.md
├── azurea_front/
│   ├── public/                 # Images et ressources statiques
│   └── src/
│       ├── hooks/              # Requêtes et mutations React Query
│       ├── lib/                # Normalisation et logique partagée
│       └── services/           # Client HTTP et services d’authentification
└── azurea_back/
    ├── app/                    # Contrôleurs, modèles et services métier
    ├── database/               # Migrations, factories et seeders
    ├── routes/api.php          # Routes HTTP de l’API
    └── tests/                  # Tests PHPUnit
```

## Configuration et sécurité

- Ne versionnez jamais les fichiers `.env`, les jetons ou les mots de passe.
- Gardez `VITE_API_URL` sans identifiants : cette valeur est intégrée au bundle
  frontend.
- En production, configurez l’URL HTTPS de l’API, les paramètres de base de
  données, le transport des courriels et les origines web autorisées.
- Créez les comptes d’administration de manière sécurisée; aucun mot de passe
  administrateur par défaut n’est fourni dans ce dépôt.
