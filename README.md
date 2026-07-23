# MediSys — patient-service

Microservice de gestion des patients et des antécédents médicaux pour MediSys. Chiffrement AES-256-GCM des données sensibles.

## Stack

- **Runtime** : Node.js
- **Framework** : Express
- **Base de données** : PostgreSQL (via `pg` Pool)
- **Auth** : JWT (via middleware)
- **Chiffrement** : AES-256-GCM (données sensibles)

## Démarrage

```bash
cp .env.example .env
# éditer .env avec vos identifiants
npm install
npm run dev
```

Port par défaut : `5002`

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port du service | 5002 |
| `NODE_ENV` | Environnement | development |
| `DATABASE_URL` | URL de connexion PostgreSQL | — |
| `JWT_SECRET` | Clé JWT (doit correspondre au gateway) | — |
| `ENCRYPTION_KEY` | Clé hex 64 chars pour AES-256-GCM | — |

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Mode développement |
| `npm start` | Production |

## Endpoints API

Toutes les routes nécessitent un header `Authorization: Bearer <token>`.

### Patients

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste des patients (filtres : search, hopital, allHospitals, page, limit) |
| GET | `/:id` | Détail d'un patient |
| POST | `/` | Créer un patient |
| PUT | `/:id` | Modifier un patient |
| DELETE | `/:id` | Supprimer un patient |
| POST | `/check-duplicates` | Vérifier les doublons |
| PUT | `/:id/desactiver` | Désactiver un patient |
| PUT | `/:id/reactiver` | Réactiver un patient |

### Antécédents

| Méthode | Route | Description |
|---|---|---|
| GET | `/:patientId/antecedents` | Liste des antécédents |
| POST | `/:patientId/antecedents` | Créer un antécédent |
| PUT | `/:patientId/antecedents/:id` | Modifier un antécédent |
| DELETE | `/:patientId/antecedents/:id` | Supprimer un antécédent |

## Filtrage par hôpital

- Les endpoints patients et antécédents injectent `hopital` depuis le JWT (`hospitalUser`) pour filtrer les données
- Les admins voient toutes les données sans filtre
- Paramètre `allHospitals=true` pour inclure tous les hôpitaux (utile pour CreateConsultation)
- Les antécédents sont en lecture seule pour les hôpitaux non propriétaires

## Structure

```
src/
├── config/
│   └── db.js              # Pool PostgreSQL + initDB (création automatique des tables)
├── controllers/
│   └── patient.controller.js
├── middlewares/
│   ├── auth.middleware.js
│   └── errorHandler.js
├── routes/
│   └── patient.routes.js
├── services/
│   └── patient.service.js
└── server.js
```

## Base de données

Table `patients` créée automatiquement au premier démarrage avec 20+ colonnes (identité, contact, informations médicales, adresse, etc.).

## Dépôts liés

| Service | Dépôt |
|---|---|
| Frontend | [Dupont-fr/IN3_project-frontend](https://github.com/Dupont-fr/IN3_project-frontend) |
| Gateway | [Dupont-fr/api-getway](https://github.com/Dupont-fr/api-getway) |
| User-service | [Dupont-fr/Hospital](https://github.com/Dupont-fr/Hospital) |
| Consultation-service | [Dupont-fr/consultations-service](https://github.com/Dupont-fr/consultations-service) |
| Statistic-service | [Dupont-fr/Statistique-service](https://github.com/Dupont-fr/Statistique-service) |
