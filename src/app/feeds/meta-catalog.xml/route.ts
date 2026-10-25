import { getAllProducts } from '@/lib/catalog'
import { SITE_URL } from '@/lib/payload'

export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
const abs = (u: string) => (u.startsWith('http') ? u : `${SITE_URL}${u}`)

/**
 * Flux catalogue compatible Meta (Facebook / Instagram Shops, publicités catalogue).
 * Seuls les produits ayant au moins une photo sont exportés (champ image_link obligatoire chez Meta).
 * Renseigner ce lien dans le Gestionnaire de catalogue Meta : https://votre-domaine/feeds/meta-catalog.xml
 */
export async function GET() {
  const products = (await getAllProducts()).filter((p) => p.images.length > 0 && !p.isDemo)

  const items = products
    .map((p) => {
      const availability = p.availability === 'unavailable' ? 'out of stock' : p.availability === 'made_to_order' ? 'available for order' : 'in stock'
      const desc = p.shortDescription || p.description || `${p.name} — ${p.categoryName}`
      return `    <item>
      <g:id>${esc(p.reference)}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${esc(desc.slice(0, 5000))}</g:description>
      <g:link>${SITE_URL}/boutique/${esc(p.slug)}</g:link>
      <g:image_link>${esc(abs(p.images[0].largeUrl))}</g:image_link>${p.images
        .slice(1, 10)
        .map((i) => `\n      <g:additional_image_link>${esc(abs(i.largeUrl))}</g:additional_image_link>`)
        .join('')}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${p.price} XOF</g:price>${p.onSale ? `\n      <g:sale_price>${p.currentPrice} XOF</g:sale_price>` : ''}
      <g:brand>Elisa’glam&amp;Co</g:brand>
      <g:product_type>${esc(p.categoryName)}</g:product_type>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Elisa’glam&amp;Co</title>
    <link>${SITE_URL}</link>
    <description>Catalogue Elisa’glam&amp;Co</description>
${items}
  </channel>
</rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' } })
}
