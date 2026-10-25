import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isStaff } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Utilisateur', plural: 'Utilisateurs' },
  admin: { useAsTitle: 'email', defaultColumns: ['name', 'email', 'role'], group: 'Réglages' },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 60 * 60 * 12,
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isStaff,
    update: ({ req, id }) => req.user?.role === 'admin' || req.user?.id === id,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        // Le tout premier utilisateur créé est automatiquement administrateur.
        if (operation === 'create' && data) {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text' },
    {
      name: 'role',
      label: 'Rôle',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Administratrice (accès complet)', value: 'admin' },
        { label: 'Éditeur (catalogue et contenus)', value: 'editor' },
        { label: 'Client (espace visiteur)', value: 'client' },
      ],
      access: { update: isAdminField, create: isAdminField },
    },
  ],
}
