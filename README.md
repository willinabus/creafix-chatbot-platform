# CreaFix Chatbot Platform

Plateforme de chatbots IA avec prise de rendez-vous automatique, intégration Google Calendar et tableau de bord admin.

## Stack technique

- **Framework** : Next.js 16 + TypeScript
- **Base de données** : PostgreSQL (Prisma ORM)
- **IA** : OpenAI GPT-4o-mini avec tool calling
- **Hébergement** : Vercel
- **Calendrier** : Google Calendar API (OAuth 2.0)

## Fonctionnalités

- Chatbot widget embarquable sur n'importe quel site
- Prise de rendez-vous automatisée avec tool calling
- Vérification des disponibilités en temps réel (Google Calendar)
- Tableau de bord de configuration (branding, contenu, style)
- Suivi de consommation IA (quota mensuel)
- Duplication de chatbots pour nouveaux clients

## Déploiement sur Vercel

### Étape 1 : Créer une base de données PostgreSQL

1. Dans le dashboard Vercel de ton projet → **Storage** → **Create Database**
2. Choisis **Vercel Postgres** (gratuit)
3. Une fois créée, copie la **Connection String** (format `postgres://...`)

### Étape 2 : Configurer les variables d'environnement

Dans le dashboard Vercel → **Settings** → **Environment Variables**, ajoute :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection String PostgreSQL |
| `OPENAI_API_KEY` | Ta clé API OpenAI (commence par `sk-...`) |
| `GOOGLE_CLIENT_ID` | Client ID de ton app Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret de ton app Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://TON-PROJET.vercel.app/api/auth/google-calendar/callback` |
| `NEXT_PUBLIC_APP_URL` | L'URL de ton projet Vercel (ex: `https://mon-projet.vercel.app`) |

**⚠️ Important** : Remplace `TON-PROJET` par le vrai nom de domaine Vercel.

### Étape 3 : Déployer

Vercel déploie automatiquement à chaque push sur `main`.

### Étape 4 : Migrer la base de données

Dans le terminal Vercel (ou en local avec la base connectée) :

```bash
npx prisma migrate deploy
```

### Étape 5 : Configurer Google Calendar (optionnel pour démo)

1. Va sur [Google Cloud Console](https://console.cloud.google.com/)
2. Crée un projet → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Autorise l'URL de callback : `https://TON-PROJET.vercel.app/api/auth/google-calendar/callback`
4. Copie le Client ID et Client Secret dans les variables Vercel

## Utilisation du chatbot embed

Intègre le chatbot sur n'importe quel site avec ce script :

```html
<script src="https://TON-PROJET.vercel.app/embed.js?botId=clarissa-v1"></script>
```

## Développement local

```bash
npm install
npm run dev
```

Crée un fichier `.env.local` à la racine (voir `env.example` pour le format).

## Structure du projet

```
├── prisma/               # Schéma de base de données (Prisma)
├── public/               # Fichiers statiques (embed.js)
├── src/
│   ├── app/             # Routes API et pages Next.js
│   │   ├── api/         # API routes (chat, config, auth, etc.)
│   │   └── widget-preview/  # Widget embarquable
│   ├── features/
│   │   ├── chatbot/     # Logique du chatbot (engine, hooks, UI)
│   │   └── dashboard/   # Composants du tableau de bord
│   ├── lib/             # Utilitaires (OpenAI, Prisma, usage)
│   └── config/          # Configuration globale
```

## Licence

Propriétaire — CreaFix
