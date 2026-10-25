import Link from 'next/link'
import type { Metadata } from 'next'
import type { Homepage, Review } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { getAllProducts, getCategories, getProductsByIds, mediaToImage, type ProductDTO } from '@/lib/catalog'
import { ProductGrid } from '@/components/ProductCard'
import { SectionTitle, SeeAll } from '@/components/SectionTitle'
import { SiteImage } from '@/components/SiteImage'
import { COMMITMENT_ICONS } from '@/components/icons'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { alternates: { canonical: '/' } }

type SectionKey = 'collections' | 'featured' | 'story' | 'new' | 'commitments' | 'bestSellers' | 'reviews'

const DEFAULT_ORDER: SectionKey[] = ['collections', 'featured', 'story', 'new', 'commitments', 'bestSellers', 'reviews']

/** Engagements par défaut : uniquement des éléments issus du cahier des charges (artisanat, Made in Senegal…). */
const DEFAULT_COMMITMENTS = [
  { icon: 'craft', title: 'Artisanat', text: 'Maroquinerie faite main, finitions soignées.' },
  { icon: 'leather', title: 'Cuir', text: 'Des modèles élégants pensés pour durer.' },
  { icon: 'senegal', title: 'Made in Senegal', text: 'Conçu et fabriqué au Sénégal.' },
  { icon: 'delivery', title: 'Livraison', text: 'Dakar et régions du Sénégal.' },
  { icon: 'exchange', title: 'Échange', text: 'Conditions d’échange détaillées dans notre page Livraison et retours.' },
] as const

