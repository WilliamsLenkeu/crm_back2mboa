# Back2Mboa CRM — Design System

> Adapté de [Django-CRM DESIGN_SYSTEM.md](https://github.com/MicroPyramid/Django-CRM/blob/master/DESIGN_SYSTEM.md)  
> Patterns UX : Attio (vues), HubSpot (fiche onglets), Pipedrive (pipeline), Salesforce SLDS (densité données)

## Principes
1. Clarity first — chaque élément sert une action
2. Data-driven — tables et listes lisibles en priorité
3. Grille 8px
4. Accent unique (orange) pour les CTA ; couleurs sémantiques pour statuts pipeline

## Couleurs

| Token | Hex | Usage |
|-------|-----|--------|
| `--color-primary` | `#EA580C` | CTA, liens, focus |
| `--color-primary-hover` | `#C2410C` | Hover CTA |
| `--color-primary-light` | `#FFF7ED` | Surfaces actives |
| `--text-primary` | `#212121` | Titres |
| `--text-secondary` | `#616161` | Meta |
| `--text-tertiary` | `#9E9E9E` | Placeholders |
| `--surface-page` | `#F3F3F3` | Fond app (SLDS-like) |
| `--surface-card` | `#FFFFFF` | Cartes, panneaux |
| `--surface-sidebar` | `#FFFFFF` | Nav |
| `--border-default` | `#E0E0E0` | Bordures |
| `--negative` | `#DC3545` | Destructive |
| `--success` | `#28A745` | Succès |
| `--warning` | `#FFC107` | Attention |

### Pipeline stages
| Étape | Couleur | Fond colonne |
|-------|---------|--------------|
| Nouveau | `#EA580C` | `#FFF7ED` |
| Contacté | `#F97316` | `#FFEDD5` |
| Qualifié | `#3B82F6` | `#EFF6FF` |
| Engagé | `#8B5CF6` | `#F5F3FF` |
| Partenaire | `#22C55E` | `#F0FDF4` |
| Pause | `#6B7280` | `#F3F4F6` |

### Priorités
| Niveau | Couleur |
|--------|---------|
| Haute | `#F97316` / bg `#FFEDD5` |
| Moyenne | `#FBBF24` / bg `#FFFBEB` |
| Basse | `#22C55E` / bg `#F0FDF4` |

## Typo
- UI : Source Sans 3 / system-ui, 14px body, 13px table
- Mono : JetBrains Mono pour scores / IDs
- Titres : weight 600, letter-spacing -0.01em

## Layout CRM
- Sidebar fixe ~220px, fond `--nav-bg` (#FFF7ED), item actif orange plein
- Zone contenu pleine largeur (dashboard `xl` grille 8 KPI + graphes recharts)
- Fiche contact : drawer droit ~480px
- Table contacts : colonnes redimensionnables (prefs compte)
- Routes publiques : `/inscription` (auto-création contact)
- Paramètres CRM : lien formulaire + reset largeurs colonnes

## UX obligatoires
- Vues rapides + filtres étape/prio/pays/secteur
- Recherche globale Ctrl/Cmd+K
- Actions groupées (étape, priorité)
- Journal d’activité sur la fiche
- Récents (localStorage)
- Escape ferme drawer / palette
- Hover orange sur nav / KPI / charts
