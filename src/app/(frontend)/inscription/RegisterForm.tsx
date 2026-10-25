'use client'

import { useActionState } from 'react'
import { registerClient, type AuthState } from '../actions/auth'

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerClient, { ok: false })
  const e = state.errors ?? {}
  const field = (k: string) => ({ 'aria-invalid': e[k] ? true : undefined, 'aria-describedby': e[k] ? `reg-${k}-error` : undefined })
  const err = (k: string) => (e[k] ? <p id={`reg-${k}-error`} className="field-error" role="alert">{e[k]}</p> : null)

  if (state.ok) {
    return (
      <div role="status" className="border border-line bg-white/60 p-8 text-center" data-testid="register-success">
        <p className="font-serif text-[1.8rem]">Compte créé</p>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={action} noValidate className="grid gap-5 border border-line bg-white/60 p-6 md:p-8" data-testid="register-form">
      <div>
        <label htmlFor="reg-name" className="field-label">Nom complet *</label>
        <input
          id="reg-name"
          name="name"
          autoComplete="name"
          required
          className="field"
          {...field('name')}
        />
        {err('name')}
      </div>
      <div>
        <label htmlFor="reg-email" className="field-label">Email *</label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
          {...field('email')}
        />
        {err('email')}
      </div>
      <div>
        <label htmlFor="reg-password" className="field-label">Mot de passe *</label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="field"
          {...field('password')}
          aria-describedby={e.password ? 'reg-password-error' : 'reg-password-hint'}
        />
        {err('password') ?? <p id="reg-password-hint" className="field-hint">8 caractères minimum.</p>}
      </div>
      <div>
        <label htmlFor="reg-confirm" className="field-label">Confirmer le mot de passe *</label>
        <input
          id="reg-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="field"
          {...field('confirm')}
        />
        {err('confirm')}
      </div>
      {/* Champ piège anti-robots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="reg-website">Ne pas remplir</label>
        <input id="reg-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.message && !state.ok ? (
        <p role="alert" className="text-sm text-[#7a2222]">{state.message}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full" data-testid="register-submit">
        {pending ? 'Création…' : 'Créer mon compte'}
      </button>
    </form>
  )
}
