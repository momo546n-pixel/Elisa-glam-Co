import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/** Messages reçus via le formulaire de contact. */
export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Message de contact', plural: 'Messages de contact' },
  admin: { useAsTitle: 'subject', group: 'Boutique', defaultColumns: ['name', 'subject', 'phone', 'createdAt', 'handled'] },
  defaultSort: '-createdAt',
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'phone', label: 'Téléphone', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'subject', label: 'Objet', type: 'text', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: true },
    { name: 'handled', label: 'Traité', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
