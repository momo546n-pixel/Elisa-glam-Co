import type { GlobalConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Réglages du site',
  admin: { group: 'Réglages' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Marque et contact',
          fields: [
            { name: 'brandName', label: 'Nom de la marque', type: 'text', defaultValue: 'Elisa’glam&Co' },
            {
              name: 'tagline',
              label: 'Slogan',
              type: 'text',
              admin: { description: 'Affiché sur la page d’accueil et dans les aperçus de liens.' },
            },
            {
              name: 'whatsappNumber',
              label: 'Numéro WhatsApp Business',
              type: 'text',
              admin: { description: 'Format international, ex. +221771234567. Utilisé par tous les boutons WhatsApp.' },
            },
            { name: 'phone', label: 'Téléphone', type: 'text' },
            { name: 'email', label: 'Email de contact', type: 'email' },
            { name: 'address', label: 'Adresse / atelier', type: 'textarea' },
            { name: 'openingHours', label: 'Horaires', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'instagram', label: 'Instagram (URL)', type: 'text' },
                { name: 'facebook', label: 'Facebook (URL)', type: 'text' },
                { name: 'tiktok', label: 'TikTok (URL)', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Paiement et commandes',
          fields: [
            {
              name: 'enableMobileMoney',
              label: 'Activer Wave et Orange Money',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Nécessite un compte chez le prestataire de paiement (voir docs/MAINTENANCE.md).' },
            },
            { name: 'enableCard', label: 'Activer le paiement par carte bancaire', type: 'checkbox', defaultValue: false },
            {
              name: 'enableCod',
              label: 'Activer le paiement à la livraison',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Disponible seulement dans les zones où il est autorisé.' },
            },
            {
              name: 'orderNotificationEmail',
              label: 'Email de notification des commandes',
              type: 'email',
              admin: { description: 'Reçoit un message à chaque nouvelle commande.' },
            },
            {
              name: 'freeShippingThreshold',
              label: 'Livraison offerte à partir de (FCFA)',
              type: 'number',
              min: 0,
              admin: { description: 'Laisser vide pour désactiver.' },
            },
          ],
        },
        {
          label: 'Mesure et référencement',
          fields: [
            {
              name: 'ga4Id',
              label: 'Identifiant Google Analytics 4',
              type: 'text',
              admin: { description: 'Ex. G-XXXXXXXXXX. Chargé seulement après consentement.' },
            },
            {
              name: 'metaPixelId',
              label: 'Identifiant Meta Pixel',
              type: 'text',
              admin: { description: 'Chargé seulement après consentement.' },
            },
            {
              name: 'googleSiteVerification',
              label: 'Code de vérification Google Search Console',
              type: 'text',
            },
            { name: 'defaultSeoTitle', label: 'Titre SEO par défaut', type: 'text' },
            { name: 'defaultSeoDescription', label: 'Méta-description par défaut', type: 'textarea', maxLength: 170 },
            { name: 'ogImage', label: 'Image de partage par défaut', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Avancé',
          fields: [
            {
              name: 'demoMode',
              label: 'Mode démonstration',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Affiche un avis « site de démonstration : contenus et photos fictifs ». À décocher avant la mise en ligne.',
              },
            },
            {
              name: 'defaultCurrency',
              label: 'Devise par défaut',
              type: 'text',
              defaultValue: 'XOF',
              admin: { readOnly: true, description: 'Prévu pour la phase 2 (multi-devises).' },
            },
            {
              name: 'defaultLocale',
              label: 'Langue par défaut',
              type: 'text',
              defaultValue: 'fr',
              admin: { readOnly: true, description: 'Prévu pour la phase 2 (version anglaise).' },
            },
          ],
        },
      ],
    },
  ],
}
