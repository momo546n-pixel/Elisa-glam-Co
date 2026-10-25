'use client'

import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { CartLineThumb } from '@/components/CartDrawer'
import { MinusIcon, PlusIcon } from '@/components/icons'
import { formatFCFA } from '@/lib/format'

export function CartPageView() {
  const { lines, subtotal, ready, setQuantity, removeLine } = useCart()

  return (
    <div className="container-eg py-10 md:py-16">
      <h1 className="section-title text-[2.3rem] md:text-[3.2rem]">
        <span>Mon panier</span>
      </h1>

      {!ready ? (
        <p className="mt-16 text-center text-muted">Chargement…</p>
      ) : lines.length === 0 ? (
        <div className="mx-auto mt-14 max-w-md text-center">
          <p className="font-serif text-[1.8rem]">Votre panier est vide</p>
          <p className="mt-3 text-muted">Découvrez nos sandales et accessoires en cuir, faits main au Sénégal.</p>
          <Link href="/boutique" className="btn btn-primary mt-8">
            Découvrir la collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 lg:grid lg:grid-cols-[1fr_24rem] lg:gap-16">
          <ul className="divide-y divide-line border-y border-line" data-testid="cart-lines">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 py-6 md:gap-6">
                <div className="[&>div]:w-24 md:[&>div]:w-32">
                  <CartLineThumb src={l.image} name={l.name} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <Link href={`/boutique/${l.slug}`} className="font-serif text-[1.3rem] leading-tight hover:text-leather">
                      {l.name}
                    </Link>
                    <p className="shrink-0 font-medium">{formatFCFA(l.unitPrice * l.quantity)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {l.color} · Pointure {l.size}
                  </p>
                  <p className="text-sm text-muted">{formatFCFA(l.unitPrice)} l’unité</p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="inline-flex items-center border border-line bg-white">
                      <button type="button" aria-label="Diminuer la quantité" className="inline-flex h-11 w-11 items-center justify-center hover:bg-sand" onClick={() => setQuantity(l.key, l.quantity - 1)}>
                        <MinusIcon size={16} />
                      </button>
                      <span className="w-9 text-center" aria-live="polite">
                        {l.quantity}
                      </span>
                      <button type="button" aria-label="Augmenter la quantité" className="inline-flex h-11 w-11 items-center justify-center hover:bg-sand disabled:opacity-30" disabled={l.maxQuantity != null && l.quantity >= l.maxQuantity} onClick={() => setQuantity(l.key, l.quantity + 1)}>
                        <PlusIcon size={16} />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeLine(l.key)} className="text-sm text-muted underline underline-offset-4 hover:text-leather">
                      Retirer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="mt-10 h-fit border border-line bg-white/60 p-6 lg:sticky lg:top-28 lg:mt-0">
            <h2 className="font-serif text-[1.6rem]">Récapitulatif</h2>
            <dl className="mt-5 space-y-3 text-[0.95rem]">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total</dt>
                <dd className="font-medium">{formatFCFA(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Livraison</dt>
                <dd className="text-muted">Calculée à l’étape suivante</dd>
              </div>
            </dl>
            <Link href="/commande" className="btn btn-primary mt-6 w-full" data-testid="go-checkout">
              Passer la commande
            </Link>
            <Link href="/boutique" className="mt-4 block text-center text-sm text-leather underline underline-offset-4">
              Continuer mes achats
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}
