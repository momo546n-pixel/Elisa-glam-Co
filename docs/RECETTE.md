# Recette : critères de `SPEC.md` section 8

État au 22 octobre 2026, sur le site de démonstration. ✅ vérifié · ⚠️ vérifié en partie ou en simulation · ⏳ à faire avec la propriétaire.

## Critères de recette

| # | Critère | Statut | Preuve et reste à faire |
|---|---|---|---|
| 1 | Toutes les pages V1 accessibles et fonctionnelles | ✅ | Accueil, boutique, collections (4), fiches produit (16), panier, commande, confirmation, suivi, avis, histoire, savoir-faire, guide des pointures, livraison et retours, FAQ, contact, 4 pages légales, crédits photos. Plan du site et robots.txt générés. |
| 2 | Parcours testé sur plusieurs tailles d'écran : pointure, panier, commande | ✅ | Tests Playwright sur 375 px (mobile) et 1280 px (ordinateur), sans défilement horizontal. |
| 3 | Commande test complète de bout en bout : paiement en mode test et paiement à la livraison | ⚠️ | Paiement à la livraison et paiement en ligne **simulé** : validés. Le paiement réel Wave / Orange Money en bac à sable PayDunya reste ⏳ : il faut un compte PayDunya (voir `docs/MAINTENANCE.md`, section 4). |
| 4 | Notifications client et administratrice reçues | ⚠️ | Les emails sont préparés et déclenchés (nouvelle commande, changement de statut) mais seulement écrits dans les journaux sans clé Resend. ⏳ Renseigner `RESEND_API_KEY` et le domaine d'envoi. |
| 5 | La propriétaire ajoute un produit, change un prix et consulte une commande sans aide | ⏳ | Guide fourni (`docs/GUIDE_ADMIN.md`, avec captures). À valider lors de la séance de formation. |
| 6 | Accès remis et documentation fournie | ⚠️ | Documentation fournie. ⏳ Remise des accès (domaine, hébergeur, base, stockage, comptes tiers). |
| 7 | Tests automatisés (Playwright) sur le tunnel d'achat | ✅ | 18 tests passent (9 par format d'écran), sur SQLite et sur PostgreSQL : pointure obligatoire, panier, commande en ligne simulée, paiement à la livraison, zones, validation du téléphone, suivi, avis après livraison et modération, absence de traceur avant consentement. |

## Autres exigences du cahier des charges

| Exigence | Statut | Remarque |
|---|---|---|
| Mobile first, responsive | ✅ | Conçu à 375 px d'abord, vérifié à 375 et 1280 px. |
| Lighthouse mobile ≥ 90 | ⏳ | **Non mesuré** : Lighthouse n'a pas pu démarrer dans cet environnement. À lancer sur le site déployé. Mesures locales en production : premier affichage vers 0,2 s, environ 500 Ko de JavaScript, 120 Ko de polices. |
| Images optimisées, polices auto-hébergées, scripts tiers après consentement | ✅ | WebP et AVIF via `next/image`, polices `next/font`, GA4 et Meta Pixel chargés seulement après accord. |
| Paiement via agrégateur sénégalais derrière une abstraction | ⚠️ | PayDunya implémenté d'après sa documentation, non testé avec de vraies clés. |
| Meta Pixel : événements ViewContent, AddToCart, InitiateCheckout, Purchase (paiement confirmé seulement) | ✅ | Implémentés. Non testés avec un vrai identifiant de pixel. |
| Flux catalogue Meta | ✅ | `/feeds/meta-catalog.xml` (exclut les fiches de démonstration). |
| Authentification à deux facteurs pour l'admin | ⏳ | Non fournie par Payload en standard : voir `docs/MAINTENANCE.md`, section 6. |
| Sauvegardes quotidiennes et restauration documentée | ⚠️ | Procédure documentée (`docs/SAUVEGARDE.md`). À activer chez le fournisseur de base de données. |
| Limitation de débit fiable en serverless | ⏳ | Limiteur en mémoire : à remplacer par un stockage partagé si déploiement serverless. |
| Phase 2 (anglais, international, espace client, fidélité) | — | Non développée, architecture prête : champs `currency`, `locale`, zone de livraison. |

## Avant la mise en ligne

1. Décocher « Mode démonstration » dans Réglages du site, puis supprimer les fiches, avis et commandes fictifs.
2. Remplacer les textes, photos, coordonnées et pages légales (voir `CONTENUS_A_FOURNIR.md`).
3. Brancher PayDunya (test puis production) et Resend.
4. Déployer, lancer Lighthouse, activer les sauvegardes.
