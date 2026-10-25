'use client'

import { useState } from 'react'
import { lookupReviewable, submitReview, type LookupResult } from '../actions/reviews'

export function ReviewForm() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [lookup, setLookup] = useState<LookupResult | null>(null)

  const [productId, setProductId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const onLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const res = await lookupReviewable(orderNumber, phone)
    setLookup(res)
    if (res.ok) setProductId(res.items.find((i) => !i.alreadyReviewed)?.productId ?? '')
    setBusy(false)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setGlobalError(null)
    const res = await submitReview({ orderNumber, phone, productId, firstName, rating, comment, website })
    if (res.ok) setDone(true)
    else {
      setErrors(res.fieldErrors ?? {})
      setGlobalError(res.error)
    }
    setBusy(false)
  }

  if (done) {
    return (
      <div role="status" className="mt-10 border border-line bg-white/60 p-8 text-center" data-testid="review-success">
        <p className="font-serif text-[1.8rem]">Merci pour votre avis !</p>
        <p className="mt-2 text-muted">Il sera publié après relecture par notre équipe.</p>
      </div>
    )
  }

  const err = (k: string) => (errors[k] ? <p className="field-error" role="alert">{errors[k]}</p> : null)

  return (
    <div>
      <form onSubmit={onLookup} className="mt-10 grid gap-5 border border-line bg-white/60 p-6 md:p-8">
        <div>
          <label htmlFor="r-order" className="field-label">Numéro de commande</label>
          <input id="r-order" className="field uppercase" placeholder="EG-261021-AB12" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required autoComplete="off" />
        </div>
        <div>
          <label htmlFor="r-phone" className="field-label">Téléphone utilisé pour la commande</label>
          <input id="r-phone" type="tel" inputMode="tel" className="field" placeholder="77 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy && !lookup ? 'Vérification…' : 'Continuer'}
        </button>
        {lookup && !lookup.ok ? (
          <p role="alert" className="text-sm text-[#7a2222]">{lookup.error}</p>
        ) : null}
      </form>

      {lookup && lookup.ok ? (
        <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5 border border-line bg-white/60 p-6 md:p-8">
          <div>
            <label htmlFor="r-product" className="field-label">Article concerné</label>
            <select id="r-product" className="field" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {lookup.items.map((i) => (
                <option key={i.productId} value={i.productId} disabled={i.alreadyReviewed}>
                  {i.label}{i.alreadyReviewed ? ' (avis déjà envoyé)' : ''}
                </option>
              ))}
            </select>
            {err('productId')}
          </div>
          <div>
            <label htmlFor="r-first" className="field-label">Votre prénom *</label>
            <input id="r-first" className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
            {err('firstName')}
          </div>
          <fieldset>
            <legend className="field-label">Votre note *</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Note sur 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                  onClick={() => setRating(n)}
                  className={`h-11 w-11 text-[1.7rem] leading-none transition-colors ${n <= rating ? 'text-gold' : 'text-line hover:text-gold/60'}`}
                >
                  ★
                </button>
              ))}
            </div>
            {err('rating')}
          </fieldset>
          <div>
            <label htmlFor="r-comment" className="field-label">Votre avis *</label>
            <textarea id="r-comment" rows={5} className="field" value={comment} onChange={(e) => setComment(e.target.value)} />
            {err('comment')}
          </div>
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="r-website">Ne pas remplir</label>
            <input id="r-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          {globalError ? <p role="alert" className="text-sm text-[#7a2222]">{globalError}</p> : null}
          <button type="submit" disabled={busy || !productId} className="btn btn-primary">
            {busy ? 'Envoi…' : 'Envoyer mon avis'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
