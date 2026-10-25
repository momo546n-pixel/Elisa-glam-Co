'use client'

import { useState } from 'react'
import { trackOrder, type TrackResult } from '../actions/checkout'
import { formatDateTime } from '@/lib/format'
import { CheckIcon } from '@/components/icons'

const STEPS = [
  { key: 'received', label: 'Reçue' },
  { key: 'confirmed', label: 'Confirmée' },
  { key: 'preparing', label: 'En préparation' },
  { key: 'shipped', label: 'Expédiée' },
  { key: 'delivered', label: 'Livrée' },
]

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Paiement en attente',
  paid: 'Payée',
  failed: 'Paiement non abouti',
  cod_pending: 'À payer à la livraison',
  refunded: 'Remboursée',
}

export function TrackForm() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<TrackResult | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setResult(await trackOrder(orderNumber, phone))
    setBusy(false)
  }

  const current = result && result.ok ? STEPS.findIndex((s) => s.key === result.status) : -1

  return (
    <div>
      <form onSubmit={submit} className="mt-10 grid gap-5 border border-line bg-white/60 p-6 md:p-8">
        <div>
          <label htmlFor="orderNumber" className="field-label">
            Numéro de commande
          </label>
          <input id="orderNumber" className="field uppercase" placeholder="EG-261021-AB12" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required autoComplete="off" />
        </div>
        <div>
          <label htmlFor="trackPhone" className="field-label">
            Téléphone
          </label>
          <input id="trackPhone" type="tel" inputMode="tel" className="field" placeholder="77 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? 'Recherche…' : 'Suivre ma commande'}
        </button>
      </form>

      <div aria-live="polite">
        {result && !result.ok ? (
          <p role="alert" className="mt-6 border border-[#9b2c2c]/40 bg-[#9b2c2c]/5 p-4 text-sm text-[#7a2222]">
            {result.error}
          </p>
        ) : null}

        {result && result.ok ? (
          <section className="mt-8 border border-line bg-white/60 p-6 md:p-8" data-testid="track-result">
            <p className="eyebrow">Commande {result.orderNumber}</p>
            <p className="mt-1 text-sm text-muted">Passée le {formatDateTime(result.createdAt)}</p>

            {result.status === 'cancelled' ? (
              <p className="mt-5 font-serif text-[1.6rem]">Commande annulée</p>
            ) : (
              <ol className="mt-6 space-y-0" aria-label="Étapes de la commande">
                {STEPS.map((s, i) => {
                  const done = i <= current
                  return (
                    <li key={s.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${done ? 'border-ink bg-ink text-ivory' : 'border-line text-transparent'}`}>
                          <CheckIcon size={14} />
                        </span>
                        {i < STEPS.length - 1 ? <span className={`h-8 w-px ${i < current ? 'bg-ink' : 'bg-line'}`} /> : null}
                      </div>
                      <p className={`pt-0.5 ${i === current ? 'font-medium' : done ? '' : 'text-muted'}`} aria-current={i === current ? 'step' : undefined}>
                        {s.label}
                      </p>
                    </li>
                  )
                })}
              </ol>
            )}

            <ul className="mt-6 divide-y divide-line border-t border-line">
              {result.items.map((i, idx) => (
                <li key={idx} className="py-2 text-sm">
                  {i.label} <span className="text-muted">×{i.quantity}</span>
                </li>
              ))}
            </ul>
            {result.status === 'delivered' ? (
              <p className="mt-4 text-sm">
                Votre commande est livrée.{' '}
                <a href="/avis" className="text-leather underline underline-offset-4">Donner mon avis</a>
              </p>
            ) : null}
            <p className="mt-4 text-sm text-muted">
              {PAYMENT_LABEL[result.paymentStatus] ?? result.paymentStatus} · Total {result.total}
              {result.zone ? ` · Livraison ${result.zone}` : ''}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  )
}
