# Procédures

## Install local
```bash
pnpm install
# Créer .env local (non versionné) avec MONGODB_URI, BETTER_AUTH_*
pnpm db:setup
pnpm dev
```
Ouvrir http://localhost:3000 — login seed : `admin@back2mboa.local` / `Admin123!`

## Reseed
```bash
pnpm seed
```
Efface `contacts` + `journal_entries`, réimporte l’esquisse, conserve/crée l’admin.

## Déploiement Vercel
1. Repo GitHub connecté à Vercel (framework Next.js, install `pnpm`).
2. Variables d’environnement (Production + Preview) :
   - `MONGODB_URI` — URI Atlas (`…/crm_back2mboa?…`)
   - `BETTER_AUTH_SECRET` — chaîne longue aléatoire
   - `BETTER_AUTH_URL` — URL publique (`https://ton-projet.vercel.app`)
3. Atlas → Network Access : autoriser `0.0.0.0/0` (Vercel IPs dynamiques).
4. Deploy. Ne pas lancer `db:setup` sur Vercel (déjà fait en local / une fois).
5. Après 1er deploy, mettre à jour `BETTER_AUTH_URL` si l’URL Vercel change.

## Checks
```bash
pnpm check:completude
pnpm lint
pnpm build
```

## Structure
- `app/` pages + API
- `db/` schéma, client, seed
- `lib/` auth, acteurs, utils, geo-cache
- `components/crm-shell.tsx` UI principale
- `sketch/` esquisse HTML d’origine
