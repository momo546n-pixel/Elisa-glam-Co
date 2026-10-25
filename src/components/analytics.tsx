'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

/**
 * Consentement cookies : aucun traceur (GA4, Meta Pixel) n'est chargé avant accord explicite.
 * Le choix est conservé dans localStorage ('eg-consent' = 'granted' | 'denied').
 */
export const CONSENT_KEY = 'eg-consent'
export const CONSENT_EVENT = 'eg-consent-change'

export type Consent = 'granted' | 'denied' | null

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function writeConsent(value: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch {
    /* ignoré */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

type W = Window & {
  gtag?: (...args: unknown[]) => void
  fbq?: (...args: unknown[]) => void
  dataLayer?: unknown[]
}

const GA_MAP: Record<string, string> = {
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  OrderPlaced: 'order_placed',
  Purchase: 'purchase',
}

/** Envoie un événement vers GA4 et Meta Pixel, uniquement si le consentement est accordé et les outils chargés. */
export function track(event: keyof typeof GA_MAP, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || readConsent() !== 'granted') return
  const w = window as W
  try {
    if (w.gtag) {
      const value = typeof params.value === 'number' ? params.value : undefined
      const items = Array.isArray(params.content_ids)
        ? (params.content_ids as string[]).map((id) => ({ item_id: id, item_name: params.content_name }))
        : undefined
      w.gtag('event', GA_MAP[event], { currency: params.currency ?? 'XOF', value, items, transaction_id: params.transaction_id })
    }
    if (w.fbq && event !== 'OrderPlaced') {
      w.fbq('track', event, {
        content_ids: params.content_ids,
        content_name: params.content_name,
        content_type: 'product',
        value: params.value,
        currency: params.currency ?? 'XOF',
      })
    } else if (w.fbq && event === 'OrderPlaced') {
      w.fbq('trackCustom', 'OrderPlaced', { value: params.value, currency: params.currency ?? 'XOF' })
    }
  } catch {
    /* un traceur ne doit jamais casser le site */
  }
}

export function Analytics({ ga4Id, pixelId }: { ga4Id?: string | null; pixelId?: string | null }) {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    const sync = () => setGranted(readConsent() === 'granted')
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  if (!granted) return null

  const ga = ga4Id?.trim()
  const px = pixelId?.trim()

  return (
    <>
      {ga && /^G-[A-Z0-9]+$/.test(ga) ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${ga}');
          `}</Script>
        </>
      ) : null}
      {px && /^\d+$/.test(px) ? (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${px}');
          fbq('track', 'PageView');
        `}</Script>
      ) : null}
    </>
  )
}
