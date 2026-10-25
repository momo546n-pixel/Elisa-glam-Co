/**
 * Données de DÉMONSTRATION d'Elisa'glam&Co.
 *
 * Tout est FICTIF (produits, prix, histoire, fondatrice, avis, coordonnées) et signalé comme tel sur le site.
 * Les photos viennent d'Unsplash (licence libre) : voir demo-assets/ et la page /credits-photos.
 *
 * Usage :
 *   npm run seed                 crée les données si la base est vide
 *   SEED_RESET=1 npm run seed   efface produits, collections, commandes, avis, médias… puis recrée tout
 * Variables facultatives : SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (création d'un compte administratrice).
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { bulletList, heading, paragraph, richText } from './lexical'

try {
  process.loadEnvFile('.env')
} catch {
  /* variables déjà définies */
}

const reset = process.argv.includes('--reset') || process.env.SEED_RESET === '1'
const manifest = JSON.parse(fs.readFileSync('scripts/demo-images/manifest.json', 'utf8')) as { images: Record<string, string> }
const FICTIF = 'Contenu fictif de démonstration : à remplacer par les informations réelles de la marque.'

async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.count({ collection: 'categories' })
  if (existing.totalDocs > 0 && !reset) {
    console.log('Des données existent déjà : seed ignoré (utilisez --reset pour tout recréer).')
    process.exit(0)
  }

  /* ───────── Remise à zéro (données de démonstration uniquement) ───────── */
  if (reset) {
    for (const collection of ['reviews', 'orders', 'messages', 'products', 'promo-codes', 'delivery-zones', 'categories', 'pages', 'media'] as const) {
      await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
    }
    console.log('Données de démonstration effacées.')
  }

  /* ───────── Compte administratrice (optionnel) ───────── */
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const users = await payload.count({ collection: 'users' })
    if (users.totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, name: 'Administratrice', role: 'admin' },
      })
      console.log('Compte administratrice créé.')
    }
  }

  /* ───────── Médiathèque ───────── */
  const mediaCache = new Map<string, number>()
  async function media(key: string, alt: string): Promise<number> {
    const id = manifest.images[key]
    if (!id) throw new Error(`Image inconnue : ${key}`)
    const cached = mediaCache.get(key)
    if (cached) return cached
    const file = path.resolve('demo-assets', `${key}.jpg`)
    if (!fs.existsSync(file)) throw new Error(`Fichier manquant : ${file} (lancez node scripts/demo-images/download.mjs)`)
    const doc = await payload.create({
      collection: 'media',
      data: { alt, credit: `Photo d’illustration Unsplash (réf. ${id})` },
      filePath: file,
      overrideAccess: true,
    })
    mediaCache.set(key, doc.id as number)
    return doc.id as number
  }

  /* ───────── Collections ───────── */
  const catDefs = [
    { name: 'Sandales femme', slug: 'sandales-femme', order: 1, description: 'Brides croisées, mules et plates : l’élégance du cuir au quotidien.', img: 'cat-femme', alt: 'Sandales en cuir cognac pour femme' },
    { name: 'Sandales homme', slug: 'sandales-homme', order: 2, description: 'Des sandales sobres et robustes, pensées pour durer.', img: 'cat-homme', alt: 'Sandales en cuir pour homme' },
    { name: 'Modèles orthopédiques', slug: 'modeles-orthopediques', order: 3, description: 'Semelles anatomiques et maintien renforcé, sans compromis sur l’allure.', img: 'cat-ortho', alt: 'Sandales confort à semelle anatomique' },
    { name: 'Accessoires', slug: 'accessoires', order: 4, description: 'Ceintures, portefeuilles et sacs en cuir assortis à nos sandales.', img: 'cat-accessoires', alt: 'Ceinture tressée en cuir' },
  ]
  const cats: Record<string, number> = {}
  for (const c of catDefs) {
    const doc = await payload.create({
      collection: 'categories',
      data: { name: c.name, slug: c.slug, order: c.order, description: c.description, image: await media(c.img, c.alt) },
    })
    cats[c.slug] = doc.id as number
  }

  /* ───────── Zones de livraison (valeurs fictives) ───────── */
  const zones = [
    { name: 'Dakar Plateau / Médina', kind: 'dakar', fee: 2000, delay: '24 à 48 h', codAvailable: true, order: 1 },
    { name: 'Almadies / Ngor / Yoff', kind: 'dakar', fee: 2500, delay: '24 à 48 h', codAvailable: true, order: 2 },
    { name: 'Pikine / Guédiawaye / Parcelles', kind: 'dakar', fee: 2500, delay: '24 à 72 h', codAvailable: true, order: 3 },
    { name: 'Rufisque / Bargny', kind: 'dakar', fee: 3000, delay: '48 à 72 h', codAvailable: false, order: 4 },
    { name: 'Thiès', kind: 'region', fee: 4000, delay: '2 à 4 jours', codAvailable: false, order: 5 },
    { name: 'Saint-Louis', kind: 'region', fee: 5000, delay: '3 à 5 jours', codAvailable: false, order: 6 },
    { name: 'Autres régions du Sénégal', kind: 'region', fee: 5500, delay: '3 à 7 jours', codAvailable: false, order: 7 },
  ]
  const zoneByName: Record<string, { id: number; fee: number }> = {}
  for (const z of zones) {
    const doc = await payload.create({ collection: 'delivery-zones', data: { ...z, active: true, internalNote: 'Valeur fictive de démonstration.' } as never })
    zoneByName[z.name] = { id: doc.id as number, fee: z.fee }
  }

  /* ───────── Code promo (fictif) ───────── */
  await payload.create({ collection: 'promo-codes', data: { code: 'BIENVENUE10', type: 'percent', value: 10, active: true } })

  /* ───────── Réglages du site ───────── */
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      brandName: 'Elisa’glam&Co',
      tagline: 'L’élégance du cuir, faite au Sénégal',
      whatsappNumber: '+221770000000',
      phone: '+221 33 000 00 00',
      email: 'contact@elisaglam-demo.example',
      address: 'Atelier de démonstration\nMédina, Dakar, Sénégal',
      openingHours: 'Lundi au samedi, 9 h – 18 h',
      instagram: 'https://www.instagram.com/',
      facebook: 'https://www.facebook.com/',
      tiktok: 'https://www.tiktok.com/',
      orderNotificationEmail: 'commandes@elisaglam-demo.example',
      enableMobileMoney: true,
      enableCard: false,
      enableCod: true,
      freeShippingThreshold: 75000,
      demoMode: true,
      defaultSeoTitle: 'Elisa’glam&Co — Sandales et maroquinerie artisanale, Made in Senegal',
      defaultSeoDescription: 'Sandales et accessoires en cuir faits main au Sénégal. Maroquinerie artisanale premium, élégante et durable. Livraison à Dakar et dans les régions.',
      ogImage: await media('hero', 'Sandales en cuir portées avec un pantalon blanc'),
    },
  })

  /* ───────── Page d'accueil ───────── */
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      heroImage: await media('hero', 'Sandales en cuir portées avec un pantalon blanc'),
      heroEyebrow: 'Maroquinerie artisanale · Made in Senegal',
      heroTitle: 'L’élégance du cuir, faite au Sénégal',
      heroSubtitle: 'Sandales et accessoires en cuir, conçus à Dakar avec exigence.',
      heroCtaLabel: 'Découvrir la collection',
      heroCtaHref: '/boutique',
      selectionTitle: 'La sélection',
      newTitle: 'Nouveautés',
      bestSellersTitle: 'Les plus demandées',
      storyTitle: 'Notre histoire',
      storyText:
        'Née à Dakar en 2016, Elisa’glam&Co dessine et fabrique des sandales et des accessoires en cuir, avec la conviction que l’élégance se joue dans le détail : une couture nette, un cuir qui se patine, une semelle qui accompagne chaque pas.',
      storyImage: await media('story', 'Mains d’artisan piquant du cuir sur un étau en bois'),
      storyLinkLabel: 'Découvrir notre histoire',
      commitments: [
        { icon: 'craft', title: 'Fait main', text: 'Coupé, cousu et fini à la main dans notre atelier de Dakar.' },
        { icon: 'leather', title: 'Cuir de qualité', text: 'Des cuirs sélectionnés pour leur souplesse et leur tenue.' },
        { icon: 'senegal', title: 'Made in Senegal', text: 'Conçu et fabriqué au Sénégal par des artisans locaux.' },
        { icon: 'delivery', title: 'Livraison rapide', text: 'Dakar en 24 à 48 h, régions en 3 à 7 jours.' },
        { icon: 'exchange', title: 'Échange facile', text: 'Une pointure à changer ? Nous échangeons sous 7 jours.' },
      ],
    },
  })

  /* ───────── FAQ ───────── */
  await payload.updateGlobal({
    slug: 'faq',
    data: {
      intro: 'Les réponses à vos questions les plus fréquentes. (Réponses fictives de démonstration.) Une autre question ? Écrivez-nous sur WhatsApp.',
      items: [
        { category: 'sizes', question: 'Comment choisir ma pointure ?', answer: 'Mesurez votre pied en fin de journée et reportez-vous à notre guide des pointures. Nos modèles taillent normalement ; entre deux pointures, prenez la plus grande.' },
        { category: 'sizes', question: 'Puis-je échanger si la pointure ne convient pas ?', answer: 'Oui, l’échange de pointure est possible sous 7 jours si l’article n’a pas été porté à l’extérieur. Écrivez-nous sur WhatsApp pour organiser l’échange.' },
        { category: 'materials', question: 'Dans quel cuir sont fabriquées vos sandales ?', answer: 'Nos dessus sont en cuir de vachette sélectionné pour sa souplesse. Chaque fiche produit détaille les matières du modèle.' },
        { category: 'orders', question: 'Dois-je créer un compte pour commander ?', answer: 'Non. Vous commandez sans compte : il suffit d’indiquer votre nom, votre téléphone et votre adresse de livraison.' },
        { category: 'orders', question: 'Comment suivre ma commande ?', answer: 'Rendez-vous sur la page « Suivre ma commande » et saisissez votre numéro de commande et votre numéro de téléphone.' },
        { category: 'payment', question: 'Quels moyens de paiement acceptez-vous ?', answer: 'Wave, Orange Money et, dans certaines zones de Dakar, le paiement à la livraison. Les moyens disponibles s’affichent à l’étape de paiement.' },
        { category: 'payment', question: 'Le paiement en ligne est-il sécurisé ?', answer: 'Le paiement se fait sur la page sécurisée de votre opérateur : nous ne voyons ni ne conservons vos codes.' },
        { category: 'care', question: 'Comment entretenir mes articles en cuir ?', answer: 'Essuyez avec un chiffon doux et sec, nourrissez le cuir avec un baume incolore une à deux fois par an, et évitez le contact prolongé avec l’eau. Laissez sécher naturellement, loin d’une source de chaleur.' },
        { category: 'delivery', question: 'Quels sont les délais et frais de livraison ?', answer: 'Dakar : 24 à 48 h. Régions : 3 à 7 jours. Les frais dépendent de votre zone et sont affichés avant la validation. Livraison offerte dès 75 000 FCFA d’achats.' },
        { category: 'delivery', question: 'Puis-je payer à la livraison ?', answer: 'Oui, dans certaines zones de Dakar. Nous vous contactons par WhatsApp ou par appel pour confirmer la commande avant la préparation.' },
      ],
    },
  })

  /* ───────── Guide des pointures ───────── */
  const uk = ['3,5', '4,5', '5', '6', '6,5', '7,5', '8', '9', '9,5', '10,5', '11']
  const us = ['4,5', '5,5', '6', '7', '7,5', '8,5', '9', '10', '10,5', '11,5', '12']
  await payload.updateGlobal({
    slug: 'size-guide',
    data: {
      intro: 'Posez le talon contre un mur, mesurez la distance jusqu’au bout de votre plus long orteil, puis reportez-vous au tableau.',
      rows: Array.from({ length: 11 }, (_, i) => ({
        eu: String(36 + i),
        uk: uk[i],
        us: us[i],
        footLengthCm: ((36 + i) * (2 / 3) - 1.5).toFixed(1).replace('.', ','),
      })),
      tips: [
        { title: 'Mesurer en fin de journée', text: 'Le pied gonfle légèrement au fil de la journée : mesurez-le le soir pour plus de précision.' },
        { title: 'Entre deux pointures', text: 'Prenez la pointure supérieure, ou écrivez-nous sur WhatsApp avec la longueur de votre pied.' },
        { title: 'Modèles orthopédiques', text: 'Pour les modèles à semelle anatomique, contactez-nous : nous vous conseillons selon votre morphologie.' },
        { title: 'Le cuir se fait à votre pied', text: 'Le cuir s’assouplit après quelques jours de port : un maintien ferme au début est normal.' },
      ],
      note: 'Valeurs indicatives de démonstration (équivalences UK / US usuelles).',
    },
  })

  /* ───────── Pages de contenu (textes fictifs) ───────── */
  const photoKeys = Object.entries(manifest.images)
  const pages = [
    {
      slug: 'notre-histoire',
      title: 'Notre histoire',
      intro: 'Une marque sénégalaise de maroquinerie artisanale, créée à Dakar en 2016.',
      heroImage: await media('history', 'Rue colorée au Sénégal'),
      body: richText(
        paragraph(`Note : ${FICTIF}`),
        heading('Tout a commencé en 2016'),
        paragraph('Elisa’glam&Co naît dans un petit atelier de la Médina, à Dakar. L’idée est simple : prouver qu’une sandale peut être élégante, confortable et fabriquée avec exigence, à quelques rues de ceux qui la portent.'),
        heading('Une fondatrice, une vision'),
        paragraph('Elisa, fondatrice de la maison, a grandi entre les ateliers de cordonniers et les marchés de la ville. Sa vision : une élégance africaine contemporaine, sobre et durable, loin des clichés, qui se reconnaît à ses lignes et à la qualité de son cuir.'),
        heading('Un ancrage sénégalais'),
        paragraph('Chaque modèle est dessiné, coupé, cousu et fini au Sénégal par une équipe d’artisans. Travailler localement, c’est garder la maîtrise de la qualité, transmettre un savoir-faire et faire vivre un tissu d’ateliers.'),
        bulletList(['Des modèles pensés pour durer et se réparer.', 'Des séries limitées plutôt que de la production de masse.', 'Une relation directe avec nos clientes et clients, par WhatsApp.']),
      ),
    },
    {
      slug: 'notre-savoir-faire',
      title: 'Notre savoir-faire',
      intro: 'Des matières choisies, une fabrication artisanale, des finitions soignées.',
      heroImage: await media('craft', 'Tracé d’un patron sur une peau de cuir'),
      body: richText(
        paragraph(`Note : ${FICTIF}`),
        heading('Les matières'),
        paragraph('Nous travaillons un cuir de vachette sélectionné pour sa souplesse et sa tenue, des doublures en cuir respirant et des semelles en gomme ou en liège selon les modèles. Le cuir est choisi peau par peau.'),
        heading('La fabrication'),
        bulletList(['Dessin et patronage du modèle.', 'Coupe du cuir à la main, en suivant le grain.', 'Couture et assemblage des brides.', 'Montage sur la semelle, collage et pose à la presse.', 'Contrôle qualité, un modèle à la fois.']),
        heading('Les finitions'),
        paragraph('Bords des brides polis et teintés à la main, coutures renforcées aux points de tension, boucles en métal massif, semelle intérieure matelassée. Ce sont ces détails, invisibles de loin, qui font la durée de vie d’une paire.'),
      ),
    },
    {
      slug: 'livraison-et-retours',
      title: 'Livraison et retours',
      intro: 'Livraison à Dakar et dans les régions du Sénégal.',
      body: richText(
        paragraph(`Note : ${FICTIF}`),
        heading('Zones, frais et délais'),
        paragraph('Dakar et banlieue : 24 à 72 h. Régions du Sénégal : 3 à 7 jours. Les frais exacts s’affichent à l’étape de commande selon votre zone. La livraison est offerte dès 75 000 FCFA d’achats.'),
        heading('Paiement'),
        paragraph('Wave, Orange Money, et paiement à la livraison dans certaines zones de Dakar. Pour le paiement à la livraison, nous confirmons votre commande par WhatsApp ou par appel avant la préparation.'),
        heading('Échanges et retours'),
        bulletList(['Échange de pointure ou de modèle possible sous 7 jours après la livraison.', 'L’article doit être non porté à l’extérieur, dans son emballage d’origine.', 'Les frais d’envoi de l’échange sont à votre charge, sauf défaut de fabrication.', 'Un défaut ? Écrivez-nous sur WhatsApp avec une photo : nous réparons ou remplaçons.']),
      ),
    },
    {
      slug: 'contact',
      title: 'Contact',
      intro: 'Une question sur un modèle, une pointure ou une commande ? Écrivez-nous.',
      body: richText(paragraph('Le moyen le plus rapide de nous joindre est WhatsApp. Vous pouvez aussi utiliser le formulaire ci-contre : nous répondons sous 24 h ouvrées. (Coordonnées fictives de démonstration.)')),
    },
    {
      slug: 'mentions-legales',
      title: 'Mentions légales',
      body: richText(
        paragraph(`Note : ${FICTIF}`),
        heading('Éditeur du site'),
        paragraph('Elisa’glam&Co, société fictive de démonstration. Siège : Médina, Dakar, Sénégal. NINEA : 000000000 (fictif). RCCM : SN-DKR-0000-X-00000 (fictif). Directrice de la publication : Elisa (fictive).'),
        heading('Hébergement'),
        paragraph('Hébergeur fictif de démonstration. Les informations réelles seront renseignées à la mise en ligne.'),
        heading('Propriété intellectuelle'),
        paragraph('Les photographies de ce site de démonstration sont issues de la banque d’images Unsplash et utilisées sous licence Unsplash : voir la page Crédits photos.'),
      ),
    },
    {
      slug: 'politique-de-confidentialite',
      title: 'Politique de confidentialité',
      body: richText(
        paragraph(`Note : ${FICTIF}`),
        paragraph('Nous collectons uniquement les données nécessaires au traitement de votre commande : nom, téléphone, adresse de livraison et, si vous le souhaitez, email. Elles ne sont jamais vendues.'),
        bulletList(['Finalité : traiter et livrer votre commande, vous informer de son avancement.', 'Accès restreint : seule l’équipe d’Elisa’glam&Co peut les consulter.', 'Durée : conservées le temps nécessaire à la gestion de la commande et aux obligations légales.', 'Vos droits : accès, rectification et suppression sur simple demande à l’adresse de contact.']),
      ),
    },
    {
      slug: 'cgv',
      title: 'Conditions générales de vente',
      body: richText(
        paragraph(`Note : ${FICTIF}`),
        heading('1. Prix'),
        paragraph('Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises, hors frais de livraison affichés avant validation.'),
        heading('2. Commande et paiement'),
        paragraph('La commande est ferme après confirmation du paiement (Wave, Orange Money) ou, pour le paiement à la livraison, après confirmation par notre équipe.'),
        heading('3. Livraison'),
        paragraph('Les délais indiqués sont des estimations selon la zone de livraison choisie.'),
        heading('4. Échanges et retours'),
        paragraph('Échange possible sous 7 jours pour un article non porté à l’extérieur, dans son emballage d’origine.'),
        heading('5. Réclamations'),
        paragraph('Toute réclamation peut être adressée par WhatsApp ou via le formulaire de contact.'),
      ),
    },
    {
      slug: 'politique-de-cookies',
      title: 'Politique de cookies',
      body: richText(
        paragraph('Ce site n’active aucun cookie de mesure d’audience ou de publicité sans votre accord. Vous pouvez accepter ou refuser à tout moment via « Gérer mes cookies » en bas de page.'),
        bulletList(['Cookies essentiels : panier et préférences, nécessaires au fonctionnement du site.', 'Mesure d’audience (Google Analytics) : uniquement avec votre accord.', 'Publicité (Meta Pixel) : uniquement avec votre accord.']),
      ),
    },
    {
      slug: 'credits-photos',
      title: 'Crédits photos',
      intro: 'Photographies d’illustration de ce site de démonstration.',
      body: richText(
        paragraph('Toutes les photographies de ce site de démonstration proviennent de la banque d’images Unsplash et sont utilisées sous la licence Unsplash (usage libre, y compris commercial). Elles servent uniquement d’illustration : elles ne représentent pas de véritables produits Elisa’glam&Co et seront remplacées par les photos de la marque.'),
        paragraph('Merci aux photographes d’Unsplash. Références des images utilisées (unsplash.com/photos/…) :'),
        bulletList([...new Set(photoKeys.map(([, id]) => `photo-${id}`))]),
      ),
    },
  ]
  for (const p of pages) {
    await payload.create({ collection: 'pages', data: p as never })
  }

  /* ───────── Produits fictifs ───────── */
  type Spec = {
    name: string
    ref: string
    cat: string
    price: number
    salePrice?: number
    short: string
    desc: string[]
    materials: string
    care: string
    colors: { name: string; hex: string }[]
    sizes: { size: string; stock: number }[]
    images: string[]
    flags?: { isNew?: boolean; featured?: boolean; bestSeller?: boolean }
    madeToOrder?: string
  }
  const range = (from: number, to: number, stock: (n: number) => number) => Array.from({ length: to - from + 1 }, (_, i) => ({ size: String(from + i), stock: stock(from + i) }))
  const CARE = 'Essuyer avec un chiffon doux et sec. Nourrir le cuir avec un baume incolore une à deux fois par an. Éviter l’eau et la chaleur directe.'
  const leatherMat = 'Dessus en cuir de vachette, doublure cuir, semelle extérieure en gomme.'

  const specs: Spec[] = [
    { name: 'Sandale Teranga', ref: 'EG-SF-001', cat: 'sandales-femme', price: 28000, short: 'Brides croisées en cuir souple, l’allure d’une plate sans effort.', desc: ['Deux larges brides croisées enveloppent le pied avec douceur. Le cuir, souple dès le premier jour, se patine avec le temps.', 'Semelle intérieure matelassée pour un confort de longue marche. Le modèle qui va avec tout, de la robe d’été au lin blanc.'], materials: leatherMat, care: CARE, colors: [{ name: 'Cognac', hex: '#9A5B2E' }, { name: 'Noir', hex: '#141210' }], sizes: range(36, 41, (n) => (n === 38 ? 0 : 5)), images: ['teranga-1', 'teranga-2'], flags: { isNew: true, featured: true, bestSeller: true } },
    { name: 'Sandale Saly', ref: 'EG-SF-002', cat: 'sandales-femme', price: 24000, salePrice: 20000, short: 'Une mule légère, finitions tressées, teintes naturelles.', desc: ['Une sandale douce et lumineuse, pensée pour les journées chaudes. Les finitions tressées apportent du relief sans surcharger.', 'Légère, souple et facile à enfiler.'], materials: 'Dessus en cuir naturel, semelle intérieure cuir, semelle extérieure en gomme.', care: CARE, colors: [{ name: 'Naturel', hex: '#D9C2A0' }], sizes: range(36, 41, () => 4), images: ['saly-1', 'saly-2'], flags: { bestSeller: true } },
    { name: 'Sandale Sine', ref: 'EG-SF-003', cat: 'sandales-femme', price: 32000, short: 'Brides ajustables, maintien précis, teinte camel.', desc: ['Une sandale à brides ajustables qui épouse le pied. Boucles en métal, coutures renforcées, finitions nettes.', 'Elle prend la forme du pied en quelques jours de port.'], materials: leatherMat, care: CARE, colors: [{ name: 'Camel', hex: '#B07A4A' }, { name: 'Noir', hex: '#141210' }], sizes: range(36, 41, (n) => (n === 41 ? 1 : 3)), images: ['sine-1', 'sine-2'], flags: { isNew: true, featured: true } },
    { name: 'Sandale Ngor', ref: 'EG-SF-004', cat: 'sandales-femme', price: 38000, short: 'Bordeaux profond, brides croisées, semelle sculptée.', desc: ['La plus habillée de la collection : un bordeaux profond, des brides croisées et une semelle sculptée qui surélève avec élégance.', 'Pour les soirées et les grandes occasions.'], materials: leatherMat, care: CARE, colors: [{ name: 'Bordeaux', hex: '#6B1F2A' }], sizes: range(36, 41, () => 3), images: ['ngor-1', 'ngor-2'], flags: { featured: true } },
    { name: 'Sandale Baobab', ref: 'EG-SH-001', cat: 'sandales-homme', price: 35000, short: 'Doubles brides à boucles, semelle liège, tenue irréprochable.', desc: ['Notre sandale homme la plus demandée : doubles brides à boucles, semelle anatomique en liège et cuir épais qui se patine.', 'Faite pour marcher, du matin au soir.'], materials: 'Dessus en cuir de vachette, semelle intérieure liège et cuir, semelle extérieure en gomme.', care: CARE, colors: [{ name: 'Noir', hex: '#141210' }, { name: 'Marron', hex: '#5A3A22' }], sizes: range(40, 45, (n) => (n === 45 ? 0 : 4)), images: ['baobab-1', 'baobab-2', 'baobab-3'], flags: { isNew: true, featured: true, bestSeller: true } },
    { name: 'Claquette Bakel', ref: 'EG-SH-002', cat: 'sandales-homme', price: 29000, short: 'Claquette noire, bride large en cuir cognac.', desc: ['Une claquette sobre : bride large en cuir cognac sur semelle noire profilée. Elle s’enfile en une seconde et reste élégante.', 'Parfaite pour la maison, la plage et les journées de repos.'], materials: leatherMat, care: CARE, colors: [{ name: 'Noir / Cognac', hex: '#2A1A10' }], sizes: range(40, 45, () => 4), images: ['bakel-1', 'bakel-2'], flags: { featured: true } },
    { name: 'Sandale Cayor', ref: 'EG-SH-003', cat: 'sandales-homme', price: 33000, short: 'Inspirée des sandales traditionnelles, teinte miel.', desc: ['Une sandale inspirée des modèles traditionnels, revisitée avec un cuir miel qui se patine. Bride en T et semelle fine pour la souplesse.', 'Le charme de l’artisanat, la sobriété en plus.'], materials: 'Dessus en cuir naturel, semelle en cuir.', care: CARE, colors: [{ name: 'Miel', hex: '#C68642' }], sizes: range(40, 45, (n) => (n === 42 ? 0 : 3)), images: ['cayor-1', 'cayor-2'], flags: { featured: true, bestSeller: true } },
    { name: 'Sandale Saloum', ref: 'EG-SH-004', cat: 'sandales-homme', price: 42000, short: 'Brides larges, semelle crantée, teinte olive.', desc: ['Brides larges et semelle crantée pour une sandale de ville robuste. Le cuir olive se nuance avec le temps.', 'Pour celles et ceux qui marchent beaucoup.'], materials: leatherMat, care: CARE, colors: [{ name: 'Olive', hex: '#4B4A2F' }], sizes: range(40, 45, () => 4), images: ['saloum-1'] },
    { name: 'Confort Médina', ref: 'EG-OR-001', cat: 'modeles-orthopediques', price: 40000, short: 'Semelle anatomique, fabriqué sur commande à votre pointure.', desc: ['Un modèle pensé pour le confort : semelle anatomique avec voûte plantaire, talon enveloppant et cuir souple. Fabriqué sur commande, à votre pointure.', 'Délai de fabrication : 7 à 10 jours.'], materials: 'Dessus en cuir souple, semelle anatomique liège et latex, semelle extérieure en gomme.', care: CARE, colors: [{ name: 'Marron', hex: '#5A3A22' }, { name: 'Noir', hex: '#141210' }], sizes: range(38, 46, () => 0), images: ['medina-1', 'medina-2'], madeToOrder: '7 à 10 jours', flags: { isNew: true } },
    { name: 'Confort Teranga', ref: 'EG-OR-002', cat: 'modeles-orthopediques', price: 38000, short: 'Maintien renforcé, voûte plantaire, teinte sable.', desc: ['La version confort de notre Teranga : semelle anatomique, maintien renforcé et brides larges qui répartissent la pression.', 'L’élégance sans la fatigue.'], materials: 'Dessus en cuir de vachette, semelle anatomique liège, semelle extérieure en gomme.', care: CARE, colors: [{ name: 'Sable', hex: '#D8C3A5' }], sizes: range(36, 42, () => 3), images: ['teranga-confort-1', 'teranga-confort-2'] },
    { name: 'Ceinture Kora', ref: 'EG-AC-001', cat: 'accessoires', price: 16000, short: 'Ceinture en cuir tressé, boucle argentée.', desc: ['Une ceinture tressée à la main, souple et solide, qui habille le denim comme le lin. Boucle en métal argenté.', 'Disponible du 85 au 105 cm.'], materials: 'Cuir de vachette tressé, boucle en métal.', care: CARE, colors: [{ name: 'Marron', hex: '#6B3E22' }], sizes: [85, 90, 95, 100, 105].map((n) => ({ size: String(n), stock: n === 105 ? 0 : 4 })), images: ['kora-1', 'kora-2'], flags: { featured: true } },
    { name: 'Ceinture Ndar', ref: 'EG-AC-002', cat: 'accessoires', price: 14000, short: 'Cuir lisse teinté orange, boucle acier.', desc: ['Une ceinture lisse, teintée dans une couleur franche, qui donne de la vie aux tenues sobres.', 'Les bords sont polis à la main.'], materials: 'Cuir de vachette lisse, boucle en acier.', care: CARE, colors: [{ name: 'Orange cuir', hex: '#C8651B' }, { name: 'Marron', hex: '#5A3A22' }], sizes: [85, 90, 95, 100, 105].map((n) => ({ size: String(n), stock: 3 })), images: ['ndar-1', 'ndar-2'] },
    { name: 'Porte-cartes Joal', ref: 'EG-AC-003', cat: 'accessoires', price: 9500, short: 'Compact, quatre emplacements, cuir grainé.', desc: ['Un porte-cartes fin qui se glisse dans toutes les poches. Quatre emplacements et un compartiment central.', 'Le cuir grainé résiste aux frottements.'], materials: 'Cuir de vachette grainé.', care: CARE, colors: [{ name: 'Noir', hex: '#141210' }], sizes: [{ size: 'Unique', stock: 12 }], images: ['joal-1', 'joal-2'], flags: { isNew: true } },
    { name: 'Portefeuille Casamance', ref: 'EG-AC-004', cat: 'accessoires', price: 15000, short: 'Portefeuille deux volets, couture sellier.', desc: ['Un portefeuille deux volets cousu à la main au point sellier. Compartiments cartes, billets et monnaie.', 'Il se patine joliment.'], materials: 'Cuir de vachette pleine fleur, fil ciré.', care: CARE, colors: [{ name: 'Cognac', hex: '#9A5B2E' }, { name: 'Marron foncé', hex: '#3A2415' }], sizes: [{ size: 'Unique', stock: 8 }], images: ['casamance-1', 'casamance-2'] },
    { name: 'Sac cabas Sahel', ref: 'EG-AC-005', cat: 'accessoires', price: 58000, short: 'Grand cabas en cuir souple, anses renforcées.', desc: ['Un grand cabas souple, assez spacieux pour la journée entière. Anses renforcées, coutures apparentes, cuir qui prend la patine.', 'Le sac qui accompagne toutes les sandales de la collection.'], materials: 'Cuir de vachette pleine fleur.', care: CARE, colors: [{ name: 'Cognac', hex: '#9A5B2E' }], sizes: [{ size: 'Unique', stock: 5 }], images: ['sahel-1', 'sahel-2'], flags: { featured: true, bestSeller: true } },
    { name: 'Sac bandoulière Sine', ref: 'EG-AC-006', cat: 'accessoires', price: 48000, short: 'Compact, rabat aimanté, bandoulière réglable.', desc: ['Un sac bandoulière compact à rabat aimanté. Bandoulière réglable, doublure intérieure avec poche zippée.', 'Taille idéale pour le téléphone, le portefeuille et les clés.'], materials: 'Cuir de vachette grainé, doublure textile.', care: CARE, colors: [{ name: 'Camel', hex: '#B07A4A' }], sizes: [{ size: 'Unique', stock: 6 }], images: ['bandouliere-1', 'bandouliere-2'], flags: { isNew: true } },
  ]

  const productIds: Record<string, number> = {}
  for (const s of specs) {
    const images = []
    for (const k of s.images) images.push({ image: await media(k, `${s.name}, photo d’illustration`), alt: `${s.name}, photo d’illustration` })
    const doc = await payload.create({
      collection: 'products',
      data: {
        name: s.name,
        reference: s.ref,
        category: cats[s.cat],
        shortDescription: s.short,
        description: s.desc.join('\n\n'),
        materials: s.materials,
        care: s.care,
        sizeAdvice: 'Taille normalement',
        price: s.price,
        salePrice: s.salePrice,
        status: 'published',
        isNew: Boolean(s.flags?.isNew),
        featured: Boolean(s.flags?.featured),
        bestSeller: Boolean(s.flags?.bestSeller),
        isDemo: true,
        fulfillment: s.madeToOrder ? 'made_to_order' : 'stock',
        leadTime: s.madeToOrder,
        images,
        colors: s.colors.map((c) => ({ name: c.name, hex: c.hex, sizes: s.sizes })),
      } as never,
    })
    productIds[s.name] = doc.id as number
  }

  /* ───────── Avis de démonstration (clairement signalés) ───────── */
  const reviews = [
    ['Aïssatou', 'Sandale Teranga', 5, 'Très belles finitions, confortable dès le premier jour. Je l’ai déjà portée une semaine entière.'],
    ['Mamadou', 'Sandale Baobab', 5, 'Solide et élégante. Le liège est un vrai plus pour marcher toute la journée.'],
    ['Fatou', 'Sandale Saly', 4, 'Légère et jolie, je l’ai prise en soldes. Je conseille de prendre la pointure au-dessus.'],
    ['Ibrahima', 'Sandale Cayor', 5, 'Le cuir est magnifique et prend déjà une belle patine.'],
    ['Khady', 'Sac cabas Sahel', 5, 'Spacieux et souple. Il va avec toutes mes tenues.'],
    ['Cheikh', 'Ceinture Kora', 4, 'Bien finie, la boucle est solide. Livraison rapide à Dakar.'],
  ] as const
  for (const [firstName, product, rating, comment] of reviews) {
    await payload.create({
      collection: 'reviews',
      data: { firstName, product: productIds[product], rating, comment, date: new Date().toISOString(), status: 'approved', isDemo: true } as never,
    })
  }


  /* ───────── Commandes fictives (pour animer le tableau de bord) ───────── */
  const priceOf = (name: string) => specs.find((x) => x.name === name)!.price
  const demoOrders = [
    { name: 'Aminata Diallo', phone: '+221770001122', zone: 'Dakar Plateau / Médina', method: 'wave', paymentStatus: 'paid', status: 'delivered', address: 'Rue 11 x 12, Médina', items: [['Sandale Teranga', 'Cognac', '37']] },
    { name: 'Moussa Ndiaye', phone: '+221760002233', zone: 'Almadies / Ngor / Yoff', method: 'orange_money', paymentStatus: 'paid', status: 'preparing', address: 'Ngor, village', items: [['Sandale Baobab', 'Noir', '42'], ['Ceinture Kora', 'Marron', '95']] },
    { name: 'Khadija Sow', phone: '+221780003344', zone: 'Pikine / Guédiawaye / Parcelles', method: 'cod', paymentStatus: 'cod_pending', status: 'received', address: 'Parcelles Assainies, unité 15', items: [['Sac cabas Sahel', 'Cognac', 'Unique']] },
    { name: 'Ousmane Fall', phone: '+221770004455', zone: 'Thiès', method: 'wave', paymentStatus: 'paid', status: 'confirmed', address: 'Quartier Randoulène, Thiès', items: [['Sandale Cayor', 'Miel', '43']] },
  ] as const
  for (const o of demoOrders) {
    const items = o.items.map(([product, color, size]) => ({ product: productIds[product], productName: product, reference: specs.find((x) => x.name === product)!.ref, color, size, unitPrice: priceOf(product), quantity: 1, madeToOrder: false }))
    const subtotal = items.reduce((n, i) => n + i.unitPrice, 0)
    const zone = zoneByName[o.zone]
    const deliveryFee = subtotal >= 75000 ? 0 : zone.fee
    await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.method,
        customerName: o.name,
        customerPhone: o.phone,
        deliveryZone: zone.id,
        deliveryZoneName: o.zone,
        address: o.address,
        items,
        subtotal,
        discount: 0,
        deliveryFee,
        total: subtotal + deliveryFee,
        currency: 'XOF',
        locale: 'fr',
        internalNote: 'Commande fictive de démonstration.',
      } as never,
    })
  }

  console.log(`✔ Démonstration prête : ${specs.length} produits, ${Object.keys(manifest.images).length} photos, ${pages.length} pages.`)
  process.exit(0)
}

try {
  await main()
} catch (err) {
  console.error(err)
  process.exit(1)
}
