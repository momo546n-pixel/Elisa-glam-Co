'use client'

import { useState } from 'react'
import { FacebookIcon, WhatsAppIcon } from './icons'

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const url = () => (typeof window !== 'undefined' ? window.location.href : '')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiez le lien :', url())
    }
  }

  const base = 'inline-flex min-h-[2.75rem] items-center gap-2 border border-line px-4 text-[0.8rem] transition-colors hover:border-ink'

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2" aria-label="Partager">
      <span className="mr-1 text-[0.75rem] uppercase tracking-[0.16em] text-muted">Partager</span>
      <a
        className={base}
        target="_blank"
        rel="noopener noreferrer"
        href="#"
        onClick={(e) => {
          e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`
        }}
      >
        <WhatsAppIcon size={16} /> WhatsApp
      </a>
      <a
        className={base}
        target="_blank"
        rel="noopener noreferrer"
        href="#"
        onClick={(e) => {
          e.currentTarget.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`
        }}
      >
        <FacebookIcon size={16} /> Facebook
      </a>
      <button type="button" className={base} onClick={copy}>
        {copied ? 'Lien copié ✓' : 'Copier le lien'}
      </button>
    </div>
  )
}
