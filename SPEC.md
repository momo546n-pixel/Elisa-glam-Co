# SPEC.md — Spécifications fonctionnelles Elisa'glam&Co

Légende : 🔴 Indispensable · 🟡 Souhaitable · 🔵 Phase 2 (anticiper seulement)

---

## 1. Pages et structure

### Accueil 🔴
- Grande image (ou vidéo légère) d'ouverture plein écran + slogan + bouton **« Découvrir la collection »**
- Sélection de produits, Nouveautés, Meilleures ventes
- Bloc « Notre histoire » (résumé + lien)
- Bloc engagements (artisanat, cuir, Made in Senegal, livraison, échange)
- Avis clients (authentiques uniquement)
- Toutes les sections éditables depuis l'admin (textes, images, ordre, produits mis en avant)

### Boutique 🔴
Catalogue complet, grille de produits épurée (photo, nom, prix, survol = 2e photo).

### Collections 🔴
Sandales homme · Sandales femme · Modèles orthopédiques · Accessoires (catégories gérables depuis l'admin).

### Filtres 🟡
Pointure, couleur, prix, catégorie, disponibilité. Tri : nouveautés, prix croissant/décroissant.

### Pages de contenu 🔴
- **Notre histoire** : marque créée en 2016, fondatrice, vision, ancrage sénégalais, savoir-faire
- **Notre savoir-faire** : matières, fabrication, finitions (informations vérifiées uniquement)
- **Guide des pointures** : tableau de correspondance (EU / UK / US + longueur du pied en cm) et conseils
- **Livraison & retours** : zones, frais, délais, échanges et retours
- **FAQ** : tailles, matières, commandes, paiement, entretien, livraison (accordéon, éditable)
- **Contact** : coordonnées, WhatsApp Business, réseaux sociaux, formulaire (avec anti-spam)
- **Pages légales** : mentions légales, politique de confidentialité, CGV, politique de cookies

### Avis clients 🟡
Collecte après livraison, modération dans l'admin, affichage transparent (date, prénom, produit acheté).

### Journal / conseils 🔵
Entretien du cuir, guides de style, coulisses, actualités.

---

## 2. Fiche produit (élément central)

| Élément | Détail | Priorité |
|---|---|---|
| Galerie | Face, dessus, profil, semelle, zooms finitions, photo portée. Zoom au clic/pincement, swipe sur mobile | 🔴 |
| Identité | Nom du modèle, référence, catégorie | 🔴 |
| Prix | En **FCFA** (format `45 000 FCFA`), prix barré si promotion | 🔴 |
| Description | Style, matières, caractéristiques, confort, occasions | 🔴 |
| Pointure | **Sélection obligatoire** avant ajout au panier ; tailles indisponibles grisées ; lien vers le guide des pointures | 🔴 |
| Couleurs / variantes | Seulement les variantes réellement disponibles, avec pastilles de couleur | 🔴 |
| Disponibilité | En stock / Indisponible / Sur commande (avec délai) — par variante | 🔴 |
| Boutons | « Ajouter au panier » bien visible (sticky sur mobile) + « Acheter maintenant » | 🔴 |
| WhatsApp | Bouton « Une question sur ce modèle ? » → `wa.me` avec message prérempli (nom + taille choisie + lien du produit) | 🔴 |
| Infos complémentaires | Accordéons : matières, entretien, conseils pointure, livraison, échanges | 🔴 |
| Produits complémentaires | Modèles similaires / accessoires | 🟡 |
| Partage | WhatsApp, Facebook, copier le lien ; balises Open Graph soignées | 🟡 |

**Modèle de données produit (minimum)** : nom, slug, référence, catégorie(s), description, matières, entretien, prix, prix promo, dates de promo, photos ordonnées + texte alternatif, variantes (couleur × pointure) avec stock et SKU, statut (en stock / sur commande / indisponible), délai si sur commande, produits liés, champs SEO.

---

## 3. Panier, commande, paiement

| Fonction | Détail | Priorité |
|---|---|---|
| Panier | Tiroir latéral + page panier ; modifier quantité, supprimer ; persistant (localStorage) | 🔴 |
| Récapitulatif | Sous-total, frais de livraison selon zone, code promo, total | 🔴 |
| Checkout simplifié | Nom, téléphone (format sénégalais +221 validé), zone/quartier, adresse/repères, note. Email facultatif | 🔴 |
| Sans compte | Commande invité obligatoire | 🔴 |
| Wave / Orange Money | Via agrégateur sénégalais, avec webhook de confirmation de paiement | 🔴 |
| Carte bancaire | Via le même agrégateur si disponible | 🟡 |
| Paiement à la livraison | Activable par zone de livraison | 🟡 |
| Confirmation | Page de confirmation + notification client + notification administratrice | 🔴 |
| Statuts | Reçue → Confirmée → En préparation → Expédiée → Livrée (+ Annulée) | 🔴 |
| Suivi | Page « Suivre ma commande » (n° de commande + téléphone) | 🔴 |
| Anti-commandes fictives | Confirmation par WhatsApp/appel avant préparation pour le paiement à la livraison ; limitation de débit sur le formulaire | 🟡 |

**Règle stock** : décrémenter le stock à la confirmation du paiement (ou à la confirmation manuelle pour la livraison) ; empêcher l'ajout au panier d'une variante à 0.

---

## 4. Livraison et service client
- **Zones Dakar** 🔴 : configurables (ex. Dakar Plateau, Almadies, Pikine, Rufisque…) avec frais et délais propres, éditables dans l'admin
- **Régions du Sénégal** 🔴 : tarif et délai par région
- **International** 🔵 : structure prête, non activée
- **Notifications** 🔴 : réception de commande + changements de statut (email ; lien WhatsApp prérempli pour l'admin)
- **WhatsApp flottant** 🔴 : bouton discret présent sur tout le site

---

## 5. Administration (back-office)
Interface **en français**, simple, utilisable sur téléphone.

- 🔴 Tableau de bord : commandes du jour, chiffre d'affaires, commandes à traiter, stocks bas
- 🔴 Produits : créer / modifier / dupliquer / supprimer, variantes, stocks
- 🔴 Photos : import multiple, glisser-déposer pour réordonner, remplacement
- 🔴 Prix et promotions (avec dates de début/fin)
- 🔴 Commandes : détail, coordonnées client, statut de paiement, changement de statut (déclenche la notification)
- 🔴 Contenus : textes, bannières, page d'accueil, FAQ, coordonnées, liens réseaux sociaux, zones et frais de livraison
- 🟡 Codes promo (pourcentage ou montant fixe, date limite, nombre d'utilisations)
- 🔴 Rôles : administratrice (tout) / éditeur (catalogue et contenus)
- 🔴 Documentation utilisateur en français : `docs/GUIDE_ADMIN.md` (avec captures)

---

## 6. SEO, publicité, mesure
- 🔴 Titre SEO + méta-description par page/produit, URLs lisibles (`/boutique/sandale-femme-nom-du-modele`), textes alternatifs, `sitemap.xml`, `robots.txt`, données structurées `Product` et `Organization` (JSON-LD)
- 🔴 GA4 + Search Console (vérification prête)
- 🔴 Meta Pixel : `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase` (uniquement quand le paiement est confirmé)
- 🔴 Open Graph / aperçus de liens soignés
- 🟡 Flux catalogue produits compatible Meta (`/feeds/meta-catalog.xml` ou CSV)
- 🔴 Distinguer : visites · paniers · commandes passées · commandes confirmées · achats payés
- 🔴 Bandeau de consentement cookies : aucun traceur avant accord

---

## 7. Performance, sécurité, propriété
- 🔴 Responsive : mobile, tablette, ordinateur
- 🔴 Images optimisées, lazy loading, polices auto-hébergées, scripts tiers chargés après consentement
- 🔴 HTTPS, admin protégée (mots de passe forts, limitation des tentatives, 2FA si possible)
- 🔴 Sauvegardes automatiques quotidiennes de la base + médias, procédure de restauration documentée (`docs/SAUVEGARDE.md`)
- 🔴 Protection des données (loi sénégalaise sur les données personnelles / CDP) : accès restreints, données minimales
- 🔴 Domaine, hébergement, CMS et outils de mesure au nom de la propriétaire
- 🔴 `docs/MAINTENANCE.md` : mises à jour, dépannage, contacts

---

## 8. Critères de recette (définition de « terminé »)
1. Toutes les pages V1 accessibles et fonctionnelles
2. Parcours testé sur plusieurs tailles d'écran : choix de la taille → panier → commande
3. Une commande test complète de bout en bout (paiement en mode test + paiement à la livraison)
4. Notifications client et administratrice reçues
5. La propriétaire ajoute un produit, change un prix et consulte une commande **sans aide**
6. Accès remis + documentation fournie
7. Tests automatisés (Playwright) sur le tunnel d'achat
