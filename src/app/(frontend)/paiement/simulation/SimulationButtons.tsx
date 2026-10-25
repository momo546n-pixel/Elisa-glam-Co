'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { simulatePayment } from '../../actions/checkout'

export function SimulationButtons({ orderNumber, token }: { orderNumber: string; token: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const go = async (outcome: 'success' | 'failure') => {
    setBusy(true)
    await simulatePayment(orderNumber, token, outcome)
    const suffix = outcome === 'failure' ? '&annule=1' : ''
    router.push(`/commande/confirmation/${orderNumber}?t=${token}${suffix}`)
  }

  return (
    <div className="mt-8 grid gap-3">
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => go('success')} data-testid="sim-success">
        Simuler un paiement réussi
      </button>
      <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => go('failure')} data-testid="sim-failure">
        Simuler un échec ou une annulation
      </button>
    </div>
  )
}
