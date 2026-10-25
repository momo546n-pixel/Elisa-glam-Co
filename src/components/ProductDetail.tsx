'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProductDTO } from '../lib/catalog'
import { formatFCFA } from '../lib/format'
import { useCart } from './CartProvider'
import { ProductGallery } from './ProductGallery'
import { track } from './analytics'
import { MinusIcon, PlusIcon, WhatsAppIcon } from './icons'

type Props = {
  product: ProductDTO
  /** Numéro WhatsApp de la marque (format international) ou null */
  whatsappNumber: string | null
  children?: React.ReactNode
}

export function ProductDetail({ product, whatsappNumber, children }: Props) {
  const router = useRouter()
  const { addLine, openDrawer } = useCart()

  const firstColor = useMemo(
    () => product.colors.find((c) => c.sizes.some((s) => s.available)) ?? product.colors[0],
    [product.colors],
  )
  // Pointure unique disponible (ex. sacs, ceintures) : présélectionnée pour un ajout en un clic
  const preselectSize = (c: Props['product']['colors'][number] | undefined): string | null => {
    const available = c?.sizes.filter((s) => s.available) ?? []
    return available.length === 1 ? (available[0]?.size ?? null) : null
  }
  const [colorName, setColorName] = useState<string | undefined>(firstColor?.name)
  const [size, setSize] = useState<string | null>(() => preselectSize(firstColor))
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [pageUrl, setPageUrl] = useState('')
  const sizeRef = useRef<HTMLDivElement>(null)

  const color = product.colors.find((c) => c.name === colorName) ?? firstColor
  const sizeInfo = color?.sizes.find((s) => s.size === size)
  const maxQty = sizeInfo?.stock ?? null // null = illimité (sur commande)
  const unavailable = product.availability === 'unavailable'

  useEffect(() => setPageUrl(window.location.href), [])

  useEffect(() => {
    track('ViewContent', { content_ids: [product.id], content_name: product.name, value: product.currentPrice, currency: 'XOF' })
  }, [product.id, product.name, product.currentPrice])

  // La barre d'achat collante (mobile) réserve de l'espace en bas de page
  useEffect(() => {
    document.body.dataset.stickyCta = 'true'
    return () => {
      delete document.body.dataset.stickyCta
    }
  }, [])

  const selectColor = (name: string) => {
    setColorName(name)
    setSize(preselectSize(product.colors.find((c) => c.name === name)))
    setQty(1)
    setError(null)
  }

  const validate = (): boolean => {
    if (!color) return false
    if (!size || !sizeInfo || !sizeInfo.available) {
      setError('Veuillez choisir votre pointure.')
      sizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    setError(null)
    return true
  }

  const doAdd = (): boolean => {
    if (!validate() || !color || !size) return false
    addLine(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        reference: product.reference,
        color: color.name,
        size,
        unitPrice: product.currentPrice,
        maxQuantity: maxQty,
        image: product.images[0]?.cardUrl ?? null,
      },
      qty,
    )
    return true
  }

  const onAdd = () => {
    if (doAdd()) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
      openDrawer()
    }
  }
  const onBuyNow = () => {
    if (doAdd()) router.push('/commande')
  }

  const waHref = () => {
    if (!whatsappNumber) return '#'
    const url = pageUrl
    const parts = [`Bonjour, je souhaite des informations sur « ${product.name} »`]
    if (size) parts.push(`(pointure ${size}${color ? `, ${color.name}` : ''})`)
    return `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`${parts.join(' ')} : ${url}`)}`
  }

  const statusText = (() => {
    if (unavailable) return { text: 'Actuellement indisponible', tone: 'muted' as const }
    if (sizeInfo?.onRequest || product.availability === 'made_to_order')
      return { text: `Sur commande${product.leadTime ? ` · délai ${product.leadTime}` : ''}`, tone: 'leather' as const }
    if (sizeInfo && sizeInfo.stock != null && sizeInfo.stock > 0 && sizeInfo.stock <= 3)
      return { text: `Plus que ${sizeInfo.stock} en stock`, tone: 'leather' as const }
    return { text: 'En stock', tone: 'ok' as const }
  })()

  return (
    <div className="container-eg pb-4 pt-6 md:pt-12">
      <div className="lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-16 xl:gap-24">
        <ProductGallery images={product.images} productName={product.name} focusIndex={color?.imageIndex ? color.imageIndex - 1 : null} />

        <div className="mt-8 lg:sticky lg:top-28 lg:mt-0 lg:self-start">
          <nav aria-label="Fil d’Ariane" className="text-[0.75rem] uppercase tracking-[0.16em] text-muted">
            <Link href="/boutique" className="hover:text-leather">
              Boutique
            </Link>
            {product.categoryName ? (
              <>
                <span aria-hidden="true"> / </span>
                <Link href={`/collections/${product.categorySlug}`} className="hover:text-leather">
                  {product.categoryName}
                </Link>
              </>
            ) : null}
          </nav>

          <h1 className="mt-4 text-[2.3rem] leading-[1.05] md:text-[3rem]">{product.name}</h1>
          {product.shortDescription ? <p className="mt-3 text-[1rem] text-muted">{product.shortDescription}</p> : null}
          <p className="mt-1 text-[0.78rem] uppercase tracking-[0.14em] text-muted">Réf. {product.reference}</p>

          <p className="mt-5 flex items-baseline gap-3 text-[1.35rem]">
            {product.onSale ? (
              <>
                <span className="font-medium text-leather">{formatFCFA(product.currentPrice)}</span>
                <span className="text-[1.05rem] text-muted line-through">{formatFCFA(product.price)}</span>
              </>
            ) : (
              <span className="font-medium">{formatFCFA(product.currentPrice)}</span>
            )}
          </p>

          {product.isDemo ? (
            <p className="mt-4 border border-gold/50 bg-sand/60 px-3 py-2 text-[0.8rem] text-leather">
              Fiche de démonstration : produit, prix et photo d’illustration fictifs.
            </p>
          ) : null}

          {/* Couleurs */}
          {product.colors.length > 0 ? (
            <div className="mt-8">
              <p className="field-label !mb-3">
                Couleur : <span className="font-normal text-muted">{color?.name}</span>
              </p>
              <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Couleur">
                {product.colors.map((c) => {
                  const selected = c.name === color?.name
                  return (
                    <button
                      key={c.name}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={c.name}
                      title={c.name}
                      onClick={() => selectColor(c.name)}
                      className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-all ${selected ? 'border-ink' : 'border-line hover:border-muted'}`}
                    >
                      <span className="h-8 w-8 rounded-full border border-black/10" style={{ background: c.hex }} />
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Pointures */}
          {color ? (
            <div className="mt-8" ref={sizeRef}>
              <div className="mb-3 flex items-center justify-between">
                <p className="field-label !mb-0" id="size-label">
                  Pointure{size ? <span className="font-normal text-muted"> : {size}</span> : null}
                </p>
                <Link href="/guide-des-pointures" className="link-underline text-[0.8rem] text-leather" target="_blank">
                  Guide des pointures
                </Link>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-6" role="radiogroup" aria-labelledby="size-label">
                {color.sizes.map((s) => {
                  const selected = s.size === size
                  return (
                    <button
                      key={s.size}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-disabled={!s.available}
                      disabled={!s.available}
                      aria-label={`Pointure ${s.size}${s.available ? '' : ', indisponible'}`}
                      onClick={() => {
                        setSize(s.size)
                        setQty(1)
                        setError(null)
                      }}
                      className={`relative flex h-12 items-center justify-center border text-[0.95rem] transition-colors ${
                        !s.available
                          ? 'cursor-not-allowed border-line bg-sand/40 text-muted/60 line-through'
                          : selected
                            ? 'border-ink bg-ink text-ivory'
                            : 'border-line bg-white hover:border-ink'
                      }`}
                    >
                      {s.size}
                    </button>
                  )
                })}
              </div>
              {error ? (
                <p role="alert" className="field-error">
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Disponibilité */}
          <p className={`mt-5 flex items-center gap-2 text-[0.9rem] ${statusText.tone === 'muted' ? 'text-muted' : statusText.tone === 'leather' ? 'text-leather' : 'text-[#3f6b3b]'}`}>
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${statusText.tone === 'muted' ? 'bg-muted' : statusText.tone === 'leather' ? 'bg-leather' : 'bg-[#4d7a4a]'}`} />
            {statusText.text}
          </p>

          {/* Quantité + boutons */}
          {!unavailable ? (
            <div className="mt-7 grid gap-3">
              <div className="flex items-center gap-4">
                <span className="field-label !mb-0">Quantité</span>
                <div className="inline-flex items-center border border-line bg-white">
                  <button type="button" aria-label="Diminuer la quantité" className="inline-flex h-11 w-11 items-center justify-center hover:bg-sand disabled:opacity-30" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <MinusIcon size={16} />
                  </button>
                  <span className="w-10 text-center" aria-live="polite">
                    {qty}
                  </span>
                  <button type="button" aria-label="Augmenter la quantité" className="inline-flex h-11 w-11 items-center justify-center hover:bg-sand disabled:opacity-30" disabled={maxQty != null && qty >= maxQty} onClick={() => setQty((q) => q + 1)}>
                    <PlusIcon size={16} />
                  </button>
                </div>
              </div>
              <button type="button" onClick={onAdd} className="btn btn-primary w-full" data-testid="add-to-cart">
                {added ? 'Ajouté ✓' : 'Ajouter au panier'}
              </button>
              <button type="button" onClick={onBuyNow} className="btn btn-secondary w-full" data-testid="buy-now">
                Acheter maintenant
              </button>
            </div>
          ) : (
            <div className="mt-7">
              <a href={waHref()} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
                Demander la disponibilité sur WhatsApp
              </a>
            </div>
          )}

          {whatsappNumber ? (
            <a
              href={waHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-[3rem] items-center justify-center gap-2 text-[0.92rem] text-leather hover:text-ink"
            >
              <WhatsAppIcon size={20} />
              <span className="link-underline">Une question sur ce modèle ?</span>
            </a>
          ) : null}

          {children}
        </div>
      </div>

      {/* Barre d'achat collante (mobile) */}
      {!unavailable ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 shadow-[0_-6px_24px_rgba(20,18,16,0.08)] backdrop-blur lg:hidden" data-testid="sticky-bar">
          <div className="mx-auto flex max-w-xl items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-[0.78rem] text-muted">{product.name}</p>
              <p className="font-medium">{formatFCFA(product.currentPrice)}</p>
            </div>
            <button type="button" onClick={onAdd} className="btn btn-primary ml-auto shrink-0 !px-5">
              {size ? 'Ajouter au panier' : 'Choisir ma pointure'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
