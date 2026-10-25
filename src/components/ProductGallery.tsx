'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageDTO } from '../lib/catalog'
import { Placeholder } from './SiteImage'
import { CloseIcon, ZoomIcon } from './icons'

type Props = {
  images: ImageDTO[]
  productName: string
  /** Index d'image demandé depuis l'extérieur (changement de couleur) */
  focusIndex?: number | null
}

const isExternal = (u: string) => /^https?:\/\//.test(u)

export function ProductGallery({ images, productName, focusIndex }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState<number | null>(null)
  const count = Math.max(images.length, 1)

  const goTo = useCallback(
    (i: number) => {
      const el = scroller.current
      if (!el) return
      const target = Math.min(Math.max(i, 0), count - 1)
      el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' })
      setIndex(target)
    },
    [count],
  )

  // Changement de couleur : afficher la photo associée
  useEffect(() => {
    if (focusIndex != null && focusIndex >= 0 && focusIndex < images.length) goTo(focusIndex)
  }, [focusIndex, images.length, goTo])

  const onScroll = () => {
    const el = scroller.current
    if (!el || !el.clientWidth) return
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  // Lightbox : Échap pour fermer, flèches pour naviguer
  useEffect(() => {
    if (zoom == null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null)
      if (e.key === 'ArrowRight') setZoom((z) => (z == null ? z : Math.min(images.length - 1, z + 1)))
      if (e.key === 'ArrowLeft') setZoom((z) => (z == null ? z : Math.max(0, z - 1)))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [zoom, images.length])

  return (
    <div className={images.length > 1 ? 'lg:grid lg:grid-cols-[5.5rem_1fr] lg:gap-4' : ''}>
      {/* Vignettes (desktop) */}
      {images.length > 1 ? (
        <ul className="order-1 hidden max-h-[40rem] flex-col gap-3 overflow-y-auto lg:flex" aria-label="Photos du produit">
          {images.map((img, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Voir la photo ${i + 1}`}
                aria-current={i === index}
                className={`relative block aspect-[4/5] w-full overflow-hidden border transition-colors ${i === index ? 'border-ink' : 'border-transparent hover:border-line'}`}
              >
                <Image src={img.cardUrl} alt="" fill sizes="90px" className="object-cover" unoptimized={isExternal(img.cardUrl)} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative order-2">
        {/* Carrousel : swipe natif sur mobile */}
        <div
          ref={scroller}
          onScroll={onScroll}
          className="snap-x-hide -mx-4 flex overflow-x-auto md:mx-0"
          role="group"
          aria-roledescription="carrousel"
          aria-label={`Photos de ${productName}`}
        >
          {images.length ? (
            images.map((img, i) => (
              <div key={i} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-sand" style={{ scrollSnapStop: 'always' }}>
                <Image
                  src={img.largeUrl}
                  alt={img.alt || `${productName}, photo ${i + 1}`}
                  fill
                  sizes="(min-width:1024px) 48vw, 100vw"
                  priority={i === 0}
                  unoptimized={isExternal(img.largeUrl)}
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setZoom(i)}
                  className="absolute inset-0 cursor-zoom-in"
                  aria-label={`Agrandir la photo ${i + 1}`}
                />
              </div>
            ))
          ) : (
            <div className="relative aspect-[4/5] w-full shrink-0 bg-sand">
              <Placeholder />
            </div>
          )}
        </div>

        {images.length > 0 ? (
          <span className="pointer-events-none absolute right-3 top-3 hidden h-9 w-9 items-center justify-center bg-ivory/85 text-ink md:inline-flex" aria-hidden="true">
            <ZoomIcon size={18} />
          </span>
        ) : null}

        {/* Points (mobile) */}
        {images.length > 1 ? (
          <div className="mt-4 flex justify-center gap-2 lg:hidden" role="tablist" aria-label="Choisir une photo">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Photo ${i + 1}`}
                onClick={() => goTo(i)}
                className="flex h-6 w-6 items-center justify-center"
              >
                <span className={`block h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-ink' : 'w-1.5 bg-line'}`} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Lightbox : défilement + pincement natifs pour zoomer */}
      {zoom != null ? (
        <div className="anim-fade-in fixed inset-0 z-[70] bg-ink/95" role="dialog" aria-modal="true" aria-label="Photo agrandie">
          <button type="button" onClick={() => setZoom(null)} aria-label="Fermer" className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center bg-ivory text-ink">
            <CloseIcon size={22} />
          </button>
          <div className="h-full w-full overflow-auto" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
            <div className="relative mx-auto h-[100svh] w-full min-w-[100svh] max-w-none md:min-w-0">
              <Image src={images[zoom].largeUrl} alt={images[zoom].alt || productName} fill sizes="100vw" className="object-contain" unoptimized={isExternal(images[zoom].largeUrl)} />
            </div>
          </div>
          {images.length > 1 ? (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
              <button type="button" onClick={() => setZoom((z) => Math.max(0, (z ?? 0) - 1))} className="btn btn-light !min-h-[2.75rem] !px-5" disabled={zoom === 0}>
                Précédente
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.min(images.length - 1, (z ?? 0) + 1))} className="btn btn-light !min-h-[2.75rem] !px-5" disabled={zoom === images.length - 1}>
                Suivante
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