export default async function HomePage() {
  const payload = await getPayloadClient()
  const [home, categories, products, reviewsRes] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', depth: 2 }),
    getCategories(),
    getAllProducts(),
    payload.find({
      collection: 'reviews',
      where: { status: { equals: 'approved' } },
      sort: '-date',
      limit: 6,
      depth: 1,
      overrideAccess: true,
    }),
  ])

  const h = home as Homepage
  const hero = mediaToImage(typeof h.heroImage === 'object' ? h.heroImage : null)
  const order: SectionKey[] = h.sectionOrder?.length ? (h.sectionOrder.map((s) => s.section) as SectionKey[]) : DEFAULT_ORDER

  const featuredIds = (h.featuredProducts ?? []).map((p) => String(typeof p === 'object' ? p.id : p))
  const featured: ProductDTO[] = featuredIds.length ? await getProductsByIds(featuredIds) : await featuredFallback(products)
  const newProducts = products.filter((p) => p.isNew).slice(0, 4)
  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 4)
  const commitments = h.commitments?.length ? h.commitments : DEFAULT_COMMITMENTS
  const reviews = reviewsRes.docs as Review[]

  const storyImage = mediaToImage(typeof h.storyImage === 'object' ? h.storyImage : null)

  const sections: Record<SectionKey, React.ReactNode> = {
    collections: categories.length ? (
      <section key="collections" className="container-eg pt-16 md:pt-24">
        <SectionTitle eyebrow="Nos univers" title="Collections" />
        <ul className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:gap-6 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/collections/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-sand">
                <SiteImage image={c.image} alt={c.name} sizes="(min-width:1024px) 22vw, 46vw" className="img-zoom" label={false} />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/5 to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 p-4 text-center md:p-6">
                  <span className="block font-serif text-[1.45rem] leading-tight text-ivory md:text-[1.8rem]">{c.name}</span>
                  <span className="mx-auto mt-2 block h-px w-8 bg-gold transition-all duration-300 group-hover:w-16" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ) : null,

    featured: featured.length ? (
      <section key="featured" className="container-eg pt-20 md:pt-28">
        <SectionTitle eyebrow="À découvrir" title={h.selectionTitle || 'La sélection'} />
        <div className="mt-10 md:mt-14">
          <ProductGrid products={featured.slice(0, 8)} />
        </div>
        <SeeAll href="/boutique">Voir toute la boutique</SeeAll>
      </section>
    ) : null,

    story: (
      <section key="story" className="mt-20 bg-sand md:mt-28">
        <div className="container-eg grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#dccfba] md:order-2">
            <SiteImage image={storyImage} alt="L’atelier Elisa’glam&Co" sizes="(min-width:768px) 40vw, 92vw" />
          </div>
          <div className="md:order-1">
            <p className="eyebrow mb-4">Depuis 2016</p>
            <h2 className="text-[2.2rem] md:text-[3rem]">{h.storyTitle || 'Notre histoire'}</h2>
            <span className="my-6 block h-px w-12 bg-gold" aria-hidden="true" />
            <p className="max-w-md whitespace-pre-line text-[1.02rem] leading-relaxed text-[#2c2723]">
              {h.storyText ||
                'Elisa’glam&Co est une marque sénégalaise de maroquinerie artisanale, créée en 2016. [À COMPLÉTER : résumé de l’histoire de la marque, de la fondatrice et de sa vision]'}
            </p>
            <Link href="/notre-histoire" className="btn btn-secondary mt-8">
              {h.storyLinkLabel || 'Découvrir notre histoire'}
            </Link>
          </div>
        </div>
      </section>
    ),

    new: newProducts.length ? (
      <section key="new" className="container-eg pt-20 md:pt-28">
        <SectionTitle eyebrow="Tout juste arrivé" title={h.newTitle || 'Nouveautés'} />
        <div className="mt-10 md:mt-14">
          <ProductGrid products={newProducts} />
        </div>
      </section>
    ) : null,

    commitments: (
      <section key="commitments" className="container-eg pt-20 md:pt-28" aria-label="Nos engagements">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 border-y border-line py-12 md:grid-cols-5 md:gap-x-8">
          {commitments.map((c, i) => {
            const Icon = COMMITMENT_ICONS[(c.icon as keyof typeof COMMITMENT_ICONS) ?? 'craft'] ?? COMMITMENT_ICONS.craft
            return (
              <li key={i} className="flex flex-col items-center text-center last:col-span-2 md:last:col-span-1">
                <Icon size={34} className="text-gold" strokeWidth={1.1} />
                <h3 className="mt-4 font-serif text-[1.3rem]">{c.title}</h3>
                {c.text ? <p className="mt-1.5 max-w-[15rem] text-[0.85rem] leading-relaxed text-muted">{c.text}</p> : null}
              </li>
            )
          })}
        </ul>
      </section>
    ),

    bestSellers: bestSellers.length ? (
      <section key="bestSellers" className="container-eg pt-20 md:pt-28">
        <SectionTitle eyebrow="Plébiscités" title={h.bestSellersTitle || 'Les plus demandées'} />
        <div className="mt-10 md:mt-14">
          <ProductGrid products={bestSellers} />
        </div>
      </section>
    ) : null,

    // Avis : uniquement ceux modérés et publiés. Aucune section tant qu'il n'y en a pas.
    reviews: reviews.length ? (
      <section key="reviews" className="container-eg pt-20 md:pt-28">
        <SectionTitle eyebrow="Ils nous font confiance" title="Avis clients" />
        <ul className="mt-10 grid gap-6 md:mt-14 md:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.id} className="border border-line bg-white/50 p-6">
              <p className="text-gold" aria-label={`${r.rating} sur 5`}>
                {'★'.repeat(r.rating)}
                <span className="text-line">{'★'.repeat(5 - r.rating)}</span>
              </p>
              <p className="mt-3 text-[0.95rem] leading-relaxed">{r.comment}</p>
              <p className="mt-4 text-[0.8rem] text-muted">
                {r.firstName} · {typeof r.product === 'object' ? r.product.name : ''} · {formatDate(r.date)}
                {r.isDemo ? ' · Avis de démonstration' : ''}
              </p>
            </li>
          ))}
        </ul>
      </section>
    ) : null,
  }

  return (
    <>
      {/* ───────── Hero plein écran ───────── */}
      <section className="relative -mt-[4.25rem] flex min-h-[100svh] items-end justify-center overflow-hidden bg-ink text-ivory md:-mt-20 md:items-center">
        {hero ? (
          <SiteImage image={hero} alt={hero.alt} variant="large" sizes="100vw" priority label={false} />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,#3a2a1d_0%,#1d1814_45%,#141210_100%)]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/60" aria-hidden="true" />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-24 pt-40 text-center md:pb-0">
          <p className="eyebrow anim-fade-up !text-[#e3c48f]">{h.heroEyebrow || 'Maroquinerie artisanale · Made in Senegal'}</p>
          <h1 className="anim-fade-up mt-5 text-[2.9rem] font-medium leading-[1.02] [animation-delay:120ms] md:text-[5rem]">
            {h.heroTitle || 'L’élégance du cuir, faite au Sénégal'}
          </h1>
          <p className="anim-fade-up mx-auto mt-5 max-w-lg text-[1rem] text-ivory/80 [animation-delay:220ms] md:text-[1.1rem]">
            {h.heroSubtitle || 'Sandales et accessoires en cuir, conçus avec exigence.'}
          </p>
          <div className="anim-fade-up mt-9 [animation-delay:320ms]">
            <Link href={h.heroCtaHref || '/boutique'} className="btn btn-light">
              {h.heroCtaLabel || 'Découvrir la collection'}
            </Link>
          </div>
        </div>
        <span className="absolute inset-x-0 bottom-6 z-10 mx-auto hidden h-10 w-px bg-gold/70 md:block" aria-hidden="true" />
      </section>

      {order.map((key) => sections[key])}
    </>
  )
}

async function featuredFallback(products: ProductDTO[]): Promise<ProductDTO[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'products',
    where: { and: [{ featured: { equals: true } }, { status: { equals: 'published' } }] },
    limit: 8,
    depth: 0,
  })
  const ids = new Set(res.docs.map((d) => String(d.id)))
  const picked = products.filter((p) => ids.has(p.id))
  return picked.length ? picked : products.slice(0, 4)
}
