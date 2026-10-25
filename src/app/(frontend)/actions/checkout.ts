'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { getPayloadClient, getSettings, SITE_URL } from '@/lib/payload'
import { normalizeSenegalPhone } from '@/lib/phone'
import { rateLimit } from '@/lib/rate-limit'
import { signOrder, verifyOrderToken } from '@/lib/order-token'
import { availableMethods, getPaymentProvider, type PaymentMethodId } from '@/lib/payments'
import { findOrderByNumber, markOrderPaid, markOrderPaymentFailed, quoteOrder, type CartInputLine } from '@/lib/orders'
import { formatFCFA } from '@/lib/format'

async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local'
}

const lineSchema = z.object({
  productId: z.string().min(1).max(40),
  color: z.string().min(1).max(60),
  size: z.string().min(1).max(20),
  quantity: z.number().int().min(1).max(20),
})

const orderSchema = z.object({
  lines: z.array(lineSchema).min(1).max(30),
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(80),
  phone: z.string().trim().min(1, 'Indiquez votre numéro de téléphone.'),
  email: z.string().trim().max(120).email('Adresse email invalide.').optional().or(z.literal('')),
  zoneId: z.string().min(1, 'Choisissez votre zone de livraison.'),
  address: z.string().trim().min(5, 'Indiquez votre adresse ou votre quartier.').max(300),
  landmark: z.string().trim().max(200).optional(),
  note: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(['wave', 'orange_money', 'card', 'cod'], { message: 'Choisissez un mode de paiement.' }),
  promoCode: z.string().trim().max(40).optional(),
  website: z.string().max(0).optional(), // champ piège anti-robots (doit rester vide)
})

export type PlaceOrderInput = z.input<typeof orderSchema>

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; token: string; redirectUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export type QuoteResult =
  | {
      ok: true
      subtotal: number
      discount: number
      deliveryFee: number
      total: number
      promoMessage: string | null
      zoneName: string | null
      zoneDelay: string | null
      methods: PaymentMethodId[]
    }
  | { ok: false; error: string; promoError?: string }

/** Récapitulatif fiable (prix, stock, livraison, promo) calculé côté serveur pour l'affichage du checkout. */
export async function quoteAction(lines: CartInputLine[], zoneId: string | null, promoCode: string | null): Promise<QuoteResult> {
  const rl = rateLimit(`quote:${await clientIp()}`, 60, 60_000)
  if (!rl.ok) return { ok: false, error: 'Trop de requêtes, réessayez dans un instant.' }
  const parsed = z.array(lineSchema).max(30).safeParse(lines)
  if (!parsed.success) return { ok: false, error: 'Panier invalide.' }
  const q = await quoteOrder(parsed.data, zoneId, promoCode)
  if (!q.ok) return q
  const settings = await getSettings()
  return {
    ok: true,
    subtotal: q.subtotal,
    discount: q.discount,
    deliveryFee: q.deliveryFee,
    total: q.total,
    promoMessage: q.promoMessage,
    zoneName: q.zone?.name ?? null,
    zoneDelay: q.zone?.delay ?? null,
    methods: availableMethods(settings, q.zone),
  }
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const ip = await clientIp()
  const rl = rateLimit(`order:${ip}`, 6, 10 * 60_000)
  if (!rl.ok) return { ok: false, error: 'Trop de tentatives. Merci de réessayer dans quelques minutes.' }

  const parsed = orderSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return { ok: false, error: 'Veuillez corriger les champs signalés.', fieldErrors }
  }
  const data = parsed.data
  if (data.website) return { ok: false, error: 'Commande refusée.' } // robot

  const phone = normalizeSenegalPhone(data.phone)
  if (!phone) {
    return {
      ok: false,
      error: 'Veuillez corriger les champs signalés.',
      fieldErrors: { phone: 'Numéro invalide. Exemple : 77 123 45 67 (indicatif +221).' },
    }
  }

  const quote = await quoteOrder(data.lines as CartInputLine[], data.zoneId, data.promoCode || null)
  if (!quote.ok) return { ok: false, error: quote.error, fieldErrors: quote.promoError ? { promoCode: quote.promoError } : undefined }
  if (!quote.zone) return { ok: false, error: 'Choisissez votre zone de livraison.', fieldErrors: { zoneId: 'Choisissez votre zone de livraison.' } }

  const settings = await getSettings()
  const methods = availableMethods(settings, quote.zone)
  if (!methods.includes(data.paymentMethod)) {
    return { ok: false, error: 'Ce mode de paiement n’est pas disponible pour votre zone.', fieldErrors: { paymentMethod: 'Mode de paiement indisponible.' } }
  }

  // Limitation par numéro de téléphone (anti-commandes fictives)
  const phoneRl = rateLimit(`order-phone:${phone}`, 4, 60 * 60_000)
  if (!phoneRl.ok) return { ok: false, error: 'Trop de commandes avec ce numéro. Contactez-nous sur WhatsApp.' }

  const payload = await getPayloadClient()
  const isCod = data.paymentMethod === 'cod'

  const order = await payload.create({
    collection: 'orders',
    overrideAccess: true,
    data: {
      status: 'received',
      paymentStatus: isCod ? 'cod_pending' : 'pending',
      paymentMethod: data.paymentMethod,
      customerName: data.name,
      customerPhone: phone,
      customerEmail: data.email || undefined,
      deliveryZone: quote.zone.id,
      deliveryZoneName: quote.zone.name,
      address: data.address,
      landmark: data.landmark || undefined,
      customerNote: data.note || undefined,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      promoCode: quote.promoCode ?? undefined,
      deliveryFee: quote.deliveryFee,
      total: quote.total,
      currency: 'XOF',
      locale: 'fr',
    },
  })

  if (quote.promoCode) {
    const found = await payload.find({ collection: 'promo-codes', where: { code: { equals: quote.promoCode } }, limit: 1, overrideAccess: true })
    const promo = found.docs[0]
    if (promo) await payload.update({ collection: 'promo-codes', id: promo.id, data: { usedCount: (promo.usedCount ?? 0) + 1 }, overrideAccess: true })
  }

  const orderNumber = order.orderNumber as string
  const token = signOrder(orderNumber)

  if (isCod) return { ok: true, orderNumber, token }

  // Paiement en ligne : création de la session chez le prestataire
  const provider = getPaymentProvider()
  try {
    if (!provider) throw new Error('Aucun prestataire de paiement configuré')
    const result = await provider.createPayment({
      orderNumber,
      amount: quote.total,
      description: `Commande ${orderNumber} : ${quote.items.length} article(s)`,
      customer: { name: data.name, phone, email: data.email || undefined },
      method: data.paymentMethod as Exclude<PaymentMethodId, 'cod'>,
      returnUrl: `${SITE_URL}/commande/confirmation/${orderNumber}?t=${token}`,
      cancelUrl: `${SITE_URL}/commande/confirmation/${orderNumber}?t=${token}&annule=1`,
      callbackUrl: `${SITE_URL}/webhooks/paydunya`,
    })
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      context: { skipOrderHooks: true },
      data: { paymentProvider: provider.id, paymentReference: result.reference },
    })
    return { ok: true, orderNumber, token, redirectUrl: result.redirectUrl }
  } catch (err) {
    payload.logger.error({ err }, `Création du paiement impossible pour ${orderNumber}`)
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      context: { skipOrderHooks: true },
      data: { status: 'cancelled', paymentStatus: 'failed', internalNote: 'Annulée automatiquement : impossible de créer le paiement.' },
    })
    return { ok: false, error: 'Le paiement en ligne est momentanément indisponible. Réessayez ou choisissez un autre mode de paiement.' }
  }
}

