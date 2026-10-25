import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

export const PromoCodes: CollectionConfig = {
  slug: 'promo-codes',
  labels: { singular: 'Code promo', plural: 'Codes promo' },
  admin: {
    useAsTitle: 'code',
    group: 'Boutique',
    defaultColumns: ['code', 'type', 'value', 'expiresAt', 'usedCount', 'active'],
  },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.code) data.code = String(data.code).trim().toUpperCase()
        return data
      },
    ],
  },
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true, unique: true, index: true },
    {
      name: 'type',
      label: 'Type de réduction',
      type: 'select',
      required: true,
      defaultValue: 'percent',
      options: [
        { label: 'Pourcentage', value: 'percent' },
        { label: 'Montant fixe (FCFA)', value: 'fixed' },
      ],
    },
    {
      name: 'value',
      label: 'Valeur',
      type: 'number',
      required: true,
      min: 1,
      admin: { description: '10 = 10 % ou 10 FCFA selon le type.' },
    },
    { name: 'minSubtotal', label: 'Montant minimum de commande (FCFA)', type: 'number', min: 0 },
    { name: 'expiresAt', label: 'Date limite', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'maxUses', label: 'Nombre maximum d’utilisations', type: 'number', min: 1 },
    { name: 'usedCount', label: 'Utilisations', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'active', label: 'Actif', type: 'checkbox', defaultValue: true },
  ],
}
