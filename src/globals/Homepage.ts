import type { GlobalConfig } from 'payload'
import { anyone, isStaff } from '../access'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Page d’accueil',
  admin: { group: 'Contenus' },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Bannière d’ouverture',
          fields: [
            { name: 'heroImage', label: 'Image de la bannière', type: 'upload', relationTo: 'media' },
            { name: 'heroEyebrow', label: 'Surtitre (petit texte en capitales)', type: 'text' },
            { name: 'heroTitle', label: 'Slogan (titre)', type: 'text' },
            { name: 'heroSubtitle', label: 'Sous-titre', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'heroCtaLabel', label: 'Texte du bouton', type: 'text', defaultValue: 'Découvrir la collection' },
                { name: 'heroCtaHref', label: 'Lien du bouton', type: 'text', defaultValue: '/boutique' },
              ],
            },
          ],
        },
        {
          label: 'Sélection de produits',
          fields: [
            { name: 'selectionTitle', label: 'Titre de la sélection', type: 'text', defaultValue: 'La sélection' },
            {
              name: 'featuredProducts',
              label: 'Produits mis en avant',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              admin: { description: 'Si vide, les produits cochés « Mettre en avant » sont utilisés.' },
            },
            { name: 'newTitle', label: 'Titre des nouveautés', type: 'text', defaultValue: 'Nouveautés' },
            { name: 'bestSellersTitle', label: 'Titre des meilleures ventes', type: 'text', defaultValue: 'Les plus demandées' },
          ],
        },
        {
          label: 'Notre histoire',
          fields: [
            { name: 'storyTitle', label: 'Titre', type: 'text', defaultValue: 'Notre histoire' },
            { name: 'storyText', label: 'Résumé', type: 'textarea' },
            { name: 'storyImage', label: 'Image', type: 'upload', relationTo: 'media' },
            { name: 'storyLinkLabel', label: 'Texte du lien', type: 'text', defaultValue: 'Découvrir notre histoire' },
          ],
        },
        {
          label: 'Engagements',
          fields: [
            {
              name: 'commitments',
              label: 'Engagements (artisanat, cuir, Made in Senegal, livraison, échange…)',
              type: 'array',
              maxRows: 6,
              fields: [
                {
                  name: 'icon',
                  label: 'Icône',
                  type: 'select',
                  defaultValue: 'craft',
                  options: [
                    { label: 'Artisanat', value: 'craft' },
                    { label: 'Cuir', value: 'leather' },
                    { label: 'Made in Senegal', value: 'senegal' },
                    { label: 'Livraison', value: 'delivery' },
                    { label: 'Échange', value: 'exchange' },
                    { label: 'Paiement sécurisé', value: 'secure' },
                  ],
                },
                { name: 'title', label: 'Titre', type: 'text', required: true },
                { name: 'text', label: 'Texte', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Ordre des sections',
          fields: [
            {
              name: 'sectionOrder',
              label: 'Ordre d’affichage des sections',
              type: 'array',
              admin: { description: 'Glissez pour réordonner. Retirez une ligne pour masquer la section.' },
              defaultValue: [
                { section: 'collections' },
                { section: 'featured' },
                { section: 'story' },
                { section: 'new' },
                { section: 'commitments' },
                { section: 'bestSellers' },
                { section: 'reviews' },
              ],
              fields: [
                {
                  name: 'section',
                  label: 'Section',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Collections', value: 'collections' },
                    { label: 'Sélection de produits', value: 'featured' },
                    { label: 'Notre histoire', value: 'story' },
                    { label: 'Nouveautés', value: 'new' },
                    { label: 'Engagements', value: 'commitments' },
                    { label: 'Meilleures ventes', value: 'bestSellers' },
                    { label: 'Avis clients', value: 'reviews' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
