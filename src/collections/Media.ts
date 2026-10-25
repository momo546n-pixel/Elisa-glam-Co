import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: { group: 'Catalogue', description: 'Photos produits, bannières, visuels.' },
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  upload: {
    mimeTypes: ['image/*'],
    // Redimensionnement automatique : tailles adaptées au mobile d'abord, en WebP.
    imageSizes: [
      { name: 'thumb', width: 320, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'card', width: 720, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1280, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumb',
  },
  fields: [
    {
      name: 'alt',
      label: 'Texte alternatif',
      type: 'text',
      required: true,
      admin: { description: 'Décrit l’image (accessibilité et référencement).' },
    },
    {
      name: 'credit',
      label: 'Crédit / source',
      type: 'text',
      admin: { description: 'Photographe ou banque d’images, si la licence l’exige.' },
    },
  ],
}
