import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/payload'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/panier', '/commande', '/paiement', '/webhooks', '/suivi-commande'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
