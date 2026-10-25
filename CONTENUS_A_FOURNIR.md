# CONTENUS À FOURNIR — Elisa'glam&Co

Ce fichier liste tout ce que la propriétaire doit fournir avant la mise en ligne.

## État actuel : site de démonstration

Le site est livré rempli de **contenus fictifs**, signalés comme tels sur le site (pastille « Démo », bandeau en pied de page, avis « de démonstration ») :

- 16 produits, prix, stocks, descriptions, matières : **inventés**.
- Histoire de la marque, fondatrice « Elisa », savoir-faire, conditions de livraison, d'échange, CGV, mentions légales : **textes fictifs**.
- Coordonnées, numéro WhatsApp, adresse, liens sociaux, NINEA : **fictifs**.
- 6 avis clients (marqués « Avis de démonstration »), 4 commandes, 1 code promo `BIENVENUE10` : **fictifs**.
- Photos : **photos libres de droits d'Unsplash**, uniquement illustratives (voir la page `/credits-photos`). Elles ne représentent pas les produits de la marque.

Pour passer en réel : décocher « Mode démonstration » (Admin → Réglages du site → Avancé), puis remplacer tout ce qui suit. Aucun contenu réel de la marque n'a été inventé en dehors de cette démonstration.
La plupart des contenus se modifient directement dans l'administration (`/admin`), sans toucher au code.

Légende : 🔴 bloquant pour la mise en ligne · 🟡 souhaitable

## 1. Identité de la marque

| | Élément | Où le renseigner |
|---|---|---|
| 🔴 | **Logo officiel** (SVG ou PNG haute définition, version couleur et version claire pour fond noir). Le site affiche pour l'instant un logotype texte provisoire. | Dossier `brand/` puis remplacer `src/components/Logo.tsx` |
| 🔴 | **Palette définitive** : confirmer ou ajuster les couleurs de départ de `DESIGN.md` d'après le logo. | `src/app/(frontend)/globals.css` |
| 🟡 | Slogan définitif (le slogan actuel « L'élégance du cuir, faite au Sénégal » est provisoire). | Admin → Page d'accueil |
| 🔴 | Photo d'ouverture de la page d'accueil (plein écran, lumineuse, paysage et portrait si possible). | Admin → Page d'accueil |
| 🟡 | Image de partage par défaut (réseaux sociaux, WhatsApp). | Admin → Réglages du site → Mesure et référencement |

## 2. Coordonnées et réseaux (Admin → Réglages du site)

- 🔴 Numéro **WhatsApp Business** (le numéro actuel `+221 77 000 00 00` est factice : le lien WhatsApp ne mène à personne).
- 🔴 Téléphone, email de contact, adresse de l'atelier, horaires.
- 🔴 Email qui reçoit les notifications de commande.
- 🔴 Liens Instagram, Facebook, TikTok.

## 3. Textes de marque

- 🔴 **Notre histoire** : origines (2016), fondatrice (nom, parcours), vision, ancrage sénégalais. *(Admin → Pages de contenu → notre-histoire)*
- 🔴 **Notre savoir-faire** : matières (types de cuir), étapes de fabrication, finitions. Uniquement des informations vérifiées. *(notre-savoir-faire)*
- 🔴 Résumé de l'histoire pour la page d'accueil. *(Admin → Page d'accueil → Notre histoire)*
- 🟡 Engagements de la page d'accueil : valider ou reformuler les 5 engagements proposés.
- 🔴 **Entretien du cuir** et **matières** : réponses de la FAQ marquées à compléter.

## 4. Livraison et paiement

- 🔴 **Zones de livraison réelles**, frais et délais pour Dakar et les régions. Les valeurs actuelles (2 000 à 5 500 FCFA) sont des **valeurs de démonstration**. *(Admin → Zones de livraison)*
- 🔴 Zones où le **paiement à la livraison** est autorisé.
- 🔴 **Conditions d'échange et de retour** (délai, état de l'article, frais). *(page livraison-et-retours + FAQ)*
- 🟡 Seuil de livraison offerte, s'il y en a un. *(Réglages du site → Paiement et commandes)*
- 🔴 **Compte prestataire de paiement** (PayDunya recommandé, Wave + Orange Money) au nom de la propriétaire : clés API de test puis de production. Voir `docs/MAINTENANCE.md`.
- 🟡 Compte Resend (emails) et domaine d'envoi.

## 5. Catalogue (Admin → Produits)

Les 16 produits actuels sont des **fiches de démonstration** (cochées « Fiche de démonstration ») : à supprimer ou à remplacer.

Pour chaque modèle :
- 🔴 Nom, référence, collection (femme, homme, orthopédique, accessoire).
- 🔴 **Prix en FCFA** (et prix promotionnel avec dates, le cas échéant).
- 🔴 **Photos** : face, dessus, profil, semelle, gros plans (coutures, boucles, grain du cuir), photo portée. Fond clair uniforme, lumière naturelle, couleurs fidèles. 4 à 6 photos par modèle, 1 600 px de large minimum.
- 🔴 Description (style, matières, confort, occasions), matières, entretien.
- 🔴 **Couleurs réellement disponibles**, **pointures** et **stock** par couleur.
- 🟡 Modèles sur commande : délai de fabrication.
- 🟡 Photos de chaque collection (pour les vignettes de l'accueil). *(Admin → Collections)*

## 6. Guide des pointures

- 🔴 Valider le tableau avec l'atelier : les longueurs de pied sont calculées avec la formule standard et les colonnes **UK / US** sont vides. *(Admin → Guide des pointures)*

## 7. Pages légales (🔴 obligatoires, à faire valider par un juriste)

- **Mentions légales** : dénomination, forme juridique, adresse du siège, NINEA / RCCM, représentant légal, hébergeur.
- **Conditions générales de vente.**
- **Politique de confidentialité** : durée de conservation, droits des personnes, références à la loi sénégalaise sur les données personnelles et à la CDP.
- Politique de cookies : texte fourni, à valider.

## 8. Avis clients

- 🟡 Aucun avis n'est affiché tant qu'aucun avis réel n'a été publié. Les premiers avis se saisissent et se modèrent dans Admin → Avis clients (ne jamais publier de faux avis).

## 9. Mesure et publicité (Admin → Réglages du site → Mesure et référencement)

- 🔴 Identifiant **Google Analytics 4** (`G-…`).
- 🔴 Identifiant **Meta Pixel**.
- 🔴 Code de vérification **Google Search Console**.
- 🟡 Compte Meta Business pour le catalogue (flux : `/feeds/meta-catalog.xml`).

## 10. Propriété et accès (🔴)

- Nom de domaine acheté et contrôlé par la propriétaire.
- Compte d'hébergement, base de données et stockage d'images au nom de la propriétaire.
- Remise de tous les accès (voir `docs/MAINTENANCE.md`).
