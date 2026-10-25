import type { GlobalConfig } from 'payload'
import { anyone, isStaff } from '../access'

export const Faq: GlobalConfig = {
  slug: 'faq',
  label: 'Questions fréquentes (FAQ)',
  admin: { group: 'Contenus' },
  access: { read: anyone, update: isStaff },
  fields: [
    { name: 'intro', label: 'Texte d’introduction', type: 'textarea' },
    {
      name: 'items',
      label: 'Questions',
      type: 'array',
      fields: [
        {
          name: 'category',
          label: 'Thème',
          type: 'select',
          defaultValue: 'orders',
          options: [
            { label: 'Tailles', value: 'sizes' },
            { label: 'Matières', value: 'materials' },
            { label: 'Commandes', value: 'orders' },
            { label: 'Paiement', value: 'payment' },
            { label: 'Entretien', value: 'care' },
            { label: 'Livraison', value: 'delivery' },
          ],
        },
        { name: 'question', label: 'Question', type: 'text', required: true },
        { name: 'answer', label: 'Réponse', type: 'textarea', required: true },
      ],
    },
  ],
}
