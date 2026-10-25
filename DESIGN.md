# DESIGN.md — Direction artistique Elisa'glam&Co

## Intention
**Élégance africaine contemporaine**, sobre et internationale. Le niveau d'exigence visuelle est celui des grandes maisons de maroquinerie : beaucoup d'espace, de grandes photos, peu d'éléments, une typographie raffinée.
**À éviter :** clichés visuels (motifs wax partout, couleurs saturées), accumulation de couleurs, d'animations, de bannières promotionnelles, de pop-ups.

## Palette (design tokens)
| Token | Usage | Valeur de départ (à ajuster selon le logo) |
|---|---|---|
| `--color-ink` | Noir profond : textes, en-tête, boutons principaux | `#141210` |
| `--color-ivory` | Fond principal | `#FAF7F2` |
| `--color-sand` | Fond secondaire, sections alternées | `#E9DFD0` |
| `--color-leather` | Brun cuir : accents, liens, survols | `#7A4E2D` |
| `--color-gold` | Touches dorées très discrètes (filets, icônes, détails) | `#B8955A` |
| `--color-muted` | Textes secondaires | `#6E665D` |

Règle : 80 % ivoire/sable, 15 % noir, 5 % cuir/or. Le doré ne sert jamais de fond large.

## Typographie
- **Titres** : serif élégante (ex. *Cormorant Garamond* ou *Playfair Display*), grandes tailles, interlettrage légèrement ouvert pour les surtitres en capitales.
- **Textes et prix** : sans-serif très lisible (ex. *Inter* ou *Manrope*).
- Polices auto-hébergées, `font-display: swap`.

## Composants clés
- **En-tête** : logo centré ou à gauche, menu minimal, icônes recherche / panier ; transparent sur le hero, puis fond ivoire au défilement.
- **Hero** : photo lifestyle plein écran, slogan en serif, un seul bouton.
- **Carte produit** : photo sur fond clair, ratio 4:5, nom + prix en dessous, 2e photo au survol, aucun badge criard (badge « Nouveau » discret seulement).
- **Boutons** : principal noir plein, texte ivoire, angles légèrement arrondis ou droits ; secondaire bordure fine.
- **Sélecteur de pointure** : grille de cases, tailles indisponibles barrées et grisées.
- **Bouton WhatsApp** : discret, couleurs de la marque (pas le vert vif sur tout le site).
- **Pied de page** : fond noir, textes ivoire, filet doré fin.

## Photos
- Fiches produits : fond clair et uniforme, lumière naturelle, couleurs fidèles.
- Gros plans : coutures, boucles, semelles, grain du cuir.
- Lifestyle : photos portées, mises en scène lumineuses et sobres.
- En attendant les vraies photos : placeholders neutres beiges avec la mention `[PHOTO À FOURNIR]` (pas d'images de stock d'autres marques).

## Animations
Uniquement discrètes et fluides : fondu à l'apparition, léger zoom sur image au survol, transitions de 200 à 400 ms. Respecter `prefers-reduced-motion`.

## Logo
Intégrer le logo officiel (dossier `/brand/`) sans le déformer ni changer ses couleurs. Générer : version en-tête (SVG), version claire pour fond noir, favicon et icônes PWA.

## Références visuelles
Analyser les images du dossier `/references/` et en extraire : mise en page, rythme des sections, traitement photo et typographique. S'en **inspirer** sans les copier.
