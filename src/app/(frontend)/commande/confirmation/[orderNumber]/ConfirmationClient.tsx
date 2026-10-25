'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/components/CartProvider'
import { track } from '@/components/analytics'
import { METHOD_LABELS } from '@/lib/payments/labels'
import type { PaymentMethodId } from '@/lib/payments/types'
import { retryPayment } from '../../../actions/checkout'

/** Vide le panier et envoie l'événement d'achat (Purchase uniquement si le paiement est confirmé). */
export function ConfirmationEffects({
  orderNumber,
  paid,
  cod,
  total,
  clearCart,
}: {
  orderNumber: string
  paid: boolean
  cod: boolean
  total: number
  clearCart: boolean
}) {
  const { clear, ready } = useCart()
  useEffect(() => {
    if (ready && clearCart) clear()
  }, [ready, clearCart, clear])

  useEffect(() => {
    if (!paid || cod) return
    const key = `eg-purchase-${orderNumber}`
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      /* ignoré */
    }
    track('Purchase', { value: total, currency: 'XOF', transaction_id: orderNumber })
  }, [paid, cod, orderNumber, total])

  return null
}

/** Rafraîchit la page quelques fois en attendant que le webhook confirme le paiement. */
export function PaymentPoller() {
  const router = useRouter()
  const count = useRef(0)
  useEffect(() => {
    const id = setInterval(() => {
      count.current += 1
      router.refresh()
      if (count.current >= 12) clearInterval(id)
    }, 4000)
    return () => clearInterval(id)
  }, [router])
  return null
}

export function RetryPayment({ orderNumber, token, current }: { orderNumber: string; token: string; current: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const methods: Exclude<PaymentMethodId, 'cod'>[] = ['wave', 'orange_money']

  const go = async (m: Exclude<PaymentMethodId, 'cod'>) => {
    setBusy(true)
    setError(null)
    const res = await retryPayment(orderNumber, token, m)
    if (res.ok) window.location.href = res.redirectUrl
    else {
      setError(res.error)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-md text-center">
      <p className="mb-3 text-sm text-muted">Payer à nouveau avec :</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((m) => (
          <button key={m} type="button" disabled={busy} onClick={() => go(m)} className={`btn ${m === current ? 'btn-primary' : 'btn-secondary'}`}>
            {METHOD_LABELS[m].label}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
