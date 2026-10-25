import type { Payload } from 'payload'
import { formatFCFA } from './format'
import { whatsappLink } from './whatsapp'

type OrderDoc = {
  orderNumber?: string | null
  status?: string | null
  customerName?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  total?: number | null
  paymentMethod?: string | null
  paymentStatus?: string | null
  deliveryZoneName?: string | null
  address?: string | null
  items?: Array<{ productName?: string | null; color?: string | null; size?: string | null; quantity?: number | null; unitPrice?: number | null }> | null
}

const STATUS_LABELS: Record<string, string> = {
  received: 'bien reçue',
  confirmed: 'confirmée',
  preparing: 'en cours de préparation',
  shipped: 'expédiée',
  delivered: 'livrée',
  cancelled: 'annulée',
}

const PAYMENT_LABELS: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  card: 'Carte bancaire',
  cod: 'Paiement à la livraison',
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

async function sendEmail(to: string, subject: string, html: string, payload: Payload) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    payload.logger.info(`[email non envoyé — RESEND_API_KEY absent] À: ${to} | Sujet: ${subject}`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'Elisa’glam&Co <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  })
  if (!res.ok) payload.logger.error(`Resend a répondu ${res.status}: ${await res.text()}`)
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function itemsHtml(order: OrderDoc): string {
  return (order.items ?? [])
    .map(
      (i) =>
        `<li>${esc(i.productName ?? '')} — ${esc(i.color ?? '')}, pointure ${esc(i.size ?? '')} × ${i.quantity ?? 1} (${formatFCFA((i.unitPrice ?? 0) * (i.quantity ?? 1))})</li>`,
    )
    .join('')
}

function layout(title: string, body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#141210;background:#FAF7F2;padding:32px">
  <p style="letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#7A4E2D;margin:0 0 8px">Elisa’glam&amp;Co</p>
  <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 20px">${title}</h1>${body}
  <hr style="border:0;border-top:1px solid #B8955A;margin:28px 0"><p style="font-size:12px;color:#6E665D">Fait main au Sénégal.</p></div>`
}

/** Nouvelle commande : email à l'administratrice + accusé de réception au client (si email fourni). */
export async function notifyOrderCreated(order: OrderDoc, payload: Payload) {
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 }).catch(() => null)
  const trackUrl = `${siteUrl()}/suivi-commande`
  const summary = `<ul>${itemsHtml(order)}</ul>
    <p><strong>Total : ${formatFCFA(order.total ?? 0)}</strong><br>Paiement : ${esc(PAYMENT_LABELS[order.paymentMethod ?? ''] ?? '')}<br>Livraison : ${esc(order.deliveryZoneName ?? '')} — ${esc(order.address ?? '')}</p>`

  const adminTo = settings?.orderNotificationEmail
  if (adminTo) {
    const wa = order.customerPhone
      ? `<p><a href="${whatsappLink(order.customerPhone, `Bonjour ${order.customerName ?? ''}, c’est Elisa’glam&Co. Nous confirmons votre commande ${order.orderNumber}.`)}">Contacter le client sur WhatsApp</a></p>`
      : ''
    await sendEmail(
      adminTo,
      `Nouvelle commande ${order.orderNumber}`,
      layout(`Nouvelle commande ${esc(order.orderNumber ?? '')}`, `<p>${esc(order.customerName ?? '')} — ${esc(order.customerPhone ?? '')}</p>${summary}${wa}`),
      payload,
    )
  } else {
    payload.logger.info(`Nouvelle commande ${order.orderNumber} (aucun email administratrice configuré)`)
  }

  if (order.customerEmail) {
    await sendEmail(
      order.customerEmail,
      `Votre commande ${order.orderNumber} — Elisa’glam&Co`,
      layout(
        'Merci pour votre commande',
        `<p>Bonjour ${esc(order.customerName ?? '')}, nous avons bien reçu votre commande <strong>${esc(order.orderNumber ?? '')}</strong>.</p>${summary}
         <p>Suivez-la ici avec votre numéro de commande et votre téléphone : <a href="${trackUrl}">${trackUrl}</a></p>`,
      ),
      payload,
    )
  }
}

/** Changement de statut : email au client si une adresse a été renseignée. */
export async function notifyStatusChange(order: OrderDoc, payload: Payload) {
  if (!order.customerEmail || !order.status) return
  const label = STATUS_LABELS[order.status]
  if (!label) return
  await sendEmail(
    order.customerEmail,
    `Votre commande ${order.orderNumber} est ${label}`,
    layout(
      `Commande ${label}`,
      `<p>Bonjour ${esc(order.customerName ?? '')}, votre commande <strong>${esc(order.orderNumber ?? '')}</strong> est désormais <strong>${label}</strong>.</p>
       <p>Suivi : <a href="${siteUrl()}/suivi-commande">${siteUrl()}/suivi-commande</a></p>`,
    ),
    payload,
  )
}
