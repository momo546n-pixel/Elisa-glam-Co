import Link from 'next/link'
import type { CatalogFilters, CategoryDTO, ProductDTO } from '../lib/catalog'
import { collectFacets, filterProducts } from '../lib/catalog'
import { formatFCFA } from '../lib/format'
import { ProductGrid } from './ProductCard'
import { ChevronDown } from './icons'

type Props = {
  title: string
  description?: string | null
  eyebrow?: string
  products: ProductDTO[]
  categories: CategoryDTO[]
  filters: CatalogFilters
  /** Chemin du formulaire de filtres (ex. /boutique) */
  basePath: string
  activeCategory?: string
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const arr = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]).filter(Boolean)
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined
  const tri = one(sp.tri)
  const prix = Number(one(sp.prixMax))
  return {
    categorie: one(sp.categorie),
    q: one(sp.q)?.slice(0, 80),
    pointure: arr(sp.pointure),
    couleur: arr(sp.couleur),
    prixMax: Number.isFinite(prix) && prix > 0 ? prix : undefined,
    dispo: one(sp.dispo) === '1',
    tri: tri === 'prix-asc' || tri === 'prix-desc' || tri === 'nouveautes' ? tri : undefined,
  }
}

export function CatalogView({ title, description, eyebrow, products, categories, filters, basePath, activeCategory }: Props) {
  const facets = collectFacets(products)
  const results = filterProducts(products, filters)
  const activeCount =
    (filters.pointure?.length ?? 0) + (filters.couleur?.length ?? 0) + (filters.prixMax ? 1 : 0) + (filters.dispo ? 1 : 0)

  // Paliers de prix : pas de 5 000 FCFA jusqu'au prix maximum du catalogue
  const step = 5000
  const priceSteps: number[] = []
  for (let v = step; v < facets.maxPrice + step; v += step) priceSteps.push(v)

  const chip = (active: boolean) =>
    `inline-flex min-h-[2.5rem] items-center whitespace-nowrap border px-4 text-[0.78rem] uppercase tracking-[0.14em] transition-colors ${
      active ? 'border-ink bg-ink text-ivory' : 'border-line text-ink hover:border-ink'
    }`

  return (
    <div className="container-eg pb-8 pt-10 md:pt-16">
      <header className="text-center">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="section-title text-[2.3rem] md:text-[3.2rem]">
          <span>{title}</span>
        </h1>
        {description ? <p className="mx-auto mt-4 max-w-xl text-[0.98rem] text-muted">{description}</p> : null}
      </header>

      {/* Collections */}
      <nav aria-label="Collections" className="snap-x-hide -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:justify-center md:px-0">
        <Link href="/boutique" className={chip(!activeCategory)} aria-current={!activeCategory ? 'page' : undefined}>
          Tout
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/collections/${c.slug}`} className={chip(activeCategory === c.slug)} aria-current={activeCategory === c.slug ? 'page' : undefined}>
            {c.name}
          </Link>
        ))}
      </nav>

      {/* Filtres et tri : formulaire GET (fonctionne sans JavaScript) */}
      <form method="get" action={basePath} className="mt-8 border-y border-line" aria-label="Filtrer et trier">
        {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
        <details className="group/filters" open={activeCount > 0 || undefined}>
          <summary className="flex min-h-[3.25rem] cursor-pointer list-none items-center justify-between text-[0.78rem] font-medium uppercase tracking-[0.16em]">
            <span>
              Filtrer et trier{activeCount > 0 ? ` (${activeCount})` : ''}
            </span>
            <span className="flex items-center gap-4">
              <span className="font-normal normal-case tracking-normal text-muted">
                {results.length} modèle{results.length > 1 ? 's' : ''}
              </span>
              <ChevronDown size={18} className="transition-transform group-open/filters:rotate-180" />
            </span>
          </summary>

          <div className="grid gap-8 pb-8 pt-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="tri" className="field-label">
                Trier par
              </label>
              <select id="tri" name="tri" defaultValue={filters.tri ?? ''} className="field">
                <option value="">Sélection</option>
                <option value="nouveautes">Nouveautés</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix décroissant</option>
              </select>

              {priceSteps.length > 1 ? (
                <div className="mt-5">
                  <label htmlFor="prixMax" className="field-label">
                    Prix maximum
                  </label>
                  <select id="prixMax" name="prixMax" defaultValue={filters.prixMax ? String(filters.prixMax) : ''} className="field">
                    <option value="">Tous les prix</option>
                    {priceSteps.map((p) => (
                      <option key={p} value={p}>
                        Jusqu’à {formatFCFA(p)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <label className="mt-5 flex min-h-[2.5rem] items-center gap-3 text-sm">
                <input type="checkbox" name="dispo" value="1" defaultChecked={filters.dispo} className="h-5 w-5 accent-[#141210]" />
                Uniquement les modèles disponibles
              </label>
            </div>

            {facets.sizes.length ? (
              <fieldset>
                <legend className="field-label">Pointure</legend>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {facets.sizes.map((s) => (
                    <label key={s} className="relative">
                      <input type="checkbox" name="pointure" value={s} defaultChecked={filters.pointure?.includes(s)} className="peer sr-only" />
                      <span className="flex h-10 items-center justify-center border border-line text-sm transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leather">
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {facets.colors.length ? (
              <fieldset>
                <legend className="field-label">Couleur</legend>
                <div className="mt-2 flex flex-col gap-1">
                  {facets.colors.map((c) => (
                    <label key={c.name} className="flex min-h-[2.5rem] items-center gap-3 text-sm">
                      <input type="checkbox" name="couleur" value={c.name} defaultChecked={filters.couleur?.some((x) => x.toLowerCase() === c.name.toLowerCase())} className="h-5 w-5 accent-[#141210]" />
                      <span className="h-4 w-4 rounded-full border border-line" style={{ background: c.hex }} aria-hidden="true" />
                      {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <div className="flex items-end gap-3 md:col-span-2 lg:col-span-1">
              <button type="submit" className="btn btn-primary flex-1">
                Appliquer
              </button>
              <Link href={basePath} className="btn btn-secondary flex-1">
                Réinitialiser
              </Link>
            </div>
          </div>
        </details>
      </form>

      <div className="mt-10 md:mt-14">
        {results.length ? (
          <ProductGrid products={results} priorityCount={4} />
        ) : (
          <div className="py-16 text-center">
            <p className="font-serif text-[1.8rem]">Aucun modèle ne correspond</p>
            <p className="mt-2 text-muted">Modifiez vos filtres ou découvrez toute la collection.</p>
            <Link href="/boutique" className="btn btn-primary mt-6">
              Voir toute la boutique
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
