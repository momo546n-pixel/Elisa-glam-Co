import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { whatsappLink } from '@/lib/whatsapp'
import { WhatsAppIcon, InstagramIcon, FacebookIcon, TikTokIcon } from '@/components/icons'
import { ContactForm } from './ContactForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Une question sur un modèle, une pointure ou une commande ? Écrivez-nous sur WhatsApp ou via le formulaire.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const payload = await getPayloadClient()
  const [settings, pageRes] = await Promise.all([
    getSettings(),
    payload.find({ collection: 'pages', where: { slug: { equals: 'contact' } }, limit: 1 }),
  ])
  const page = pageRes.docs[0]
  const wa = settings.whatsappNumber ? whatsappLink(settings.whatsappNumber, 'Bonjour Elisa’glam&Co, j’ai une question.') : null

  const socials = [
    { href: settings.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: settings.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: settings.tiktok, label: 'TikTok', Icon: TikTokIcon },
  ].filter((s) => s.href)

  return (
    <div className="container-eg py-12 md:py-20">
      <header className="text-center">
        <p className="eyebrow mb-3">Nous joindre</p>
        <h1 className="section-title text-[2.3rem] md:text-[3.4rem]">
          <span>{page?.title ?? 'Contact'}</span>
        </h1>
        {page?.intro ? <p className="mx-auto mt-5 max-w-xl text-muted">{page.intro}</p> : null}
      </header>

      <div className="mx-auto mt-12 grid max-w-5xl gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
              <WhatsAppIcon size={20} /> Écrire sur WhatsApp
            </a>
          ) : null}

          <ul className="mt-8 space-y-4 text-[0.98rem]">
            {settings.phone ? (
              <li>
                <span className="eyebrow block">Téléphone</span>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-leather">{settings.phone}</a>
              </li>
            ) : null}
            {settings.email ? (
              <li>
                <span className="eyebrow block">Email</span>
                <a href={`mailto:${settings.email}`} className="hover:text-leather">{settings.email}</a>
              </li>
            ) : null}
            {settings.address ? (
              <li>
                <span className="eyebrow block">Atelier</span>
                <span className="whitespace-pre-line">{settings.address}</span>
              </li>
            ) : null}
            {settings.openingHours ? (
              <li>
                <span className="eyebrow block">Horaires</span>
                {settings.openingHours}
              </li>
            ) : null}
            {!settings.phone && !settings.email && !settings.address ? (
              <li className="text-sm text-muted">[À COMPLÉTER : coordonnées officielles (téléphone, email, adresse) dans l’administration, Réglages du site]</li>
            ) : null}
          </ul>

          {socials.length ? (
            <div className="mt-8 flex gap-4">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href as string} target="_blank" rel="noopener noreferrer" aria-label={label} className="inline-flex h-11 w-11 items-center justify-center border border-line hover:border-ink">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          ) : null}

          {page?.body ? (
            <div className="prose-eg mt-10 text-[0.98rem]">
              <RichText data={page.body as never} />
            </div>
          ) : null}
        </div>

        <ContactForm />
      </div>
    </div>
  )
}
