import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { verifyOrderToken } from '@/lib/order-token'
import { findOrderByNumber } from '@/lib/orders'
import { formatFCFA } from '@/lib/format'
import { SimulationButtons } from './SimulationButtons'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Simulation de paiement', robots: { index: false, follow: false } }

/** Page de paiement SIMULÉE : sert uniquement à tester le tunnel en local (PAYMENT_PROVIDER=mock). */
export default async function SimulationPage({ searchParams }: { searchParams: Promise<{ o?: string; t?: string }> }) {
  if (process.env.NODE_ENV === 'production' || process.env.PAYMENT_PROVIDER !== 'mock') notFound()
  const { o, t } = await searchParams
  if (!o || !verifyOrderToken(o, t)) notFound()
  const order = await findOrderByNumber(o)
  if (!order) notFound()

  return (
    <div className="container-eg max-w-xl py-16 text-center">
      <p className="eyebrow mb-3">Mode test</p>
      <h1 className="text-[2.2rem]">Paiement simulé</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        Cette page remplace l’écran Wave / Orange Money pendant les tests. Aucun argent n’est prélevé.
      </p>
      <div className="mt-8 border border-line bg-white/60 p-6">
        <p className="text-sm text-muted">Commande {order.orderNumber}</p>
        <p className="mt-1 font-serif text-[2rem]">{formatFCFA(order.total)}</p>
      </div>
      <SimulationButtons orderNumber={order.orderNumber as string} token={t as string} />
    </div>
  )
}
