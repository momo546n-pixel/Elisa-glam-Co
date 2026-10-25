'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import { normalizeSenegalPhone } from '@/lib/phone'

const schema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(80),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(120).email('Adresse email invalide.').optional().or(z.literal('')),
  subject: z.string().trim().min(3, 'Indiquez l’objet de votre message.').max(120),
  message: z.string().trim().min(10, 'Votre message est trop court.').max(2000),
  website: z.string().max(0).optional(), // champ piège anti-robots
})

export type ContactState = { ok: boolean; message?: string; errors?: Record<string, string> }

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const rl = rateLimit(`contact:${ip}`, 4, 15 * 60_000)
  if (!rl.ok) return { ok: false, message: 'Trop de messages envoyés. Réessayez dans quelques minutes.' }

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message
    return { ok: false, errors }
  }
  const d = parsed.data
  if (d.website) return { ok: true, message: 'Merci, votre message a bien été envoyé.' } // robot : on fait semblant
  if (!d.phone && !d.email) return { ok: false, errors: { phone: 'Indiquez un téléphone ou un email pour que nous puissions vous répondre.' } }
  const phone = d.phone ? (normalizeSenegalPhone(d.phone) ?? d.phone) : undefined

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'messages',
    overrideAccess: true,
    data: { name: d.name, phone, email: d.email || undefined, subject: d.subject, message: d.message },
  })

  // Notification à l'administratrice (email si Resend est configuré)
  const settings = await getSettings()
  const to = settings.orderNotificationEmail || settings.email
  if (to && process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'Elisa’glam&Co <onboarding@resend.dev>',
        to: [to],
        subject: `Nouveau message : ${d.subject}`,
        text: `De : ${d.name}\nTéléphone : ${phone ?? '-'}\nEmail : ${d.email || '-'}\n\n${d.message}`,
      }),
    }).catch(() => undefined)
  }

  return { ok: true, message: 'Merci, votre message a bien été envoyé. Nous vous répondons rapidement.' }
}
