import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const DeliveryZones: CollectionConfig = {
  slug: 'delivery-zones',
  labels: { singular: 'Zone de livraison', plural: 'Zones de livraison' },
  admin: {
    useAsTitle: 'name',
    group: 'Boutique',
    defaultColumns: ['name', 'kind', 'fee', 'delay', 'codAvailable', 'active'],
  },
  defaultSort: 'order',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'name', label: 'Nom de la zone', type: 'text', required: true },
    {
      name: 'kind',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'dakar',
      options: [
        { label: 'Dakar et banlieue', value: 'dakar' },
        { label: 'Région du Sénégal', value: 'region' },
        { label: 'International (non activé en V1)', value: 'international' },
      ],
    },
    { name: 'fee', label: 'Frais de livraison (FCFA)', type: 'number', required: true, min: 0, defaultValue: 0 },
    { name: 'delay', label: 'Délai de livraison', type: 'text', admin: { description: 'Ex. « 24 à 48 h ».' } },
    {
      name: 'codAvailable',
      label: 'Paiement à la livraison possible',
      type: 'checkbox',
      defaultValue: false,
    },
    { name: 'active', label: 'Zone active', type: 'checkbox', defaultValue: true },
    { name: 'order', label: 'Ordre d’affichage', type: 'number', defaultValue: 10, admin: { position: 'sidebar' } },
    {
      name: 'currency',
      label: 'Devise',
      type: 'text',
      defaultValue: 'XOF',
      admin: { position: 'sidebar', readOnly: true, description: 'Prévu pour la phase 2 (multi-devises).' },
    },
    {
      name: 'internalNote',
      label: 'Note interne',
      type: 'textarea',
      access: { read: ({ req }) => Boolean(req.user) },
    },
  ],
}
