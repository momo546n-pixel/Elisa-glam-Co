'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logoutClient } from '../actions/auth'

type SessionUser = {
  id: string
  email: string
  name?: string | null
  role?: string | null
}

/**
 * Le cookie de session est httpOnly : la page vérifie la session côté client via /api/users/me.
 * Le personnel (admin / éditeur) dispose d'un accès direct au panneau d'administration.
 */
export function AccountView() {
  const router = useRouter()
  const [state, setState] = useState<'checking' | 'anon' | SessionUser>('checking')

  useEffect(() => {
    let alive = true
    fetch('/api/users/me', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return
        const user = data?.user as SessionUser | null | undefined
        setState(user ? user : 'anon')
      })
      .catch(() => alive && setState('anon'))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (state !== 'anon') return
    router.replace('/connexion')
  }, [state, router])

  if (state === 'checking') {
    return (
      <div className="border border-line bg-white/60 p-8 text-center text-muted" data-testid="account-loading">
        Chargement de votre session…
      </div>
    )
  }

  if (state === 'anon') {
    return (
      <div className="border border-line bg-white/60 p-8 text-center text-muted">
        Vous n’êtes pas connecté. Redirection vers la page de connexion…
        <p className="mt-3">
          <Link href="/connexion" className="link-underline text-leather">Ouvrir la page de connexion</Link>
        </p>
      </div>
    )
  }

  const isStaff = state.role === 'admin' || state.role === 'editor'
  const displayName = state.name?.trim() || state.email

  return (
    <div className="grid gap-5 border border-line bg-white/60 p-6 md:p-8" data-testid="account-view">
      <p className="font-serif text-[1.8rem]">Bonjour, {displayName}</p>
      <p className="text-[0.95rem] text-muted">
        Connecté en tant que <strong className="text-ink">{state.email}</strong>
        {state.role ? ` (compte ${state.role === 'editor' ? 'éditeur' : state.role === 'admin' ? 'administrateur' : 'client'})` : ''}.
      </p>

      {isStaff ? (
        <div className="border border-gold/50 bg-sand/60 px-4 py-3 text-[0.9rem] text-leather">
          Compte du personnel — accès au panneau d’administration.
        </div>
      ) : (
        <p className="text-[0.95rem] text-muted">
          Suivez une commande à tout moment depuis la page{' '}
          <Link href="/suivi-commande" className="link-underline text-leather">Suivre ma commande</Link>.
        </p>
      )}

      <div className="mt-2 grid gap-3">
        {isStaff ? (
          <a href="/admin" className="btn btn-primary w-full" data-testid="open-admin">
            Ouvrir le panneau d’administration
          </a>
        ) : null}
        <form action={logoutClient}>
          <button type="submit" className="btn btn-secondary w-full" data-testid="logout">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
