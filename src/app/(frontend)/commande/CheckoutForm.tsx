'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '@/components/CartProvider'
import { CartLineThumb } from '@/components/CartDrawer'
import { track } from '@/components/analytics'
import { formatFCFA } from '@/lib/format'
import { normalizeSenegalPhone } from '@/lib/phone'
import { METHOD_LABELS } from '@/lib/payments/labels'
import type { PaymentMethodId } from '@/lib/payments/types'
import { placeOrder, quoteAction, type QuoteResult } from '../actions/checkout'

type Zone = { id: string; name: string; kind: string; fee: number; delay: string | null; codAvailable: boolean }

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'zoneId' | 'address' | 'paymentMethod' | 'promoCode', string>>

export function CheckoutForm({ zones, freeShippingThreshold }: { zones: Zone[]; freeShippingThreshold: number | null }) {
  const router = useRouter()
  const { lines, subtotal, ready, clear } = useCart()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [note, setNote] = useState('')
  const [website, setWebsite] = useState('') // champ piège
  const [method, setMethod] = useState<PaymentMethodId | ''>('')
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState('')
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const tracked = useRef(false)

  const cartKey = useMemo(() => lines.map((l) => `${l.productId}|${l.color}|${l.size}|${l.quantity}`).join(';'), [lines])

  useEffect(() => {
    if (ready && lines.length && !tracked.current) {
      tracked.current = true
      track('InitiateCheckout', { content_ids: lines.map((l) => l.productId), value: subtotal, currency: 'XOF' })
    }
  }, [ready, lines, subtotal])

  // Récapitulatif fiable calculé par le serveur (prix, stock, frais de livraison, promotion)
  useEffect(() => {
    if (!ready || !lines.length) return
    let cancelled = false
    const handle = setTimeout(async () => {
      const res = await quoteAction(
        lines.map((l) => ({ productId: l.productId, color: l.color, size: l.size, quantity: l.quantity })),
        zoneId || null,
        appliedPromo || null,
      )
      if (cancelled) return
      if (!res.ok && res.promoError) {
        setErrors((e) => ({ ...e, promoCode: res.promoError }))
        setAppliedPromo('')
        return
      }
      setQuote(res)
      if (res.ok) {
        setGlobalError(null)
        setMethod((m) => (m && res.methods.includes(m) ? m : (res.methods[0] ?? '')))
      } else {
        setGlobalError(res.error)
      }
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cartKey, zoneId, appliedPromo])

  const zone = zones.find((z) => z.id === zoneId) ?? null
  const okQuote = quote && quote.ok ? quote : null
  const methods = okQuote?.methods ?? []

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = 'Indiquez votre nom.'
    if (!phone.trim()) e.phone = 'Indiquez votre numéro de téléphone.'
    else if (!normalizeSenegalPhone(phone)) e.phone = 'Numéro invalide. Exemple : 77 123 45 67 (indicatif +221).'
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Adresse email invalide.'
    if (!zoneId) e.zoneId = 'Choisissez votre zone de livraison.'
    if (address.trim().length < 5) e.address = 'Indiquez votre adresse ou votre quartier.'
    if (!method) e.paymentMethod = zoneId ? 'Choisissez un mode de paiement.' : 'Choisissez d’abord votre zone de livraison.'
    return e
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setGlobalError(null)
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0]
      document.getElementById(first === 'paymentMethod' ? 'payment-group' : first)?.focus()
      document.getElementById(first === 'paymentMethod' ? 'payment-group' : first)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    setSubmitting(true)
    try {
      const res = await placeOrder({
        lines: lines.map((l) => ({ productId: l.productId, color: l.color, size: l.size, quantity: l.quantity })),
        name,
        phone,
        email,
        zoneId,
        address,
        landmark,
        note,
        paymentMethod: method as PaymentMethodId,
        promoCode: appliedPromo,
        website,
      })
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {})
        setGlobalError(res.error)
        setSubmitting(false)
        return
      }
      track('OrderPlaced', { value: okQuote?.total, currency: 'XOF', transaction_id: res.orderNumber })
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl
      } else {
        clear()
        router.push(`/commande/confirmation/${res.orderNumber}?t=${res.token}`)
      }
    } catch {
      setGlobalError('Une erreur est survenue. Vérifiez votre connexion et réessayez.')
      setSubmitting(false)
    }
  }

  if (!ready) return <div className="container-eg py-24 text-center text-muted">Chargement…</div>

  if (lines.length === 0) {
    return (
      <div className="container-eg max-w-md py-24 text-center">
        <h1 className="text-[2.2rem]">Votre panier est vide</h1>
        <p className="mt-3 text-muted">Ajoutez un modèle avant de passer commande.</p>
        <Link href="/boutique" className="btn btn-primary mt-8">
          Découvrir la collection
        </Link>
      </div>
    )
  }

  const err = (k: keyof Errors) => (errors[k] ? <p id={`${k}-error`} className="field-error" role="alert">{errors[k]}</p> : null)
  const aria = (k: keyof Errors) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `${k}-error` : undefined })

  return (
    <div className="container-eg py-10 md:py-16">
      <h1 className="section-title text-[2.3rem] md:text-[3.2rem]">
        <span>Commande</span>
      </h1>

      <form onSubmit={onSubmit} noValidate className="mt-10 lg:grid lg:grid-cols-[1fr_26rem] lg:gap-16">
        <div className="space-y-12">
          {/* 1. Coordonnées */}
          <section aria-labelledby="h-contact">
            <h2 id="h-contact" className="font-serif text-[1.7rem]">
              1. Vos coordonnées
            </h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="field-label">
                  Nom et prénom *
                </label>
                <input id="name" name="name" autoComplete="name" className="field" value={name} onChange={(e) => setName(e.target.value)} {...aria('name')} />
                {err('name')}
              </div>
              <div>
                <label htmlFor="phone" className="field-label">
                  Téléphone (WhatsApp de préférence) *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center border border-r-0 border-line bg-sand/50 px-3 text-sm text-muted">+221</span>
                  <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="77 123 45 67" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} {...aria('phone')} />
                </div>
                {err('phone')}
              </div>
              <div>
                <label htmlFor="email" className="field-label">
                  Email <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input id="email" name="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} {...aria('email')} />
                {err('email')}
              </div>
            </div>
          </section>

          {/* 2. Livraison */}
          <section aria-labelledby="h-delivery">
            <h2 id="h-delivery" className="font-serif text-[1.7rem]">
              2. Livraison
            </h2>
            <div className="mt-5 grid gap-5">
              <div>
                <label htmlFor="zoneId" className="field-label">
                  Zone de livraison *
                </label>
                <select id="zoneId" name="zoneId" className="field" value={zoneId} onChange={(e) => setZoneId(e.target.value)} {...aria('zoneId')}>
                  <option value="">Choisir ma zone…</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
                {zone ? (
                  <p className="mt-2 text-sm text-muted">
                    {formatFCFA(okQuote?.deliveryFee ?? zone.fee)}
                    {zone.delay ? ` · délai ${zone.delay}` : ''}
                  </p>
                ) : null}
                {err('zoneId')}
              </div>
              <div>
                <label htmlFor="address" className="field-label">
                  Adresse / quartier *
                </label>
                <textarea id="address" name="address" rows={2} autoComplete="street-address" className="field" value={address} onChange={(e) => setAddress(e.target.value)} {...aria('address')} />
                {err('address')}
              </div>
              <div>
                <label htmlFor="landmark" className="field-label">
                  Repères pour le livreur <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input id="landmark" name="landmark" className="field" placeholder="Près de… en face de…" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="note" className="field-label">
                  Note pour la commande <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <textarea id="note" name="note" rows={2} className="field" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {/* Champ piège anti-robots : invisible pour les humains */}
              <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Ne pas remplir</label>
                <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
            </div>
          </section>

          {/* 3. Paiement */}
          <section aria-labelledby="h-payment">
            <h2 id="h-payment" className="font-serif text-[1.7rem]">
              3. Paiement
            </h2>
            <div id="payment-group" tabIndex={-1} role="radiogroup" aria-labelledby="h-payment" className="mt-5 grid gap-3">
              {!zoneId ? (
                <p className="text-sm text-muted">Choisissez votre zone de livraison pour voir les modes de paiement disponibles.</p>
              ) : methods.length === 0 && okQuote ? (
                <p className="border border-line bg-sand/50 p-4 text-sm">
                  Aucun mode de paiement n’est disponible pour cette zone pour le moment. Écrivez-nous sur WhatsApp pour passer commande.
                </p>
              ) : (
                methods.map((m) => (
                  <label key={m} className={`flex cursor-pointer items-start gap-4 border p-4 transition-colors ${method === m ? 'border-ink bg-white' : 'border-line bg-white/50 hover:border-muted'}`}>
                    <input type="radio" name="paymentMethod" value={m} checked={method === m} onChange={() => setMethod(m)} className="mt-1 h-5 w-5 accent-[#141210]" data-testid={`pay-${m}`} />
                    <span>
                      <span className="block font-medium">{METHOD_LABELS[m].label}</span>
                      <span className="block text-sm text-muted">{METHOD_LABELS[m].hint}</span>
                    </span>
                  </label>
                ))
              )}
              {err('paymentMethod')}
            </div>
          </section>
        </div>

        {/* Récapitulatif */}
        <aside className="mt-12 h-fit border border-line bg-white/60 p-6 lg:sticky lg:top-28 lg:mt-0" aria-labelledby="h-summary">
          <h2 id="h-summary" className="font-serif text-[1.6rem]">
            Votre commande
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-3 py-3">
                <div className="[&>div]:w-14">
                  <CartLineThumb src={l.image} name={l.name} />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-serif text-[1.05rem] leading-tight">{l.name}</p>
                  <p className="text-muted">
                    {l.color} · {l.size} · ×{l.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatFCFA(l.unitPrice * l.quantity)}</p>
              </li>
            ))}
          </ul>

          {/* Code promo */}
          <div className="mt-4">
            <label htmlFor="promo" className="field-label">
              Code promo
            </label>
            <div className="flex gap-2">
              <input id="promo" name="promo" className="field" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} autoComplete="off" {...aria('promoCode')} />
              <button
                type="button"
                className="btn btn-secondary !px-4"
                onClick={() => {
                  setErrors((e) => ({ ...e, promoCode: undefined }))
                  setAppliedPromo(promoInput.trim())
                }}
              >
                Appliquer
              </button>
            </div>
            {err('promoCode')}
            {okQuote?.promoMessage ? <p className="mt-2 text-sm text-[#3f6b3b]">{okQuote.promoMessage}</p> : null}
          </div>

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[0.95rem]" data-testid="totals">
            <div className="flex justify-between">
              <dt className="text-muted">Sous-total</dt>
              <dd>{formatFCFA(okQuote?.subtotal ?? subtotal)}</dd>
            </div>
            {okQuote && okQuote.discount > 0 ? (
              <div className="flex justify-between text-[#3f6b3b]">
                <dt>Réduction</dt>
                <dd>-{formatFCFA(okQuote.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted">Livraison</dt>
              <dd>{zoneId ? (okQuote ? (okQuote.deliveryFee === 0 ? 'Offerte' : formatFCFA(okQuote.deliveryFee)) : '…') : 'À choisir'}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-medium">Total</dt>
              <dd className="font-serif text-[1.7rem]" data-testid="grand-total">
                {formatFCFA(okQuote?.total ?? subtotal)}
              </dd>
            </div>
          </dl>
          {freeShippingThreshold ? (
            <p className="mt-2 text-xs text-muted">Livraison offerte dès {formatFCFA(freeShippingThreshold)} d’achats.</p>
          ) : null}

          {globalError ? (
            <p role="alert" className="mt-4 border border-[#9b2c2c]/40 bg-[#9b2c2c]/5 p-3 text-sm text-[#7a2222]">
              {globalError}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className="btn btn-primary mt-6 w-full" data-testid="place-order">
            {submitting ? 'Envoi en cours…' : method === 'cod' ? 'Confirmer la commande' : 'Payer ma commande'}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            En commandant, vous acceptez nos{' '}
            <Link href="/cgv" className="underline underline-offset-2">
              conditions générales de vente
            </Link>
            .
          </p>
        </aside>
      </form>
    </div>
  )
}
