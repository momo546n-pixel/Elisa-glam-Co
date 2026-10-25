'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { readConsent, writeConsent } from './analytics'

const CLOSE_KEY = 'eg-consent-closed'

/** Bandeau de consentement discret. « Refuser » est aussi simple que « Accepter ». */
export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fermé manuellement (×) : aucune décision de consentement enregistrée
    // (donc aucun traceur chargé), mais on ne le réaffiche plus pendant la session.
    let closed = false
    try {
      closed = sessionStorage.getItem(CLOSE_KEY) === '1'
    } catch {
      /* stockage indisponible : on affiche le bandeau */
    }
    setVisible(readConsent() === null && !closed)
    const reopen = () => setVisible(true)
    window.addEventListener('eg-consent-reopen', reopen)
    return () => window.removeEventListener('eg-consent-reopen', reopen)
  }, [])

  if (!visible) return null

  const choose = (value: 'granted' | 'denied') => {
    writeConsent(value)
    setVisible(false)
  }

  const dismiss = () => {
    try {
      sessionStorage.setItem(CLOSE_KEY, '1')
    } catch {
      /* ignoré */
    }
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      className="anim-fade-up fixed inset-x-3 bottom-3 z-[45] mx-auto max-w-xl border border-line bg-ivory px-4 py-3.5 shadow-[0_10px_40px_rgba(20,18,16,0.14)] md:inset-x-auto md:left-1/2 md:bottom-6 md:-translate-x-1/2 md:px-5 md:py-3"
    >
      {/* Fermer sans décider : aucun traceur n'est chargé (consentement non accordé) */}
      <button
        type="button"
        aria-label="Fermer le bandeau cookies (les traceurs restent désactivés)"
        onClick={dismiss}
        className="absolute right-1 top-0.5 inline-flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-ink"
      >
        ×
      </button>
      <div className="md:flex md:items-center md:gap-4">
        <p className="text-sm leading-relaxed text-ink">
          Nous utilisons des cookies de mesure d'audience et de publicité uniquement avec votre accord.{' '}
          <Link href="/politique-de-cookies" className="link-underline whitespace-nowrap text-leather">
            En savoir plus
          </Link>
        </p>
        <div className="mt-3 flex gap-3 md:mt-0 md:shrink-0">
          <button type="button" className="btn btn-secondary !px-4 !py-2 text-[0.78rem]" onClick={() => choose('denied')}>
            Refuser
          </button>
          <button type="button" className="btn btn-primary !px-4 !py-2 text-[0.78rem]" onClick={() => choose('granted')}>
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event('eg-consent-reopen'))}
    >
      Gérer mes cookies
    </button>
  )
}
