import type { Metadata } from 'next'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { CheckoutForm } from './CheckoutForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Commande', robots: { index: false, follow: false } }

export default async function CheckoutPage() {
  const payload = await getPayloadClient()
  const [zonesRes, settings] = await Promise.all([
    payload.find({
      collection: 'delivery-zones',
      where: { and: [{ active: { equals: true } }, { kind: { not_equals: 'international' } }] },
      sort: 'order',
      limit: 100,
      depth: 0,
    }),
    getSettings(),
  ])

  const zones = zonesRes.docs.map((z) => ({
    id: String(z.id),
    name: z.name,
    kind: z.kind,
    fee: z.fee,
    delay: z.delay ?? null,
    codAvailable: Boolean(z.codAvailable),
  }))

  return <CheckoutForm zones={zones} freeShippingThreshold={settings.freeShippingThreshold ?? null} />
}
