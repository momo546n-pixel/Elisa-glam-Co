import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'
import { applyStockChanges } from '../lib/stock'
import { notifyOrderCreated, notifyStatusChange } from '../lib/notify'
import { whatsappLink } from '../lib/whatsapp'

export const ORDER_STATUSES = [
  { label: 'Reçue', value: 'received' },
  { label: 'Confirmée', value: 'confirmed' },
  { label: 'En préparation', value: 'preparing' },
  { label: 'Expédiée', value: 'shipped' },
  { label: 'Livrée', value: 'delivered' },
  { label: 'Annulée', value: 'cancelled' },
] as const

export const PAYMENT_STATUSES = [
  { label: 'En attente', value: 'pending' },
  { label: 'Payée', value: 'paid' },
  { label: 'Échec / annulé', value: 'failed' },
  { label: 'À payer à la livraison', value: 'cod_pending' },
  { label: 'Remboursée', value: 'refunded' },
] as const

export const PAYMENT_METHODS = [
  { label: 'Wave', value: 'wave' },
  { label: 'Orange Money', value: 'orange_money' },
  { label: 'Carte bancaire', value: 'card' },
  { label: 'Paiement à la livraison', value: 'cod' },
] as const

function generateOrderNumber(): string {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[01OI]/g, 'X')
  return `EG-${yy}${mm}${dd}-${rand}`
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Commande', plural: 'Commandes' },
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Boutique',
    defaultColumns: ['orderNumber', 'customerName', 'total', 'status', 'paymentStatus', 'createdAt'],
    listSearchableFields: ['orderNumber', 'customerName', 'customerPhone'],
  },
  defaultSort: '-createdAt',
  // Les commandes sont créées uniquement par le serveur (tunnel de commande) et lues par l'administratrice.
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data && !data.orderNumber) data.orderNumber = generateOrderNumber()
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context?.skipOrderHooks) return doc
        // 1) Stock : décrémenté à la confirmation du paiement (ou confirmation manuelle pour le paiement à la livraison)
        await applyStockChanges({ order: doc, req })
        // 2) Notifications (email client + administratrice)
        const justPaid = previousDoc && previousDoc.paymentStatus !== 'paid' && doc.paymentStatus === 'paid'
        const codCreated = operation === 'create' && doc.paymentMethod === 'cod'
        if (codCreated || justPaid) {
          // Paiement à la livraison : à la création. Paiement en ligne : à la confirmation du paiement.
          await notifyOrderCreated(doc, req.payload).catch((e) =>
            req.payload.logger.error({ err: e }, 'Notification de nouvelle commande impossible'),
          )
        } else if (operation === 'update' && previousDoc && previousDoc.status !== doc.status) {
          await notifyStatusChange(doc, req.payload).catch((e) =>
            req.payload.logger.error({ err: e }, 'Notification de changement de statut impossible'),
          )
        }
        return doc
      },
    ],
    afterRead: [
      ({ doc }) => {
        if (doc?.customerPhone && doc?.orderNumber) {
          doc.whatsappLink = whatsappLink(
            doc.customerPhone,
            `Bonjour ${doc.customerName ?? ''}, c’est Elisa’glam&Co au sujet de votre commande ${doc.orderNumber}.`,
          )
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'orderNumber',
          label: 'N° de commande',
          type: 'text',
          unique: true,
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'status',
          label: 'Statut de la commande',
          type: 'select',
          required: true,
          defaultValue: 'received',
          options: [...ORDER_STATUSES],
          admin: { description: 'Changer le statut envoie un email au client (si renseigné).' },
        },
        {
          name: 'paymentStatus',
          label: 'Statut du paiement',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [...PAYMENT_STATUSES],
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Client et livraison',
          fields: [
            { name: 'customerName', label: 'Nom', type: 'text', required: true },
            { name: 'customerPhone', label: 'Téléphone', type: 'text', required: true, index: true },
            { name: 'customerEmail', label: 'Email', type: 'email' },
            {
              name: 'whatsappLink',
              label: 'Lien WhatsApp pour contacter le client',
              type: 'text',
              virtual: true,
              admin: { readOnly: true },
            },
            { name: 'deliveryZone', label: 'Zone de livraison', type: 'relationship', relationTo: 'delivery-zones' },
            { name: 'deliveryZoneName', label: 'Nom de la zone (au moment de la commande)', type: 'text' },
            { name: 'address', label: 'Adresse / quartier', type: 'textarea', required: true },
            { name: 'landmark', label: 'Repères pour le livreur', type: 'text' },
            { name: 'customerNote', label: 'Note du client', type: 'textarea' },
          ],
        },
        {
          label: 'Articles',
          fields: [
            {
              name: 'items',
              label: 'Articles commandés',
              type: 'array',
              required: true,
              admin: { readOnly: true },
              fields: [
                { name: 'product', type: 'relationship', relationTo: 'products', label: 'Produit' },
                { name: 'productName', type: 'text', label: 'Nom' },
                { name: 'reference', type: 'text', label: 'Référence' },
                { name: 'color', type: 'text', label: 'Couleur' },
                { name: 'size', type: 'text', label: 'Pointure' },
                { name: 'unitPrice', type: 'number', label: 'Prix unitaire (FCFA)' },
                { name: 'quantity', type: 'number', label: 'Quantité' },
                { name: 'madeToOrder', type: 'checkbox', label: 'Sur commande' },
              ],
            },
          ],
        },
        {
          label: 'Montants et paiement',
          fields: [
            { name: 'subtotal', label: 'Sous-total (FCFA)', type: 'number', required: true },
            { name: 'discount', label: 'Réduction (FCFA)', type: 'number', defaultValue: 0 },
            { name: 'promoCode', label: 'Code promo', type: 'text' },
            { name: 'deliveryFee', label: 'Frais de livraison (FCFA)', type: 'number', defaultValue: 0 },
            { name: 'total', label: 'Total (FCFA)', type: 'number', required: true },
            {
              name: 'paymentMethod',
              label: 'Mode de paiement',
              type: 'select',
              required: true,
              options: [...PAYMENT_METHODS],
            },
            { name: 'paymentProvider', label: 'Prestataire', type: 'text', admin: { readOnly: true } },
            { name: 'paymentReference', label: 'Référence de paiement', type: 'text', admin: { readOnly: true } },
            {
              type: 'row',
              fields: [
                { name: 'currency', label: 'Devise', type: 'text', defaultValue: 'XOF', admin: { readOnly: true } },
                { name: 'locale', label: 'Langue', type: 'text', defaultValue: 'fr', admin: { readOnly: true } },
              ],
            },
          ],
        },
        {
          label: 'Suivi interne',
          fields: [
            {
              name: 'whatsappConfirmed',
              label: 'Confirmée avec le client (WhatsApp / appel)',
              type: 'checkbox',
              admin: {
                description:
                  'Pour le paiement à la livraison : à cocher après avoir confirmé la commande avec le client, avant la préparation.',
              },
            },
            { name: 'internalNote', label: 'Note interne', type: 'textarea' },
            {
              name: 'stockDeducted',
              label: 'Stock déjà décrémenté',
              type: 'checkbox',
              defaultValue: false,
              admin: { readOnly: true },
            },
          ],
        },
      ],
    },
  ],
}
