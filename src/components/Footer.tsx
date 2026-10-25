import Link from 'next/link'
import type { SiteSetting } from '../payload-types'
import { Logo } from './Logo'
import { CookieSettingsButton } from './CookieBanner'
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './icons'

type Props = {
  settings: SiteSetting
  categories: { name: string; slug: string }[]
  whatsappUrl: string | null
}

const linkCls = 'text-sm text-ivory/70 transition-colors hover:text-gold'

export function Footer({ settings, categories, whatsappUrl }: Props) {
  return (
    <footer className="mt-24 bg-ink text-ivory">
      <div className="h-px w-full bg-gold/70" />
      <div className="container-eg grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/70">
            Maroquinerie artisanale premium, conçue et fabriquée au Sénégal. Sandales homme, femme, modèles
            orthopédiques et accessoires en cuir.
          </p>
          <div className="mt-6 flex items-center gap-4">
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-ivory/70 hover:text-gold">
                <WhatsAppIcon size={22} />
              </a>
            ) : null}
            {settings.instagram ? (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-ivory/70 hover:text-gold">
                <InstagramIcon size={22} />
              </a>
            ) : null}
            {settings.facebook ? (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-ivory/70 hover:text-gold">
                <FacebookIcon size={22} />
              </a>
            ) : null}
            {settings.tiktok ? (
              <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-ivory/70 hover:text-gold">
                <TikTokIcon size={22} />
              </a>
            ) : null}
          </div>
        </div>

        <nav aria-label="Boutique">
          <h2 className="eyebrow !text-gold">Boutique</h2>
          <ul className="mt-5 space-y-3">
            <li>
              <Link href="/boutique" className={linkCls}>
                Tous les modèles
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className={linkCls}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Aide">
          <h2 className="eyebrow !text-gold">Aide</h2>
          <ul className="mt-5 space-y-3">
            {[
              ['/livraison-et-retours', 'Livraison et retours'],
              ['/guide-des-pointures', 'Guide des pointures'],
              ['/suivi-commande', 'Suivre ma commande'],
              ['/avis', 'Donner mon avis'],
              ['/faq', 'Questions fréquentes'],
              ['/contact', 'Contact'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className={linkCls}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow !text-gold">Contact</h2>
          <ul className="mt-5 space-y-3 text-sm text-ivory/70">
            {settings.phone ? <li>{settings.phone}</li> : null}
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className="hover:text-gold">
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings.address ? <li className="whitespace-pre-line">{settings.address}</li> : null}
            {settings.openingHours ? <li>{settings.openingHours}</li> : null}
            {!settings.phone && !settings.email && !settings.address ? (
              <li>
                <Link href="/contact" className="hover:text-gold">
                  Nous écrire
                </Link>
              </li>
            ) : null}
          </ul>
          <p className="mt-6 text-xs text-ivory/50">Paiement : Wave · Orange Money · à la livraison</p>
        </div>
      </div>

      {settings.demoMode ? (
        <div className="border-t border-gold/40 bg-leather/20">
          <p className="container-eg py-3 text-center text-[0.78rem] text-ivory/80">
            <strong className="font-medium text-gold">Site de démonstration</strong> : produits, prix, textes, avis et coordonnées sont fictifs.
            Photos d’illustration libres de droits (Unsplash).
          </p>
        </div>
      ) : null}
      <div className="border-t border-ivory/10">
        <div className="container-eg flex flex-col gap-4 py-6 text-xs text-ivory/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Elisa’glam&amp;Co — Made in Senegal</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/mentions-legales" className="hover:text-gold">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="hover:text-gold">
                CGV
              </Link>
            </li>
            {settings.demoMode ? (
              <li>
                <Link href="/credits-photos" className="hover:text-gold">
                  Crédits photos
                </Link>
              </li>
            ) : null}
            <li>
              <Link href="/politique-de-confidentialite" className="hover:text-gold">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link href="/politique-de-cookies" className="hover:text-gold">
                Cookies
              </Link>
            </li>
            <li>
              <CookieSettingsButton className="hover:text-gold" />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
