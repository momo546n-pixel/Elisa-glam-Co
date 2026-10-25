import type { MetadataRoute } from 'next'
import { getAllProducts, getCategories } from '@/lib/catalog'
import { getPayloadClient, SITE_URL } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const [products, categories, pages] = await Promise.all([
    getAllProducts(),
    getCategories(),
    payload.find({ collection: 'pages', limit: 100, depth: 0 }),
  ])

  const now = new Date()
  const fixed = ['', '/boutique', '/faq', '/guide-des-pointures', '/contact', '/suivi-commande', '/avis'].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? ('weekly' as const) : ('monthly' as const),
    priority: p === '' ? 1 : 0.7,
  }))

  return [
    ...fixed,
    ...categories.map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/boutique/${p.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...pages.docs
      .filter((p) => p.slug !== 'contact')
      .map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
