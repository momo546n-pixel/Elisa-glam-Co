import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '../access'

/** Pages de contenu éditables : histoire, savoir-faire, livraison, contact, pages légales. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page de contenu', plural: 'Pages de contenu' },
  admin: { useAsTitle: 'title', group: 'Contenus', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Adresse (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Ne pas modifier pour les pages existantes (les liens du site en dépendent).' },
    },
    { name: 'intro', label: 'Chapeau (texte d’introduction)', type: 'textarea' },
    { name: 'heroImage', label: 'Image d’en-tête', type: 'upload', relationTo: 'media' },
    { name: 'body', label: 'Contenu', type: 'richText', required: true },
    { name: 'seoTitle', label: 'Titre SEO', type: 'text' },
    { name: 'seoDescription', label: 'Méta-description', type: 'textarea', maxLength: 170 },
  ],
}
