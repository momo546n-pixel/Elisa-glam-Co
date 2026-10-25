import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '../access'
import { slugify } from '../lib/format'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Collection', plural: 'Collections' },
  admin: { useAsTitle: 'name', group: 'Catalogue', defaultColumns: ['name', 'slug', 'order'] },
  defaultSort: 'order',
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) data.slug = slugify(data.name)
        return data
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Adresse (slug)',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Générée automatiquement à partir du nom.' },
    },
    { name: 'description', label: 'Description courte', type: 'textarea' },
    { name: 'image', label: 'Image de la collection', type: 'upload', relationTo: 'media' },
    {
      name: 'order',
      label: 'Ordre d’affichage',
      type: 'number',
      defaultValue: 10,
      admin: { position: 'sidebar' },
    },
  ],
}
