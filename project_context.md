# project_context.md

## Produit
CRM interne Back2Mboa pour gérer ~600 acteurs (diaspora, entreprises, CTD, institutions, PTF, médias).

## Design
Basé sur Django-CRM DESIGN_SYSTEM (orange `#EA580C`, stages pipeline, tables 52px) + patterns Attio/HubSpot/Pipedrive. Voir `DESIGN.md`.

## Stack
- Next.js + TypeScript + Tailwind + **MongoDB Atlas** (`mongodb` driver)
- Better Auth (`mongodbAdapter`)
- Compte seed : `admin@back2mboa.local` / `Admin123!` (après `pnpm db:setup`)

## UX livrée
- Sidebar : Dashboard / Contacts / Pipeline + filtre types + récents
- Vues rapides (haute, incomplets, nouveaux, engagés)
- Ctrl/Cmd+K recherche globale
- Sélection multiple + bulk étape/priorité
- Tri colonnes
- Modal fiche (édition / création) Infos / Activité
- Pipeline kanban coloré par étape
- Export CSV/PDF client
- Formulaire public `/inscription` + formulaire lié `/client/form/[token]`

## Env critique
- `MONGODB_URI` — remplacer `<db_password>` dans `.env`
- Network Access Atlas : IP du poste / `0.0.0.0/0` en dev
