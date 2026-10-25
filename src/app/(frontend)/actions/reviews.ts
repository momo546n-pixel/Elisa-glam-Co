'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { getPayloadClient } from '@/lib/payload'
import { normalizeSenegalPhone } from '@/lib/phone'
import { rateLimit } from '@/lib/rate-limit'
import { findOrderByNumber } from '@/lib/orders'

async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

export type ReviewableItem = { productId: string; label: string; alreadyReviewed: boolean }

export type LookupResult =
  | { ok: true; orderNumber: string; items: ReviewableItem[] }
  | { ok: false; error: string }

const GENERIC = 'Aucune commande ne correspond à ces informations.'

/** Vérifie que la commande existe, appartient à ce téléphone et a été livrée : seuls les vrais acheteurs peuvent laisser un avis. */
async function verifyBuyer(orderNumberRaw: string, phoneRaw: string) {
  const orderNumber = orderNumberRaw.trim().toUpperCase()
  const phone = normalizeSenegalPhone(phoneRaw)
  if (!orderNumber || !phone) return { ok: false, error: GENERIC } as const
  const order = await findOrderByNumber(orderNumber)
  if (!order || order.customerPhone !== phone) return { ok: false, error: GENERIC } as const
  if (order.status !== 'delivered') return { ok: false, error: 'Vous pourrez donner votre avis dès que votre commande aura été livrée. Merci de votre patience !' } as const
  return { ok: true, order } as const
}

export async function lookupReviewable(orderNumber: string, phone: string): Promise<LookupResult> {
  const rl = rateLimit(`review-lookup:${await clientIp()}`, 10, 10 * 60_000)
  if (!rl.ok) return { ok: false, error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  const res = await verifyBuyer(orderNumber, phone)
  if (!res.ok) return { ok: false, error: res.error }
  const { order } = res

  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'reviews',
    where: { orderNumber: { equals: order.orderNumber as string } },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  const reviewed = new Set(existing.docs.map((r) => String(typeof r.product === 'object' ? r.product.id : r.product)))

  const seen = new Set<string>()
  const items: ReviewableItem[] = []
  for (const i of order.items ?? []) {
    const id = String(typeof i.product === 'object' && i.product ? i.product.id : i.product)
    if (!id || seen.has(id)) continue
    seen.add(id)
    items.push({ productId: id, label: i.productName ?? 'Article', alreadyReviewed: reviewed.has(id) })
  }
  return { ok: true, orderNumber: order.orderNumber as string, items }
}

const schema = z.object({
  orderNumber: z.string().min(3).max(40),
  phone: z.string().min(5).max(30),
  productId: z.string().min(1).max(40),
  firstName: z.string().trim().min(2, 'Indiquez votre prénom.').max(40),
  rating: z.number().int().min(1, 'Choisissez une note.').max(5),
  comment: z.string().trim().min(10, 'Votre avis est trop court (10 caractères minimum).').max(1000),
  website: z.string().max(0).optional(), // champ piège anti-robots
})

export type SubmitReviewResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> }

export async function submitReview(input: z.input<typeof schema>): Promise<SubmitReviewResult> {
  const rl = rateLimit(`review-submit:${await clientIp()}`, 5, 60 * 60_000)
  if (!rl.ok) return { ok: false, error: 'Trop de tentatives. Réessayez plus tard.' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message
    return { ok: false, error: 'Veuillez corriger les champs signalés.', fieldErrors }
  }
  const d = parsed.data
  if (d.website) return { ok: true } // robot : on fait semblant

  const res = await verifyBuyer(d.orderNumber, d.phone)
  if (!res.ok) return { ok: false, error: res.error }
  const { order } = res

  const bought = (order.items ?? []).some((i) => String(typeof i.product === 'object' && i.product ? i.product.id : i.product) === d.productId)
  if (!bought) return { ok: false, error: 'Cet article ne fait pas partie de votre commande.' }

  const payload = await getPayloadClient()
  const dup = await payload.find({
    collection: 'reviews',
    where: { and: [{ orderNumber: { equals: order.orderNumber as string } }, { product: { equals: Number(d.productId) } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (dup.totalDocs > 0) return { ok: false, error: 'Vous avez déjà donné votre avis sur cet article. Merci !' }

  await payload.create({
    collection: 'reviews',
    overrideAccess: true,
    data: {
      firstName: d.firstName,
      product: Number(d.productId),
      rating: d.rating,
      comment: d.comment,
      date: new Date().toISOString(),
      status: 'pending', // modération obligatoire avant publication
      isDemo: false,
      orderNumber: order.orderNumber as string,
    },
  })
  return { ok: true }
}
