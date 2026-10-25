'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useCart } from './CartProvider'
import { formatFCFA } from '../lib/format'
import { CloseIcon, MinusIcon, PlusIcon } from './icons'
import { Placeholder } from './SiteImage'

export function CartLineThumb({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-sand">
      {src ? <Image src={src} alt={name} fill sizes="80px" className="object-cover" unoptimized={/^https?:/.test(src)} /> : <Placeholder label={false} />}
    </div>
  )
}

export function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, subtotal, setQuantity, removeLine, ready } = useCart()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!drawerOpen) return
    closeRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen, closeDrawer])

  if (!drawerOpen) return null

  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label="Panier">
      <div className="anim-fade-in absolute inset-0 bg-ink/50" onClick={closeDrawer} />
      <aside className="anim-drawer-right absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory text-ink shadow-2xl">
        <div className="flex h-[4.25rem] items-center justify-between border-b border-line px-5">
          <h2 className="font-serif text-2xl">Votre panier</h2>
          <button ref={closeRef} type="button" onClick={closeDrawer} aria-label="Fermer le panier" className="-mr-2 inline-flex h-11 w-11 items-center justify-center hover:text-leather">
            <CloseIcon size={24} />
          </button>
        </div>

        {!ready || lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="font-serif text-2xl">Votre panier est vide</p>
            <p className="text-sm text-muted">Découvrez nos sandales et accessoires en cuir, faits main au Sénégal.</p>
            <Link href="/boutique" onClick={closeDrawer} className="btn btn-primary">
              Découvrir la collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-5">
                  <CartLineThumb src={l.image} name={l.name} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/boutique/${l.slug}`} onClick={closeDrawer} className="font-serif text-lg leading-tight hover:text-leather">
                      {l.name}
                    </Link>
                    <p className="mt-1 text-[0.82rem] text-muted">
                      {l.color} · Pointure {l.size}
                    </p>
                    <p className="mt-1 text-sm">{formatFCFA(l.unitPrice)}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center border border-line">
                        <button type="button" aria-label="Diminuer la quantité" className="inline-flex h-10 w-10 items-center justify-center hover:bg-sand" onClick={() => setQuantity(l.key, l.quantity - 1)}>
                          <MinusIcon size={16} />
                        </button>
                        <span className="w-8 text-center text-sm" aria-live="polite">
                          {l.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Augmenter la quantité"
                          className="inline-flex h-10 w-10 items-center justify-center hover:bg-sand disabled:opacity-30"
                          disabled={l.maxQuantity != null && l.quantity >= l.maxQuantity}
                          onClick={() => setQuantity(l.key, l.quantity + 1)}
                        >
                          <PlusIcon size={16} />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeLine(l.key)} className="text-[0.8rem] text-muted underline underline-offset-4 hover:text-leather">
                        Retirer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-ivory px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm uppercase tracking-[0.16em] text-muted">Sous-total</span>
                <span className="font-serif text-2xl">{formatFCFA(subtotal)}</span>
              </div>
              <p className="mt-1 text-[0.8rem] text-muted">Frais de livraison calculés à l’étape suivante.</p>
              <div className="mt-4 grid gap-3">
                <Link href="/commande" onClick={closeDrawer} className="btn btn-primary">
                  Commander
                </Link>
                <Link href="/panier" onClick={closeDrawer} className="btn btn-secondary">
                  Voir le panier
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