/** Relance un paiement en ligne pour une commande non payée (lien de la page de confirmation). */
export async function retryPayment(orderNumber: string, token: string, method: PaymentMethodId): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  if (!verifyOrderToken(orderNumber, token)) return { ok: false, error: 'Lien invalide.' }
  const rl = rateLimit(`retry:${await clientIp()}`, 8, 10 * 60_000)
  if (!rl.ok) return { ok: false, error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  const order = await findOrderByNumber(orderNumber)
  if (!order || order.paymentStatus === 'paid' || order.status === 'cancelled' || order.paymentMethod === 'cod') {
    return { ok: false, error: 'Cette commande ne peut pas être payée en ligne.' }
  }
  const provider = getPaymentProvider()
  if (!provider || method === 'cod') return { ok: false, error: 'Paiement en ligne indisponible.' }
  const payload = await getPayloadClient()
  try {
    const result = await provider.createPayment({
      orderNumber,
      amount: order.total,
      description: `Commande ${orderNumber}`,
      customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail ?? undefined },
      method,
      returnUrl: `${SITE_URL}/commande/confirmation/${orderNumber}?t=${token}`,
      cancelUrl: `${SITE_URL}/commande/confirmation/${orderNumber}?t=${token}&annule=1`,
      callbackUrl: `${SITE_URL}/webhooks/paydunya`,
    })
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      context: { skipOrderHooks: true },
      data: { paymentMethod: method, paymentStatus: 'pending', paymentProvider: provider.id, paymentReference: result.reference },
    })
    return { ok: true, redirectUrl: result.redirectUrl }
  } catch (err) {
    payload.logger.error({ err }, `Relance de paiement impossible pour ${orderNumber}`)
    return { ok: false, error: 'Le paiement en ligne est momentanément indisponible.' }
  }
}

/** Simulation de paiement (développement uniquement). */
export async function simulatePayment(orderNumber: string, token: string, outcome: 'success' | 'failure') {
  if (process.env.NODE_ENV === 'production' || process.env.PAYMENT_PROVIDER !== 'mock') return { ok: false as const }
  if (!verifyOrderToken(orderNumber, token)) return { ok: false as const }
  if (outcome === 'success') await markOrderPaid(orderNumber, `MOCK-${orderNumber}`)
  else await markOrderPaymentFailed(orderNumber)
  return { ok: true as const }
}

/* ───────────────────────── Suivi de commande ───────────────────────── */

export type TrackResult =
  | {
      ok: true
      orderNumber: string
      status: string
      paymentStatus: string
      paymentMethod: string
      total: string
      createdAt: string
      zone: string | null
      items: { label: string; quantity: number }[]
    }
  | { ok: false; error: string }

export async function trackOrder(orderNumberRaw: string, phoneRaw: string): Promise<TrackResult> {
  const rl = rateLimit(`track:${await clientIp()}`, 10, 10 * 60_000)
  if (!rl.ok) return { ok: false, error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  const orderNumber = orderNumberRaw.trim().toUpperCase()
  const phone = normalizeSenegalPhone(phoneRaw)
  const generic = 'Aucune commande ne correspond à ces informations. Vérifiez le numéro et le téléphone utilisé lors de la commande.'
  if (!orderNumber || !phone) return { ok: false, error: generic }
  const order = await findOrderByNumber(orderNumber)
  if (!order || order.customerPhone !== phone) return { ok: false, error: generic }
  return {
    ok: true,
    orderNumber: order.orderNumber as string,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: formatFCFA(order.total),
    createdAt: order.createdAt,
    zone: order.deliveryZoneName ?? null,
    items: (order.items ?? []).map((i) => ({
      label: `${i.productName} · ${i.color}, pointure ${i.size}`,
      quantity: i.quantity ?? 1,
    })),
  }
}
