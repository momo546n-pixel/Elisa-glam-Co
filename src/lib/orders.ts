import type { Order, DeliveryZone, PromoCode } from '../payload-types'
import { currentPriceOf } from './catalog'
import { getPayloadClient, getSettings } from './payload'

export type CartInputLine = { productId: string; color: string; size: string; quantity: number }

export type QuoteItem = {
  product: number
  productName: string
  reference: string
  color: string
  size: string
  unitPrice: number
  quantity: number
  madeToOrder: boolean
}

export type Quote =
  | {
      ok: true
      items: QuoteItem[]
      subtotal: number
      discount: number
      promoCode: string | null
      promoMessage: string | null
      deliveryFee: number
      total: number
      zone: DeliveryZone | null
    }
  | { ok: false; error: string; promoError?: string }

/**
 * Calcule le panier de façon FIABLE côté serveur : prix, stock, zone, promotion.
 * Les montants envoyés par le navigateur ne sont jamais utilisés.
 */
export async function quoteOrder(lines: CartInputLine[], zoneId: string | null, promoInput: string | null): Promise<Quote> {
  if (!lines.length) return { ok: false, error: 'Votre panier est vide.' }
  const payload = await getPayloadClient()
  const settings = await getSettings()

  // 1. Articles
  const items: QuoteItem[] = []
  for (const line of lines) {
    const qty = Math.floor(line.quantity)
    if (!Number.isFinite(qty) || qty < 1 || qty > 20) return { ok: false, error: 'Quantité invalide.' }
    const product = await payload
      .findByID({ collection: 'products', id: line.productId, depth: 0, overrideAccess: true })
      .catch(() => null)
    if (!product || product.status !== 'published') {
      return { ok: false, error: 'Un article de votre panier n’est plus disponible. Veuillez le retirer.' }
    }
    const color = (product.colors ?? []).find((c) => c.name === line.color)
    const size = color?.sizes?.find((s) => s.size === line.size)
    if (!color || !size) {
      return { ok: false, error: `Le modèle « ${product.name} » n’existe plus dans cette couleur ou cette pointure.` }
    }
    const madeToOrder = Boolean(size.onRequest) || product.fulfillment === 'made_to_order'
    if (!madeToOrder) {
      const same = items.filter((i) => i.product === product.id && i.color === line.color && i.size === line.size)
      const alreadyInCart = same.reduce((n, i) => n + i.quantity, 0)
      if ((size.stock ?? 0) < qty + alreadyInCart) {
        return {
          ok: false,
          error:
            (size.stock ?? 0) <= 0
              ? `« ${product.name} » (${line.color}, pointure ${line.size}) est épuisé. Veuillez le retirer de votre panier.`
              : `Il ne reste que ${size.stock} exemplaire(s) de « ${product.name} » (${line.color}, pointure ${line.size}).`,
        }
      }
    }
    items.push({
      product: product.id as number,
      productName: product.name,
      reference: product.reference,
      color: line.color,
      size: line.size,
      unitPrice: currentPriceOf(product),
      quantity: qty,
      madeToOrder,
    })
  }
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0)

  // 2. Promotion
  let discount = 0
  let promoCode: string | null = null
  let promoMessage: string | null = null
  const code = promoInput?.trim().toUpperCase()
  if (code) {
    const found = await payload.find({ collection: 'promo-codes', where: { code: { equals: code } }, limit: 1, overrideAccess: true })
    const promo = found.docs[0] as PromoCode | undefined
    const now = new Date()
    let reason: string | null = null
    if (!promo || !promo.active) reason = 'Ce code promo n’est pas valide.'
    else if (promo.expiresAt && new Date(new Date(promo.expiresAt).setHours(23, 59, 59, 999)) < now) reason = 'Ce code promo a expiré.'
    else if (promo.maxUses && (promo.usedCount ?? 0) >= promo.maxUses) reason = 'Ce code promo a atteint son nombre maximal d’utilisations.'
    else if (promo.minSubtotal && subtotal < promo.minSubtotal) reason = `Ce code est valable à partir de ${promo.minSubtotal.toLocaleString('fr-FR')} FCFA d’achats.`
    if (reason) return { ok: false, error: reason, promoError: reason }
    discount = promo!.type === 'percent' ? Math.floor((subtotal * promo!.value) / 100) : Math.min(promo!.value, subtotal)
    promoCode = promo!.code
    promoMessage = promo!.type === 'percent' ? `Code ${promo!.code} : -${promo!.value} %` : `Code ${promo!.code} appliqué`
  }

  // 3. Livraison
  let zone: DeliveryZone | null = null
  let deliveryFee = 0
  if (zoneId) {
    zone = (await payload.findByID({ collection: 'delivery-zones', id: zoneId, depth: 0, overrideAccess: true }).catch(() => null)) as DeliveryZone | null
    if (!zone || !zone.active || zone.kind === 'international') return { ok: false, error: 'Cette zone de livraison n’est pas disponible.' }
    deliveryFee = zone.fee
    if (settings.freeShippingThreshold && subtotal - discount >= settings.freeShippingThreshold) deliveryFee = 0
  }

  return {
    ok: true,
    items,
    subtotal,
    discount,
    promoCode,
    promoMessage,
    deliveryFee,
    total: Math.max(0, subtotal - discount + deliveryFee),
    zone,
  }
}

export async function findOrderByNumber(orderNumber: string): Promise<Order | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'orders', where: { orderNumber: { equals: orderNumber } }, limit: 1, depth: 0, overrideAccess: true })
  return (res.docs[0] as Order) ?? null
}

/** Marque une commande comme payée (idempotent). Déclenche décompte du stock et notifications via les hooks. */
export async function markOrderPaid(orderNumber: string, reference?: string) {
  const order = await findOrderByNumber(orderNumber)
  if (!order || order.paymentStatus === 'paid') return order
  const payload = await getPayloadClient()
  return payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      paymentStatus: 'paid',
      status: order.status === 'received' ? 'confirmed' : order.status,
      paymentReference: reference ?? order.paymentReference,
    },
    overrideAccess: true,
  })
}

export async function markOrderPaymentFailed(orderNumber: string) {
  const order = await findOrderByNumber(orderNumber)
  if (!order || order.paymentStatus !== 'pending') return order
  const payload = await getPayloadClient()
  return payload.update({ collection: 'orders', id: order.id, data: { paymentStatus: 'failed' }, overrideAccess: true })
}
