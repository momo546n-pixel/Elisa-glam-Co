# Sauvegarde et restauration

Deux éléments à sauvegarder : **la base de données** (produits, commandes, clients) et **les images** (photos des produits).

## Principe

| Élément | Production recommandée | Fréquence |
|---|---|---|
| Base PostgreSQL | Sauvegardes automatiques quotidiennes du fournisseur de base managée (Neon, Supabase, Scaleway, etc.), avec conservation d'au moins 7 jours | Quotidienne |
| Images | Bucket S3 compatible (Cloudflare R2, Scaleway, AWS S3) avec versionnage activé | Continue |
| Copie hors fournisseur | Export hebdomadaire de la base, stocké ailleurs (disque de la propriétaire, autre cloud) | Hebdomadaire |

**À vérifier avant la mise en ligne** : la sauvegarde automatique est activée sur le compte du fournisseur (qui appartient à la propriétaire) et une restauration test a été réalisée au moins une fois.

## Développement local (SQLite)

```bash
npm run backup
```

Crée un dossier `backups/AAAA-MM-JJ_HHMM/` contenant la copie de `data/elisaglam.db` et du dossier `media/`.

## Export PostgreSQL (production)

```bash
pg_dump "$DATABASE_URL" --format=custom --file=elisaglam_$(date +%F).dump
```

## Restauration

### SQLite (local)
1. Arrêter le site.
2. Remplacer `data/elisaglam.db` par la copie voulue ; remettre le dossier `media/`.
3. Relancer le site.

### PostgreSQL (production)
1. Chez le fournisseur : utiliser la fonction « restaurer à un instant donné » (point-in-time recovery) **ou** créer une nouvelle base à partir de la sauvegarde.
2. À partir d'un export manuel :
   ```bash
   pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" elisaglam_AAAA-MM-JJ.dump
   ```
3. Mettre à jour `DATABASE_URL` si la base a changé, redéployer, puis vérifier : accueil, une fiche produit, une commande dans l'administration.

### Images
Restaurer le bucket (versionnage S3) ou recopier le dossier sauvegardé dans le bucket.

## Test de restauration

Une fois par trimestre : restaurer la dernière sauvegarde dans une base de test et vérifier que les commandes récentes sont présentes.
