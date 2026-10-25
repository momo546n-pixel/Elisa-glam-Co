import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductBySlug, getRelatedProducts } from '@/lib/catalog'
import { getPayloadClient, getSettings, SITE_URL } from '@/lib/payload'
import { formatDate } from '@/lib/format'
import { ProductDetail } from '@/components/ProductDetail'
import { Accordion } from '@/components/Accordion'
import { ShareButtons } from '@/components/ShareButtons'
import { ProductGrid } from '@/components/ProductCard'
import { SectionTitle } from '@/components/SectionTitle'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) return {}
  const title = p.seoTitle || p.name
  const description =
    p.seoDescription ||
    p.shortDescription ||
    `${p.name} — ${p.categoryName}. Fait main au Sénégal. Livraison à Dakar et dans les régions.`
  const image = p.images[0]?.largeUrl
  return {
    title,
    description,
    alternates: { canonical: `/boutique/${p.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/boutique/${p.slug}`,
      images: image ? [{ url: image.startsWith('http') ? image : `${SITE_URL}${image}` }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const payload = await getPayloadClient()
  const [settings, related, reviewsRes] = await Promise.all([
    getSettings(),
    getRelatedProducts(product, 4),
    // Uniquement les avis réels, modérés et publiés
    payload.find({
      collection: 'reviews',
      where: { and: [{ product: { equals: Number(product.id) } }, { status: { equals: 'approved' } }] },
      sort: '-date',
      limit: 20,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const reviews = reviewsRes.docs
  const average = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0

  const paragraphs = (product.description ?? '').split(/\n{2,}/).filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.reference,
    category: product.categoryName,
    description: product.shortDescription || paragraphs[0] || undefined,
    image: product.images.map((i) => (i.largeUrl.startsWith('http') ? i.largeUrl : `${SITE_URL}${i.largeUrl}`)),
    brand: { '@type': 'Brand', name: 'Elisa’glam&Co' },
    // Note moyenne publiée seulement si des avis réels existent (jamais d'avis de démonstration)
    aggregateRating:
      reviews.length && !reviews.some((r) => r.isDemo)
        ? { '@type': 'AggregateRating', ratingValue: Number(average.toFixed(1)), reviewCount: reviews.length }
        : undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/boutique/${product.slug}`,
      priceCurrency: 'XOF',
      price: product.currentPrice,
      availability: product.availability === 'unavailable' ? 'https://schema.org/OutOfStock' : product.availability === 'made_to_order' ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
    },
  }

  const accordionItems: { title: string; content: React.ReactNode }[] = [
    product.materials ? { title: 'Matières', content: <p className="whitespace-pre-line">{product.materials}</p> } : null,
    product.care ? { title: 'Entretien', content: <p className="whitespace-pre-line">{product.care}</p> } : null,
    {
      title: 'Conseils de pointure',
      content: (
        <p>
          {product.sizeAdvice ? `${product.sizeAdvice}. ` : ''}
          Mesurez votre pied et reportez-vous à notre{' '}
          <Link href="/guide-des-pointures" className="link-underline text-leather">
            guide des pointures
          </Link>
          . Un doute ? Écrivez-nous sur WhatsApp.
        </p>
      ),
    },
    {
      title: 'Livraison',
      content: (
        <p>
          Livraison à Dakar et dans les régions du Sénégal. Frais et délais affichés avant la validation de votre commande.{' '}
          <Link href="/livraison-et-retours" className="link-underline text-leather">
            En savoir plus
          </Link>
        </p>
      ),
    },
    {
      title: 'Échanges et retours',
      content: (
        <p>
          Les conditions d’échange sont détaillées sur la page{' '}
          <Link href="/livraison-et-retours" className="link-underline text-leather">
            Livraison et retours
          </Link>
          .
        </p>
      ),
    },
  ].filter((x) => x !== null) as { title: string; content: React.ReactNode }[]

  return (
    <>
      <ProductDetail product={product} whatsappNumber={settings.whatsappNumber || null}>
        {paragraphs.length ? (
          <div className="mt-10 space-y-4 text-[0.98rem] leading-relaxed text-[#2c2723]">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : null}
        <Accordion className="mt-8" items={accordionItems} />
        <ShareButtons title={product.name} />
      </ProductDetail>

      {reviews.length ? (
        <section className="container-eg mt-20 max-w-3xl md:mt-28" aria-label="Avis clients">
          <SectionTitle eyebrow={`${average.toFixed(1).replace('.', ',')} sur 5 · ${reviews.length} avis`} title="Avis clients" />
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-6">
                <p className="text-gold" aria-label={`${r.rating} sur 5`}>
                  {'★'.repeat(r.rating)}
                  <span className="text-line">{'★'.repeat(5 - r.rating)}</span>
                </p>
                <p className="mt-2 text-[0.98rem] leading-relaxed">{r.comment}</p>
                <p className="mt-3 text-[0.8rem] text-muted">
                  {r.firstName} · {formatDate(r.date)}
                  {r.isDemo ? ' · Avis de démonstration' : ' · Achat vérifié'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section className="container-eg mt-20 md:mt-28">
          <SectionTitle eyebrow="Vous aimerez aussi" title="Modèles similaires" />
          <div className="mt-10 md:mt-14">
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
