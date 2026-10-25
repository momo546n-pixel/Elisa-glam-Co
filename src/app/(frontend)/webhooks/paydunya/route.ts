import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { paydunyaConfirm } from '@/lib/payments/paydunya'
import { findOrderByNumber, markOrderPaid, markOrderPaymentFailed } from '@/lib/orders'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Webhook (IPN) PayDunya : POST en application/x-www-form-urlencoded, champs imbriqués « data[...] ».
 * Sécurité :
 *  1. le hash SHA-512 de la clé maître doit correspondre ;
 *  2. surtout, l'état du paiement est RELU auprès de PayDunya (confirm) : le corps du webhook n'est jamais cru tel quel ;
 *  3. le montant payé doit être égal au total de la commande.
 */
export async function POST(request: Request) {
  const payload = await getPayloadClient()
  try {
    const master = process.env.PAYDUNYA_MASTER_KEY
    if (!master) return NextResponse.json({ error: 'not configured' }, { status: 503 })

    const form = new URLSearchParams(await request.text())
    const hash = form.get('data[hash]') ?? ''
    const token = form.get('data[invoice][token]') ?? ''
    const expected = createHash('sha512').update(master).digest('hex')
    const a = Buffer.from(hash)
    const b = Buffer.from(expected)
    if (!token || a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }

    const confirm = await paydunyaConfirm(token)
    const orderNumber = confirm.custom_data?.order_number
    if (!orderNumber) return NextResponse.json({ error: 'unknown order' }, { status: 400 })

    const order = await findOrderByNumber(orderNumber)
    if (!order || order.paymentReference !== token) return NextResponse.json({ error: 'order mismatch' }, { status: 404 })

    if (confirm.status === 'completed') {
      const paid = Number(confirm.invoice?.total_amount)
      if (paid !== order.total) {
        payload.logger.error(`PayDunya: montant payé ${paid} ≠ total commande ${order.total} (${orderNumber})`)
        await payload.update({
          collection: 'orders',
          id: order.id,
          overrideAccess: true,
          context: { skipOrderHooks: true },
          data: { internalNote: `ALERTE : montant payé (${paid}) différent du total (${order.total}). Vérifier avant d’expédier.` },
        })
        return NextResponse.json({ error: 'amount mismatch' }, { status: 409 })
      }
      await markOrderPaid(orderNumber, token)
    } else if (confirm.status === 'cancelled' || confirm.status === 'failed') {
      await markOrderPaymentFailed(orderNumber)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    payload.logger.error({ err }, 'Webhook PayDunya en erreur')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
