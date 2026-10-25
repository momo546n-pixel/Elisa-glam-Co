import type { PayloadRequest } from 'payload'

type OrderLike = {
  id: number | string
  status?: string | null
  paymentStatus?: string | null
  paymentMethod?: string | null
  stockDeducted?: boolean | null
  items?: Array<{
    product?: number | string | { id: number | string } | null
    color?: string | null
    size?: string | null
    quantity?: number | null
    madeToOrder?: boolean | null
  }> | null
}

const CONFIRMED_STATES = ['confirmed', 'preparing', 'shipped', 'delivered']

/** Faut-il que le stock soit décompté pour cette commande ? */
function shouldHoldStock(order: OrderLike): boolean {
  if (order.status === 'cancelled') return false
  if (order.paymentStatus === 'paid') return true
  // Paiement à la livraison : décompté à la confirmation manuelle.
  if (order.paymentMethod === 'cod' && CONFIRMED_STATES.includes(order.status ?? '')) return true
  return false
}

async function adjust(order: OrderLike, direction: 1 | -1, req: PayloadRequest) {
  const { payload } = req
  const byProduct = new Map<string, NonNullable<OrderLike['items']>>()
  for (const item of order.items ?? []) {
    const pid = typeof item.product === 'object' && item.product ? item.product.id : item.product
    if (pid == null) continue
    const key = String(pid)
    byProduct.set(key, [...(byProduct.get(key) ?? []), item])
  }

  for (const [pid, items] of byProduct) {
    const product = await payload.findByID({ collection: 'products', id: pid, depth: 0, req, overrideAccess: true }).catch(() => null)
    if (!product) continue
    const colors = (product.colors ?? []).map((c) => ({
      ...c,
      sizes: (c.sizes ?? []).map((s) => {
        const hit = items.filter((i) => i.color === c.name && i.size === s.size && !i.madeToOrder)
        if (!hit.length || s.onRequest) return s
        const qty = hit.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
        return { ...s, stock: Math.max(0, (s.stock ?? 0) + direction * qty) }
      }),
    }))
    await payload.update({
      collection: 'products',
      id: pid,
      data: { colors },
      req,
      overrideAccess: true,
      context: { skipOrderHooks: true },
    })
  }
}

/**
 * Applique les mouvements de stock : décrémente quand la commande devient « à honorer »,
 * restitue si elle est annulée après décrémentation.
 */
export async function applyStockChanges({ order, req }: { order: OrderLike; req: PayloadRequest }) {
  const hold = shouldHoldStock(order)
  const deducted = Boolean(order.stockDeducted)

  if (hold && !deducted) {
    await adjust(order, -1, req)
    await req.payload.update({
      collection: 'orders',
      id: order.id,
      data: { stockDeducted: true },
      req,
      overrideAccess: true,
      context: { skipOrderHooks: true },
    })
  } else if (!hold && deducted && (order.status === 'cancelled' || order.paymentStatus === 'failed' || order.paymentStatus === 'refunded')) {
    await adjust(order, 1, req)
    await req.payload.update({
      collection: 'orders',
      id: order.id,
      data: { stockDeducted: false },
      req,
      overrideAccess: true,
      context: { skipOrderHooks: true },
    })
  }
}
