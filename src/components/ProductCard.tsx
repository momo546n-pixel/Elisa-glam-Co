import Link from 'next/link'
import type { ProductDTO } from '../lib/catalog'
import { formatFCFA } from '../lib/format'
import { SiteImage } from './SiteImage'

export function ProductCard({ product, priority = false }: { product: ProductDTO; priority?: boolean }) {
  const [first, second] = product.images
  const unavailable = product.availability === 'unavailable'
  return (
    <article className="group">
      <Link href={`/boutique/${product.slug}`} className="block" aria-label={`${product.name}, ${formatFCFA(product.currentPrice)}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          <div className={`absolute inset-0 ${unavailable ? 'opacity-60' : ''}`}>
            <SiteImage
              image={first}
              alt={product.name}
              sizes="(min-width:1024px) 22vw, (min-width:768px) 30vw, 46vw"
              priority={priority}
              className="img-zoom"
            />
            {second ? (
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <SiteImage image={second} alt="" sizes="(min-width:1024px) 22vw, (min-width:768px) 30vw, 46vw" className="img-zoom" />
              </div>
            ) : null}
          </div>
          {product.isNew && !unavailable ? (
            <span className="absolute left-3 top-3 bg-ivory/90 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink">
              Nouveau
            </span>
          ) : null}
          {unavailable ? (
            <span className="absolute left-3 top-3 bg-ivory/90 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-muted">
              Indisponible
            </span>
          ) : null}
        </div>
        <div className="px-1 pb-2 pt-4 text-center">
          <h3 className="font-serif text-[1.18rem] leading-snug md:text-[1.3rem]">{product.name}</h3>
          <span className="mx-auto my-2 block h-px w-6 bg-gold" aria-hidden="true" />
          <p className="text-[0.92rem]">
            {product.onSale ? (
              <>
                <span className="mr-2 text-muted line-through">{formatFCFA(product.price)}</span>
                <span className="font-medium text-leather">{formatFCFA(product.currentPrice)}</span>
              </>
            ) : (
              <span className="font-medium">{formatFCFA(product.currentPrice)}</span>
            )}
          </p>
          {product.availability === 'made_to_order' ? (
            <p className="mt-1 text-[0.72rem] uppercase tracking-[0.14em] text-muted">Sur commande</p>
          ) : null}
        </div>
      </Link>
    </article>
  )
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductDTO[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-14">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
