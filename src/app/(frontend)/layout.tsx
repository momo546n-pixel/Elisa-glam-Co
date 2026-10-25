import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

import { getSettings, SITE_URL } from '@/lib/payload'
import { getCategories } from '@/lib/catalog'
import { whatsappLink } from '@/lib/whatsapp'
import { CartProvider } from '@/components/CartProvider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/CartDrawer'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import { CookieBanner } from '@/components/CookieBanner'
import { Analytics } from '@/components/analytics'
import { DemoBadge } from '@/components/DemoBadge'

// Polices auto-hébergées par next/font (aucune requête vers Google côté visiteur), font-display: swap
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})
const sans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings().catch(() => null)
  const title = s?.defaultSeoTitle || 'Elisa’glam&Co — Maroquinerie artisanale premium, Made in Senegal'
  const description =
    s?.defaultSeoDescription ||
    'Sandales et accessoires en cuir faits main au Sénégal. Élégance, durabilité et savoir-faire artisanal. Livraison au Sénégal.'
  const og = s?.ogImage && typeof s.ogImage === 'object' ? s.ogImage.url : undefined
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s | Elisa’glam&Co' },
    description,
    applicationName: 'Elisa’glam&Co',
    openGraph: {
      type: 'website',
      locale: 'fr_SN',
      siteName: 'Elisa’glam&Co',
      title,
      description,
      images: og ? [{ url: og }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
    verification: s?.googleSiteVerification ? { google: s.googleSiteVerification } : undefined,
    alternates: { canonical: '/' },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#141210',
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()])
  const wa = settings.whatsappNumber ? whatsappLink(settings.whatsappNumber, 'Bonjour Elisa’glam&Co, j’aimerais avoir des informations.') : null
  const catLinks = categories.map((c) => ({ name: c.name, slug: c.slug }))

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Elisa’glam&Co',
    url: SITE_URL,
    foundingDate: '2016',
    areaServed: 'SN',
    description: 'Maroquinerie artisanale premium, sandales et accessoires en cuir. Made in Senegal.',
    sameAs: [settings.instagram, settings.facebook, settings.tiktok].filter(Boolean),
    contactPoint: settings.phone || settings.email ? [{ '@type': 'ContactPoint', telephone: settings.phone || undefined, email: settings.email || undefined, contactType: 'customer service', availableLanguage: 'fr' }] : undefined,
  }

  // data-scroll-behavior : évite le défilement animé pendant les transitions de pages
  // (impression de latence), tout en gardant le smooth scroll pour les ancres internes.
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${serif.variable} ${sans.variable}`}>
      {/* suppressHydrationWarning : les extensions navigateur (ex. convertisseurs de devises) ajoutent
          des attributs à <body> avant l'hydratation React ; sans cet avertissement, une erreur bénigne
          s'affiche dans l'overlay de développement. */}
      <body suppressHydrationWarning>
        <a href="#contenu" className="sr-only z-[100] bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          Aller au contenu
        </a>
        <CartProvider>
          <Header categories={catLinks} whatsappUrl={wa} social={{ instagram: settings.instagram, facebook: settings.facebook, tiktok: settings.tiktok }} />
          <main id="contenu" className="pt-[4.25rem] md:pt-20">
            {children}
          </main>
          <Footer settings={settings} categories={catLinks} whatsappUrl={wa} />
          <CartDrawer />
          <WhatsAppFloat href={wa} />
        </CartProvider>
        {settings.demoMode ? <DemoBadge /> : null}
        <CookieBanner />
        <Analytics ga4Id={settings.ga4Id || process.env.NEXT_PUBLIC_GA4_ID} pixelId={settings.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  )
}
