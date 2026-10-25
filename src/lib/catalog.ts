import type { Media, Product, Category } from '../payload-types'
import { getPayloadClient } from './payload'

/* ────────────────────────────── Types publics (sérialisables) ────────────────────────────── */

export type ImageDTO = {
  url: string
  cardUrl: string
  largeUrl: string
  alt: string
  width: number | null
  height: number | null
}

export type SizeDTO = {
  size: string
  available: boolean
  /** null = non limité (sur commande) */
  stock: number | null
  onRequest: boolean
}

export type ColorDTO = {
  name: string
  hex: string
  imageIndex: number | null
  sizes: SizeDTO[]
}

export type Availability = 'in_stock' | 'made_to_order' | 'unavailable'

export type ProductDTO = {
  id: string
  slug: string
  name: string
  reference: string
  shortDescription: string | null
  description: string | null
  materials: string | null
  care: string | null
  sizeAdvice: string | null
  categoryName: string
  categorySlug: string
  price: number
  /** prix effectivement payé (promo si en cours) */
  currentPrice: number
  onSale: boolean
  images: ImageDTO[]
  colors: ColorDTO[]
  availability: Availability
  leadTime: string | null
  isNew: boolean
  bestSeller: boolean
  isDemo: boolean
  relatedIds: string[]
  seoTitle: string | null
  seoDescription: string | null
}

export type CategoryDTO = {
  id: string
  slug: string
  name: string
  description: string | null
  image: ImageDTO | null
}

/* ────────────────────────────── Conversion ────────────────────────────── */

export function mediaToImage(media: Media | number | string | null | undefined, fallbackAlt = ''): ImageDTO | null {
  if (!media || typeof media !== 'object') return null
  const url = media.url ?? ''
  if (!url) return null
  return {
    url,
    cardUrl: media.sizes?.card?.url ?? url,
    largeUrl: media.sizes?.large?.url ?? url,
    alt: media.alt || fallbackAlt,
    width: media.width ?? null,
    height: media.height ?? null,
  }
}

export function isOnSale(p: Pick<Product, 'price' | 'salePrice' | 'saleStart' | 'saleEnd'>, now = new Date()): boolean {
  if (p.salePrice == null || p.salePrice >= p.price) return false
  if (p.saleStart && new Date(p.saleStart) > now) return false
  if (p.saleEnd) {
    const end = new Date(p.saleEnd)
    end.setHours(23, 59, 59, 999)
    if (end < now) return false
  }
  return true
}

export function currentPriceOf(p: Pick<Product, 'price' | 'salePrice' | 'saleStart' | 'saleEnd'>): number {
  return isOnSale(p) ? (p.salePrice as number) : p.price
}

export function toProductDTO(p: Product): ProductDTO {
  const category = typeof p.category === 'object' ? p.category : null
  const images = (p.images ?? [])
    .map((i) => mediaToImage(i.image as Media, i.alt || p.name))
    .filter((i): i is ImageDTO => Boolean(i))

  const madeToOrder = p.fulfillment === 'made_to_order'
  const colors: ColorDTO[] = (p.colors ?? []).map((c) => ({
    name: c.name,
    hex: c.hex || '#141210',
    imageIndex: c.imageIndex ?? null,
    sizes: (c.sizes ?? []).map((s) => {
      const onRequest = Boolean(s.onRequest) || madeToOrder
      const inStock = (s.stock ?? 0) > 0
      return {
        size: s.size,
        onRequest,
        stock: onRequest ? null : (s.stock ?? 0),
        available: onRequest || inStock,
      }
    }),
  }))

  const availableSizes = colors.flatMap((c) => c.sizes).filter((s) => s.available)
  const availability: Availability = availableSizes.length === 0
    ? 'unavailable'
    : availableSizes.every((s) => s.onRequest)
      ? 'made_to_order'
      : 'in_stock'

  return {
    id: String(p.id),
    slug: p.slug ?? String(p.id),
    name: p.name,
    reference: p.reference,
    shortDescription: p.shortDescription ?? null,
    description: p.description ?? null,
    materials: p.materials ?? null,
    care: p.care ?? null,
    sizeAdvice: p.sizeAdvice ?? null,
    categoryName: category?.name ?? '',
    categorySlug: category?.slug ?? '',
    price: p.price,
    currentPrice: currentPriceOf(p),
    onSale: isOnSale(p),
    images,
    colors,
    availability,
    leadTime: p.leadTime ?? null,
    isNew: Boolean(p.isNew),
    bestSeller: Boolean(p.bestSeller),
    isDemo: Boolean(p.isDemo),
    relatedIds: (p.relatedProducts ?? []).map((r) => String(typeof r === 'object' ? r.id : r)),
    seoTitle: p.seoTitle ?? null,
    seoDescription: p.seoDescription ?? null,
  }
}

