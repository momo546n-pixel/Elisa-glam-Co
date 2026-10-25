'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { track } from './analytics'

export type CartLine = {
  key: string
  productId: string
  slug: string
  name: string
  reference: string
  color: string
  size: string
  unitPrice: number
  quantity: number
  /** null = pas de limite (sur commande) */
  maxQuantity: number | null
  image: string | null
}

type CartContextValue = {
  lines: CartLine[]
  count: number
  subtotal: number
  ready: boolean
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addLine: (line: Omit<CartLine, 'key' | 'quantity'>, quantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  removeLine: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'eg-cart-v1'

export const lineKey = (productId: string, color: string, size: string) => `${productId}|${color}|${size}`

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Chargement depuis localStorage (le panier persiste entre les visites)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setLines(parsed)
      }
    } catch {
      /* stockage indisponible : panier vide */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* ignoré */
    }
  }, [lines, ready])

  // Synchronisation entre onglets
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setLines(JSON.parse(e.newValue))
        } catch {
          /* ignoré */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addLine = useCallback<CartContextValue['addLine']>((line, quantity = 1) => {
    const key = lineKey(line.productId, line.color, line.size)
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key)
      const max = line.maxQuantity
      if (existing) {
        const next = max == null ? existing.quantity + quantity : Math.min(max, existing.quantity + quantity)
        return prev.map((l) => (l.key === key ? { ...l, ...line, key, quantity: next } : l))
      }
      const first = max == null ? quantity : Math.min(max, quantity)
      return [...prev, { ...line, key, quantity: Math.max(1, first) }]
    })
    track('AddToCart', {
      content_ids: [line.productId],
      content_name: line.name,
      value: line.unitPrice * quantity,
      currency: 'XOF',
    })
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => {
          if (l.key !== key) return l
          const capped = l.maxQuantity == null ? quantity : Math.min(l.maxQuantity, quantity)
          return { ...l, quantity: capped }
        })
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const removeLine = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0),
      ready,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addLine,
      setQuantity,
      removeLine,
      clear,
    }),
    [lines, ready, drawerOpen, addLine, setQuantity, removeLine, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>')
  return ctx
}
