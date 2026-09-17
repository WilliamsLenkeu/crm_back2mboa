# Décisions

## 2026-09-16 — Stack initiale
- **Next.js + Drizzle + SQLite + Better Auth + pnpm**
- SQLite pour le travail local ; schéma Drizzle portable vers Postgres plus tard (`DATABASE_URL` + changement de driver)
- Rôles `admin` | `member` ; MVP = tous les contacts visibles, owner éditable
- shadcn non initialisé via CLI

## 2026-09-16 — Refonte CRM (Django-CRM DS)
- Remplacement total du look Dub (bleu/Inter pills)
- Source : MicroPyramid Django-CRM DESIGN_SYSTEM + UX Attio/HubSpot/Pipedrive
- Orange primary, fond page `#F3F3F3`, stages colorés, Source Sans 3
- UX : sidebar, vues rapides, Ctrl+K, bulk, tri, drawer onglets, récents, pipeline kanban

## 2026-09-16 — Cleanup deps + dashboard métriques
- Suppression deps mortes : lucide, cva, clsx, tailwind-merge, zod (direct)
- Dashboard : barres pipeline / acteurs / priorités / top pays + KPIs score, complétude, créés 14j, conversion
- Rapport : `docs/audit-cleanup.md`

## 2026-09-16 — UX v2 (recharts, inscription, settings, colonnes)
- **recharts** pour graphes dashboard (plein largeur)
- Page publique `/inscription` + API `/api/public/inscription`
- Page Paramètres + table `user_settings` (prefs JSON par compte)
- Colonnes table Contacts redimensionnables, persistées via PATCH `/api/settings`
- Nav : fond crème, actif orange plein, hovers primary-light

## 2026-09-16 — Perf nav + champs CRM + inscription + sidebar
- Keep-alive retiré : rendu page courante + anim `crm-page` 120ms
- **bootstrap-icons** (pas Lucide) pour toute la chrome
- Sidebar collapsible (prefs `sidebarCollapsed`) + réglages nav (types/récents, page d’accueil)
- Champs CRM : `ville`, `whatsapp`, `source`, `tags`, `prochaineRelance` (+ site/adresse/région exposés)
- `/inscription` : layout 2 colonnes + wizard 3 étapes

## 2026-09-16 — Contacts pagination + geo API + context menu
- Pagination Contacts (défaut 25, prefs `pageSize`) + poignées ‖ visibles
- Page CRM persistée dans `localStorage` (refresh ne force plus le dashboard)
- Pays/villes via restcountries + countriesnow (fallback `lib/geo.ts`)
- Menu contextuel CRM ; inscription animée avec **framer-motion**

## 2026-09-16 — Geo API + confirm inscription + i18n
- Pays/villes via `/api/geo/*` → countries.dev + cityapi (scroll/recherche, plus de fallback local)
- Inscription : modal résumé avant envoi ; Enter ne soumet plus tout seul
- i18n FR/EN (prefs + sélecteur formulaire) ; suppression contacts (drawer + bulk)

## 2026-09-16 — Persist page + settings SaaS + i18n session + inscription mobile
- Page CRM : `useState(readSavedPage)` synchrone ; `defaultPage` uniquement si aucune clé LS
- Settings : nav latérale sections + panneau plat (pattern SaaS sidebar+content), plus de grille de cards
- `LocaleProvider` enveloppe le shell → chrome / dashboard / contacts / pipeline suivent `prefs.locale` ; `/inscription` a sa propre langue
- Inscription : plus de `<form>` (pas de submit natif) ; validation étape assouplie (pays sans code obligatoire) ; layout mobile-first (sticky header/actions, sheet confirm)

## 2026-09-16 — i18n complet + formulaire lié contact
- Dictionnaire FR/EN étendu (dashboard, contacts, pipeline, drawer, menu)
- Settings : sections Formulaire public / Colonnes retirées
- Chaque contact a un `formToken` opaque → `/client/form/[token]` (prérempli, PATCH public sans exposer l’id)

## 2026-09-16 — Export modal + form UI + hydration
- Export : modal CSV/PDF (preview, colonnes, critères) — CSV généré côté client
- Formulaire public : `CrmSelect`, police +13% (`.pub-form`), un seul sélecteur langue (droite)
- Hydration : page CRM init SSR = dashboard, restore LS après mount
- Colonne contacts : `%` → Complétude

## 2026-09-16 — Formulaire lié `/client/form/[token]`
- Plus de wizard / navbar : panneau blanc (pattern profil SaaS), sections séparées, paires liées en 2 cols
- Avatar initiales + bandeau brand ; FR|EN segmented ; barre sticky « Enregistrer »
- Champs `secteur`, `site`, `linkedin` exposés (déjà dans `PUBLIC_FORM_KEYS`)

## 2026-09-16 — Contact drawer → modal flottant
- Édition + création contact : panneau latéral remplacé par dialog centré `max-w-4xl` (grille 3 cols desktop)
- Même composant `ContactDrawer` pour les deux flux

## 2026-09-16 — Contact en modal flottant
- Drawer latéral → modal centré `max-w-4xl` (édition + création brouillon)
- Grille 3 colonnes desktop ; animation fade/scale au lieu du slide

## 2026-09-16 — Migration MongoDB Atlas
- Remplacement Drizzle/SQLite → driver `mongodb` + Better Auth `mongodbAdapter`
- Collections : `contacts`, `journal_entries`, `user_settings` (+ auth)
- Env : `MONGODB_URI` ; scripts `db:indexes` / `seed` / `db:setup`

## 2026-09-17 — Contacts lazy load
- GET `/api/contacts` paginé (`limit`/`offset`) ; backfill `formToken` retiré du hot path
- Client : 50 premiers affichés tout de suite, puis lots de 100 en arrière-plan (AbortController)

## 2026-09-17 — Comptes admin / manager
- Rôles : `admin` (gestion comptes) | `manager` (CRM sans gestion users)
- Plugin Better Auth `admin` ; signup public désactivé
- Settings → section Comptes (admin) : créer manager (nom, email, password) + liste / suppression
