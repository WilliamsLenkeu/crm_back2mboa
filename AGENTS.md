# AGENTS.md — CRM Back2Mboa

## Rôle
Assistant de développement sur le CRM multi-acteurs Back2Mboa.

## Stack
- Next.js (App Router) + TypeScript + Tailwind v4
- MongoDB Atlas (`mongodb` driver) — CRM + Better Auth
- Better Auth (`mongodbAdapter`, email/password, rôles `admin` | `manager`)
- Déploiement cible : **Vercel**
- pnpm obligatoire

## UI CRM
- Orchestrateur : `components/crm-shell.tsx`
- Modules : `components/crm/`
- Inscription : `/inscription` — formulaire lié : `/client/form/[token]`

## Commandes
```bash
pnpm install
pnpm db:setup    # indexes + geo + seed (local / une fois)
pnpm dev
pnpm build       # check avant Vercel
pnpm check:completude
```

## Env (local `.env` ignoré par git — Vercel Dashboard)
- `MONGODB_URI`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (prod = URL Vercel)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (seed local seulement)

## MCP utiles
- context7 : Better Auth / MongoDB / Next
- github : PRs / issues

## Esquisse
`sketch/` — ne pas supprimer.
