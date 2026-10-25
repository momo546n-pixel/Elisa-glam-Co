import type { Metadata } from 'next'
import { getAllProducts, getCategories } from '@/lib/catalog'
import { CatalogView, parseFilters } from '@/components/CatalogView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Boutique',
  description: 'Toutes nos sandales et accessoires en cuir, faits main au Sénégal.',
  alternates: { canonical: '/boutique' },
}

export default async function BoutiquePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams)
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()])
  return (
    <CatalogView
      eyebrow="Elisa’glam&Co"
      title={filters.q ? `Recherche : « ${filters.q} »` : 'La boutique'}
      description={filters.q ? null : 'Sandales et accessoires en cuir, faits main au Sénégal.'}
      products={products}
      categories={categories}
      filters={filters}
      basePath="/boutique"
    />
  )
}