export function toCategoryDTO(c: Category): CategoryDTO {
  return {
    id: String(c.id),
    slug: c.slug ?? String(c.id),
    name: c.name,
    description: c.description ?? null,
    image: mediaToImage(c.image as Media),
  }
}

/* ────────────────────────────── Requêtes ────────────────────────────── */

export async function getCategories(): Promise<CategoryDTO[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'categories', sort: 'order', limit: 50, depth: 1 })
  return res.docs.map(toCategoryDTO)
}

export async function getAllProducts(): Promise<ProductDTO[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    sort: '-createdAt',
    limit: 500,
    depth: 2,
    pagination: false,
  })
  return res.docs.map(toProductDTO)
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'products',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ? toProductDTO(res.docs[0]) : null
}

export async function getProductsByIds(ids: string[]): Promise<ProductDTO[]> {
  if (!ids.length) return []
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'products',
    where: { and: [{ id: { in: ids } }, { status: { equals: 'published' } }] },
    limit: ids.length,
    depth: 2,
  })
  const dtos = res.docs.map(toProductDTO)
  return ids.map((id) => dtos.find((d) => d.id === id)).filter((d): d is ProductDTO => Boolean(d))
}

export async function getRelatedProducts(product: ProductDTO, limit = 4): Promise<ProductDTO[]> {
  if (product.relatedIds.length) {
    const manual = await getProductsByIds(product.relatedIds)
    if (manual.length) return manual.slice(0, limit)
  }
  const all = await getAllProducts()
  return all.filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug).slice(0, limit)
}

/* ────────────────────────────── Filtrage ────────────────────────────── */

export type CatalogFilters = {
  categorie?: string
  q?: string
  pointure?: string[]
  couleur?: string[]
  prixMax?: number
  dispo?: boolean
  tri?: 'nouveautes' | 'prix-asc' | 'prix-desc'
}

export function filterProducts(products: ProductDTO[], f: CatalogFilters): ProductDTO[] {
  let out = products.filter((p) => {
    if (f.categorie && p.categorySlug !== f.categorie) return false
    if (f.q) {
      const q = f.q.toLowerCase()
      if (!`${p.name} ${p.reference} ${p.categoryName}`.toLowerCase().includes(q)) return false
    }
    if (f.prixMax && p.currentPrice > f.prixMax) return false
    if (f.dispo && p.availability === 'unavailable') return false
    if (f.pointure?.length) {
      const ok = p.colors.some((c) => c.sizes.some((s) => s.available && f.pointure!.includes(s.size)))
      if (!ok) return false
    }
    if (f.couleur?.length) {
      const ok = p.colors.some((c) => f.couleur!.some((x) => x.toLowerCase() === c.name.toLowerCase()))
      if (!ok) return false
    }
    return true
  })
  if (f.tri === 'prix-asc') out = [...out].sort((a, b) => a.currentPrice - b.currentPrice)
  if (f.tri === 'prix-desc') out = [...out].sort((a, b) => b.currentPrice - a.currentPrice)
  return out
}

export function collectFacets(products: ProductDTO[]) {
  const sizes = new Set<string>()
  const colors = new Map<string, string>()
  let maxPrice = 0
  for (const p of products) {
    maxPrice = Math.max(maxPrice, p.currentPrice)
    for (const c of p.colors) {
      colors.set(c.name, c.hex)
      for (const s of c.sizes) sizes.add(s.size)
    }
  }
  const sortedSizes = [...sizes].sort((a, b) => {
    const na = Number(a)
    const nb = Number(b)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return a.localeCompare(b, 'fr')
  })
  return { sizes: sortedSizes, colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })), maxPrice }
}
