import type { CollectionConfig } from 'payload'
import { isStaffRole } from '../access'

/**
 * Avis clients. Aucun avis fictif : seuls les avis « Publié » sont affichés.
 * Les avis de démonstration doivent être explicitement marqués.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Avis client', plural: 'Avis clients' },
  admin: {
    useAsTitle: 'firstName',
    group: 'Boutique',
    defaultColumns: ['firstName', 'product', 'rating', 'status', 'date'],
  },
  access: {
    read: ({ req }) => (req.user ? true : { status: { equals: 'approved' } }),
    // Écriture réservée au personnel ; les visiteurs passent par l'action serveur dédiée (avec modération).
    create: isStaffRole,
    update: isStaffRole,
    delete: isStaffRole,
  },
  fields: [
    { name: 'firstName', label: 'Prénom', type: 'text', required: true },
    { name: 'product', label: 'Produit acheté', type: 'relationship', relationTo: 'products', required: true },
    { name: 'rating', label: 'Note (1 à 5)', type: 'number', min: 1, max: 5, required: true },
    { name: 'comment', label: 'Avis', type: 'textarea', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    {
      name: 'status',
      label: 'Modération',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'En attente', value: 'pending' },
        { label: 'Publié', value: 'approved' },
        { label: 'Refusé', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'isDemo',
      label: 'Avis de démonstration',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Marque l’avis comme exemple (jamais un vrai client).' },
    },
    {
      name: 'orderNumber',
      label: 'N° de commande vérifié',
      type: 'text',
      admin: { position: 'sidebar', description: 'Pour garantir que l’avis vient d’un acheteur.' },
    },
  ],
}
