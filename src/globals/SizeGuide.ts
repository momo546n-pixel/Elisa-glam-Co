import type { GlobalConfig } from 'payload'
import { anyone, isStaff } from '../access'

export const SizeGuide: GlobalConfig = {
  slug: 'size-guide',
  label: 'Guide des pointures',
  admin: { group: 'Contenus' },
  access: { read: anyone, update: isStaff },
  fields: [
    { name: 'intro', label: 'Introduction', type: 'textarea' },
    {
      name: 'rows',
      label: 'Tableau de correspondance',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'eu', label: 'EU', type: 'text', required: true },
            { name: 'uk', label: 'UK', type: 'text' },
            { name: 'us', label: 'US', type: 'text' },
            { name: 'footLengthCm', label: 'Longueur du pied (cm)', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'tips',
      label: 'Conseils pour choisir sa pointure',
      type: 'array',
      fields: [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'text', label: 'Texte', type: 'textarea', required: true },
      ],
    },
    {
      name: 'note',
      label: 'Note de bas de tableau',
      type: 'textarea',
    },
  ],
}
