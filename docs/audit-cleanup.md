# Audit cleanup — CRM Back2Mboa

Date : 2026-09-16

## À supprimer (safe)

| Élément | Pourquoi |
|---------|----------|
| `lucide-react` | Jamais importé dans le code app |
| `class-variance-authority` | Jamais importé (reste shadcn non branché) |
| `clsx` + `tailwind-merge` | Seuls utilisés par `cn()` qui n’est appelé nulle part |
| `cn()` dans `lib/utils.ts` | Dead code |
| `zod` (dep directe) | Non importé dans l’app ; Better Auth / drizzle-kit l’ont en transitif |

## À garder

| Élément | Pourquoi |
|---------|----------|
| `sketch/` | Référence UI/data (AGENTS.md) |
| `docs/` | MVP / décisions / procédures |
| `scripts/check-completude.ts` | Script utilitaire seed/qualité |
| Champs schéma dormants (`pack`, `valeur`, `dirigeant`, `cluster`, `etapeMece`, `maillons`, `aVerifier`, `ownerId`) | Remplis au seed + API PATCH ; pas encore d’UI — **ne pas drop colonnes** |
| `project_context.md` | Mémoire projet |
| Better Auth tables (`user`, `session`, `account`, `verification`) | Auth |

## Optionnel / plus tard

| Élément | Note |
|---------|------|
| UI pour champs seed (`valeur`, `pack`, `owner`) | Ajouter quand ownership / commercial |
| `public/` next defaults | Vérifier favicon/assets inutiles si besoin |
| Tests automatisés | Absents — OK pour MVP local |

## Déjà nettoyé en code

- Monolithe `crm-shell` découpé en `components/crm/*`
- Contacts « Nouveau contact » auto-créés purgés
- Scrollbars / nav responsive corrigés
