'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Logo } from './Logo'
import { useCart } from './CartProvider'
import { BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon, WhatsAppIcon, InstagramIcon, FacebookIcon, TikTokIcon } from './icons'

type Props = {
  categories: { name: string; slug: string }[]
  whatsappUrl: string | null
  social: { instagram?: string | null; facebook?: string | null; tiktok?: string | null }
}

const MAIN_LINKS = [
  { href: '/boutique', label: 'Boutique' },
  { href: '/notre-histoire', label: 'Notre histoire' },
  { href: '/notre-savoir-faire', label: 'Savoir-faire' },
  { href: '/contact', label: 'Contact' },
]

export function Header({ categories, whatsappUrl, social }: Props) {
  const pathname = usePathname()
  const { count, openDrawer } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Session légère : /api/users/me renvoie l'utilisateur si le cookie Payload est présent
  const [user, setUser] = useState<{ role?: string } | null | undefined>(undefined)
  const searchRef = useRef<HTMLInputElement>(null)

  const isHome = pathname === '/'
  // Transparent sur le hero de l'accueil, ivoire partout ailleurs et après défilement
  const transparent = isHome && !scrolled && !menuOpen && !searchOpen

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  // Rafraîchit l'état de connexion à chaque navigation (après connexion/déconnexion)
  useEffect(() => {
    let alive = true
    fetch('/api/users/me', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then((r) => r.json())
      .then((data) => {
        if (alive) setUser((data?.user as { role?: string } | null | undefined) ?? null)
      })
      .catch(() => {
        if (alive) setUser(null)
      })
    return () => {
      alive = false
    }
  }, [pathname])

  const iconBtn =
    'relative inline-flex h-11 w-11 items-center justify-center transition-colors duration-200 hover:text-leather'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,color] duration-300 ${
          transparent ? 'bg-transparent text-ivory' : 'bg-ivory/95 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur'
        }`}
      >
        <div className="container-eg grid h-[4.25rem] grid-cols-[1fr_auto_1fr] items-center md:h-20">
          {/* Gauche : menu burger (mobile) / navigation (desktop) */}
          <div className="flex items-center">
            <button
              type="button"
              className={`${iconBtn} -ml-2 lg:hidden`}
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
            >
              <MenuIcon size={24} />
            </button>
            <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">
              {MAIN_LINKS.slice(0, 2).map((l) => (
                <Link key={l.href} href={l.href} className="text-[0.74rem] font-medium uppercase tracking-[0.18em] hover:text-leather">
                  {l.label}
                </Link>
              ))}
              <div className="group relative">
                <Link href="/boutique" className="text-[0.74rem] font-medium uppercase tracking-[0.18em] hover:text-leather" tabIndex={-1} aria-hidden="true">
                  Collections
                </Link>
                <div className="invisible absolute left-0 top-full pt-5 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="min-w-[14rem] border border-line bg-ivory p-2 text-ink shadow-lg">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/collections/${c.slug}`} className="block px-4 py-2.5 text-sm hover:bg-sand">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </nav>
          </div>

          {/* Centre : logo */}
          <Logo light={transparent} />

          {/* Droite : recherche + panier */}
          <div className="flex items-center justify-end">
            <nav aria-label="Navigation secondaire" className="mr-5 hidden items-center gap-7 lg:flex">
              {MAIN_LINKS.slice(2).map((l) => (
                <Link key={l.href} href={l.href} className="text-[0.74rem] font-medium uppercase tracking-[0.18em] hover:text-leather">
                  {l.label}
                </Link>
              ))}
            </nav>
            <button type="button" className={iconBtn} onClick={() => setSearchOpen((v) => !v)} aria-label="Rechercher" aria-expanded={searchOpen}>
              <SearchIcon size={22} />
            </button>
            <Link
              href={user ? '/compte' : '/connexion'}
              aria-label={user ? 'Mon compte' : 'Connexion à votre compte'}
              title={user ? 'Mon compte' : 'Connexion'}
              className={iconBtn}
              data-testid={user ? 'header-account-me' : 'header-account-login'}
            >
              <UserIcon size={21} />
            </Link>
            <button type="button" className={`${iconBtn} -mr-2 md:mr-0`} onClick={openDrawer} aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}>
              <BagIcon size={23} />
              {count > 0 ? (
                <span className="absolute right-0.5 top-1 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-leather px-1 text-[0.65rem] font-semibold leading-none text-ivory">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        {searchOpen ? (
          <div className="anim-fade-in border-t border-line bg-ivory text-ink">
            <form action="/boutique" method="get" role="search" className="container-eg flex items-center gap-3 py-3">
              <label htmlFor="header-search" className="sr-only">
                Rechercher un modèle
              </label>
              <input
                ref={searchRef}
                id="header-search"
                name="q"
                type="search"
                placeholder="Rechercher un modèle…"
                className="field flex-1"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary !px-5">
                Rechercher
              </button>
            </form>
          </div>
        ) : null}
      </header>

      {/* Menu mobile */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="anim-fade-in absolute inset-0 bg-ink/50" onClick={() => setMenuOpen(false)} />
          <div className="anim-drawer-left absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-ivory text-ink">
            <div className="flex h-[4.25rem] items-center justify-between border-b border-line px-4">
              <Logo />
              <button type="button" className={`${iconBtn} -mr-2`} onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
                <CloseIcon size={24} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-6 py-6" aria-label="Menu mobile">
              <ul className="space-y-1">
                <li>
                  <Link href="/boutique" className="block py-2.5 font-serif text-[1.9rem]">
                    Boutique
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/collections/${c.slug}`} className="block py-1.5 pl-4 text-[0.95rem] text-muted hover:text-leather">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-5 space-y-1 border-t border-line pt-5">
                <li>
                  <Link href={user ? '/compte' : '/connexion'} className="block py-2 font-serif text-[1.35rem]" data-testid="mobile-account">
                    {user ? 'Mon compte' : 'Connexion'}
                  </Link>
                </li>
                {[
                  ['/notre-histoire', 'Notre histoire'],
                  ['/notre-savoir-faire', 'Notre savoir-faire'],
                  ['/guide-des-pointures', 'Guide des pointures'],
                  ['/livraison-et-retours', 'Livraison et retours'],
                  ['/faq', 'Questions fréquentes'],
                  ['/suivi-commande', 'Suivre ma commande'],
                  ['/contact', 'Contact'],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="block py-2 font-serif text-[1.35rem]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center gap-4 border-t border-line px-6 py-4">
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-leather">
                  <WhatsAppIcon size={22} />
                </a>
              ) : null}
              {social.instagram ? (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-ink">
                  <InstagramIcon size={22} />
                </a>
              ) : null}
              {social.facebook ? (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-ink">
                  <FacebookIcon size={22} />
                </a>
              ) : null}
              {social.tiktok ? (
                <a href={social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-ink">
                  <TikTokIcon size={22} />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
