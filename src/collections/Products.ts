import type { CollectionConfig } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { slugify } from '../lib/format'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Produit', plural: 'Produits' },
  admin: {
    useAsTitle: 'name',
    group: 'Catalogue',
    defaultColumns: ['name', 'reference', 'category', 'price', 'status'],
    listSearchableFields: ['name', 'reference'],
  },
  access: { read: publishedOrStaff, create: isStaff, update: isStaff, delete: isStaff },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) data.slug = slugify(data.name)
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Essentiel',
          fields: [
            { name: 'name', label: 'Nom du modèle', type: 'text', required: true },
            {
              name: 'reference',
              label: 'Référence',
              type: 'text',
              required: true,
              unique: true,
              admin: { description: 'Ex. EG-SF-001. Visible sur la fiche produit.' },
            },
            {
              name: 'category',
              label: 'Collection',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
            },
            {
              name: 'shortDescription',
              label: 'Accroche (une phrase)',
              type: 'text',
              admin: { description: 'Affichée sous le nom sur la fiche produit.' },
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              admin: {
                description:
                  'Style, matières, caractéristiques, confort, occasions. Séparez les paragraphes par une ligne vide.',
              },
            },
            {
              name: 'status',
              label: 'Statut de publication',
              type: 'select',
              required: true,
              defaultValue: 'published',
              options: [
                { label: 'Publié', value: 'published' },
                { label: 'Brouillon (invisible sur le site)', value: 'draft' },
              ],
              admin: { position: 'sidebar' },
            },
            {
              name: 'slug',
              label: 'Adresse (slug)',
              type: 'text',
              unique: true,
              index: true,
              admin: { position: 'sidebar', description: 'Générée automatiquement.' },
            },
            { name: 'isNew', label: 'Afficher « Nouveau »', type: 'checkbox', admin: { position: 'sidebar' } },
            { name: 'featured', label: 'Mettre en avant (accueil)', type: 'checkbox', admin: { position: 'sidebar' } },
            { name: 'bestSeller', label: 'Meilleure vente', type: 'checkbox', admin: { position: 'sidebar' } },
            {
              name: 'isDemo',
              label: 'Fiche de démonstration',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                position: 'sidebar',
                description: 'À décocher dès que la fiche contient les vraies informations.',
              },
            },
          ],
        },
        {
          label: 'Prix',
          fields: [
            { name: 'price', label: 'Prix (FCFA)', type: 'number', required: true, min: 0 },
            {
              name: 'salePrice',
              label: 'Prix promotionnel (FCFA)',
              type: 'number',
              min: 0,
              admin: { description: 'Laisser vide s’il n’y a pas de promotion.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'saleStart',
                  label: 'Début de la promotion',
                  type: 'date',
                  admin: { date: { pickerAppearance: 'dayOnly' } },
                },
                {
                  name: 'saleEnd',
                  label: 'Fin de la promotion',
                  type: 'date',
                  admin: { date: { pickerAppearance: 'dayOnly' } },
                },
              ],
            },
          ],
        },
        {
          label: 'Photos',
          fields: [
            {
              name: 'images',
              label: 'Photos (glissez pour réordonner)',
              type: 'array',
              admin: {
                description:
                  'Face, dessus, profil, semelle, gros plans des finitions, photo portée. La première est l’image principale, la deuxième apparaît au survol.',
              },
              fields: [
                { name: 'image', label: 'Image', type: 'upload', relationTo: 'media', required: true },
                { name: 'alt', label: 'Texte alternatif (optionnel)', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Couleurs et pointures',
          fields: [
            {
              name: 'fulfillment',
              label: 'Mode de disponibilité',
              type: 'select',
              required: true,
              defaultValue: 'stock',
              options: [
                { label: 'Sur stock', value: 'stock' },
                { label: 'Sur commande (fabrication à la demande)', value: 'made_to_order' },
              ],
            },
            {
              name: 'leadTime',
              label: 'Délai de fabrication',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.fulfillment === 'made_to_order',
                description: 'Ex. « 7 à 10 jours ». Affiché sur la fiche.',
              },
            },
            {
              name: 'colors',
              label: 'Couleurs disponibles',
              type: 'array',
              admin: {
                description:
                  'Ajoutez uniquement les couleurs réellement disponibles. Pour chaque couleur, listez les pointures et le stock.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', label: 'Nom de la couleur', type: 'text', required: true },
                    {
                      name: 'hex',
                      label: 'Code couleur (pastille)',
                      type: 'text',
                      defaultValue: '#141210',
                      admin: { description: 'Ex. #141210 (noir), #7A4E2D (brun).' },
                    },
                  ],
                },
                {
                  name: 'imageIndex',
                  label: 'Photo associée (n° dans la liste, à partir de 1)',
                  type: 'number',
                  min: 1,
                  admin: {
                    description: 'Facultatif : la galerie affiche cette photo quand on choisit la couleur.',
                  },
                },
                {
                  name: 'sizes',
                  label: 'Pointures',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'size',
                          label: 'Pointure',
                          type: 'text',
                          required: true,
                          admin: { description: 'Ex. 40, 41… ou « Unique ».' },
                        },
                        { name: 'stock', label: 'Stock', type: 'number', required: true, defaultValue: 0, min: 0 },
                        { name: 'sku', label: 'SKU', type: 'text' },
                      ],
                    },
                    {
                      name: 'onRequest',
                      label: 'Disponible sur commande (ignore le stock)',
                      type: 'checkbox',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Détails',
          fields: [
            {
              name: 'materials',
              label: 'Matières',
              type: 'textarea',
              admin: { description: 'Informations vérifiées uniquement.' },
            },
            { name: 'care', label: 'Entretien', type: 'textarea' },
            {
              name: 'sizeAdvice',
              label: 'Conseil de pointure',
              type: 'text',
              admin: { description: 'À renseigner seulement si vérifié (ex. « Taille normalement »).' },
            },
            {
              name: 'relatedProducts',
              label: 'Produits complémentaires',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
            },
          ],
        },
        {
          label: 'Référencement',
          fields: [
            {
              name: 'seoTitle',
              label: 'Titre SEO',
              type: 'text',
              admin: { description: 'Par défaut : nom du modèle.' },
            },
            { name: 'seoDescription', label: 'Méta-description', type: 'textarea', maxLength: 170 },
          ],
        },
      ],
    },
  ],
}
