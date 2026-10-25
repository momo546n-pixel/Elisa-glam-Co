import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllProducts, getCategories } from '@/lib/catalog'
import { CatalogView, parseFilters } from '@/components/CatalogView'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { slug } = await params
  const category = (await getCategories()).find((c) => c.slug === slug)
  if (!category) return {}
  return {
    title: category.name,
    description: category.description || `Découvrez notre collection « ${category.name} », faite main au Sénégal.`,
    alternates: { canonical: `/collections/${slug}` },
  }
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params
  const [categories, all] = await Promise.all([getCategories(), getAllProducts()])
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()
  const filters = parseFilters(await searchParams)
  const products = all.filter((p) => p.categorySlug === slug)
  return (
    <CatalogView
      eyebrow="Collection"
      title={category.name}
      description={category.description}
      products={products}
      categories={categories}
      filters={filters}
      basePath={`/collections/${slug}`}
      activeCategory={slug}
    />
  )
}
