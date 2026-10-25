# Maintenance, déploiement et accès

## 1. Architecture en bref

| Brique | Choix | Remarque |
|---|---|---|
| Site + administration | Next.js (App Router) + Payload CMS, un seul projet | Admin en français sur `/admin` |
| Base de données | PostgreSQL en production, SQLite en local | Choisie par `DATABASE_URL` |
| Images | Stockage S3 compatible en production, dossier `media/` en local | Variables `S3_*` |
| Paiement | Couche `PaymentProvider` (`src/lib/payments/`) : PayDunya (Wave, Orange Money, carte), simulation locale | Variable `PAYMENT_PROVIDER` |
| Emails | Resend | Variable `RESEND_API_KEY` |
| Mesure | GA4, Meta Pixel, après consentement | Réglages du site |

## 2. Lancer en local

```bash
npm install --legacy-peer-deps
cp .env.example .env        # puis renseigner les valeurs
npm run seed                # données de démonstration (optionnel ; SEED_RESET=1 npm run seed pour tout recréer)
npm run dev                 # http://localhost:3010
```

Créer le compte administratrice : ouvrir `http://localhost:3010/admin` (le premier compte créé est administratrice), ou lancer le seed avec `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD`.

> Windows : si le chemin du dossier contient un `&` (comme `Elisa'glam&Co`), les scripts npm de ce projet appellent `node` directement pour éviter les erreurs du lanceur Windows.

Tests du tunnel d'achat (site lancé, `PAYMENT_PROVIDER=mock`, base alimentée) :

```bash
npm run test:e2e
```

## 3. Mise en production

Hébergement recommandé : un compte **au nom de la propriétaire** chez Vercel (ou un VPS) avec une base PostgreSQL managée et un bucket S3 compatible.

1. Créer la base PostgreSQL et le bucket d'images.
2. Renseigner les variables d'environnement chez l'hébergeur (voir `.env.example`). En production :
   - `PAYLOAD_SECRET` : chaîne aléatoire longue et **unique** ;
   - `NEXT_PUBLIC_SITE_URL` : l'adresse définitive en `https://` ;
   - `PAYMENT_PROVIDER=paydunya` (jamais `mock`) ;
   - **ne pas** définir `DISABLE_RATE_LIMIT`.
3. **Migrations de base de données** : le dossier `src/migrations/` contient la migration initiale PostgreSQL, appliquée **automatiquement au démarrage en production**. Après toute modification du modèle de données (nouveau champ, nouvelle collection), générer une nouvelle migration depuis un poste relié à une base PostgreSQL de test, puis la commiter :
   ```bash
   npm run payload -- migrate:create nom_de_la_migration
   ```
   > Le chemin du dossier ne doit pas contenir d'apostrophe (ex. `Elisa'glam&Co`) pour cette commande : copier le projet dans un dossier sans caractères spéciaux.
4. `npm run build` puis `npm run start` (Vercel le fait automatiquement).
5. Créer le premier compte sur `/admin`, puis renseigner les Réglages du site.
6. Relier le nom de domaine, vérifier le certificat HTTPS.
7. Vérifier `https://votre-domaine/sitemap.xml` et `/robots.txt`, puis déclarer le sitemap dans Google Search Console.

## 4. Activer les paiements Wave et Orange Money (PayDunya)

Documentation à jour : https://developers.paydunya.com/doc/EN/http_json

1. Créer un compte **PayDunya Business** au nom de la propriétaire et le faire activer.
2. Menu « Intégration API » → créer une application. Choisir d'abord le **mode test**.
3. Renseigner `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN`, `PAYDUNYA_MODE=test`, `PAYMENT_PROVIDER=paydunya`.
4. L'adresse de notification (IPN) est envoyée automatiquement à chaque paiement : `https://votre-domaine/webhooks/paydunya`. Elle doit être publique en HTTPS.
5. Faire une **commande test complète** en mode test, vérifier que la commande passe à « Payée ».
6. Passer en production : clés de production, `PAYDUNYA_MODE=live`.

Sécurité du webhook : le hash de la clé maître est vérifié, l'état du paiement est **relu auprès de PayDunya** (jamais cru sur parole) et le montant payé doit être égal au total de la commande.

Pour changer de prestataire : créer un fichier dans `src/lib/payments/` qui implémente `PaymentProvider`, l'ajouter dans `index.ts`, ajouter sa route de webhook. Le tunnel de commande n'a pas à être modifié.

## 5. Emails (Resend)

Créer un compte Resend, vérifier le domaine d'envoi, renseigner `RESEND_API_KEY` et `EMAIL_FROM`. Sans clé, les emails sont seulement écrits dans les journaux du serveur.

## 6. Sécurité

- HTTPS obligatoire, en-têtes de sécurité activés (`next.config.mjs`).
- Administration : mots de passe forts, blocage après 5 échecs (10 minutes), session de 12 h. **L'authentification à deux facteurs n'est pas fournie par Payload en standard** : à ajouter plus tard (plugin ou accès à l'admin derrière un service d'authentification).
- Commandes : prix, stock, frais de livraison et promotions recalculés côté serveur ; limitation de débit sur la commande, le suivi et le contact ; champ piège anti-robots.
- La limitation de débit est **en mémoire** : sur un hébergement serverless (Vercel), la remplacer par un stockage partagé (ex. Upstash Redis) pour qu'elle soit fiable.
- Données personnelles : seules les données nécessaires à la livraison sont collectées ; l'accès est limité à l'administratrice (les éditeurs ne voient pas les commandes).
- Mettre à jour les dépendances régulièrement : `npm audit`, puis `npm update` et relancer les tests.

## 7. Sauvegardes

Voir `docs/SAUVEGARDE.md`.

## 8. Dépannage

| Symptôme | Piste |
|---|---|
| Le site affiche une erreur partout | Vérifier `DATABASE_URL` et que la base est accessible |
| Le paiement en ligne n'apparaît pas | `PAYMENT_PROVIDER` et clés PayDunya ; option « Activer Wave et Orange Money » dans les Réglages |
| Le paiement à la livraison n'apparaît pas | Zone → case « Paiement à la livraison possible » ; Réglages → option activée |
| Commande payée mais restée « En attente » | Vérifier que `/webhooks/paydunya` est joignable ; consulter les journaux ; relire la commande côté PayDunya |
| Pas d'email reçu | `RESEND_API_KEY`, domaine vérifié, dossier spam |
| Images qui ne s'affichent plus | Variables `S3_*`, droits du bucket |
| Trop de « 429 » / tentatives refusées | Limitation de débit ; attendre quelques minutes |

## 9. Qui fait quoi après la mise en ligne (à compléter)

- Mises à jour techniques et correctifs : `[À COMPLÉTER : nom, contact, périodicité]`
- Surveillance des sauvegardes : `[À COMPLÉTER]`
- Contact d'urgence : `[À COMPLÉTER]`

## 10. Accès à remettre à la propriétaire

- [ ] Nom de domaine (registrar)
- [ ] Hébergeur et projet de déploiement
- [ ] Base de données
- [ ] Stockage d'images
- [ ] Administration du site (compte administratrice)
- [ ] PayDunya, Resend
- [ ] Google Analytics 4, Search Console, Meta Business / Pixel
- [ ] Dépôt de code
