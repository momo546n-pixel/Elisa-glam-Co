'use client'

import { useEffect, useState } from 'react'

const KEY = 'eg-demo-badge-dismissed'

/** Pastille discrète signalant le mode démonstration (fermable). */
export function DemoBadge() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(KEY) !== '1')
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="wa-float-left fixed bottom-4 left-4 z-30 flex items-center gap-2 border border-gold/60 bg-ink/90 py-1.5 pl-3 pr-1 text-[0.68rem] uppercase tracking-[0.16em] text-ivory shadow-lg backdrop-blur md:bottom-6 md:left-6">
      <span>Démo · contenus fictifs</span>
      <button
        type="button"
        aria-label="Fermer l’avis de démonstration"
        className="inline-flex h-7 w-7 items-center justify-center text-ivory/70 hover:text-gold"
        onClick={() => {
          try {
            localStorage.setItem(KEY, '1')
          } catch {
            /* ignoré */
          }
          setVisible(false)
        }}
      >
        ×
      </button>
    </div>
  )
}
