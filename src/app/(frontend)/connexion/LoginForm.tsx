'use client'

import { useActionState } from 'react'
import { loginClient, type AuthState } from '../actions/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginClient, { ok: false })
  const e = state.errors ?? {}
  const field = (k: string) => ({ 'aria-invalid': e[k] ? true : undefined, 'aria-describedby': e[k] ? `login-${k}-error` : undefined })
  const err = (k: string) => (e[k] ? <p id={`login-${k}-error`} className="field-error" role="alert">{e[k]}</p> : null)

  return (
    <form action={action} noValidate className="grid gap-5 border border-line bg-white/60 p-6 md:p-8" data-testid="login-form">
      <div>
        <label htmlFor="login-email" className="field-label">Email *</label>
        <input
          id="login-email"
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
        <label htmlFor="login-password" className="field-label">Mot de passe *</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
          {...field('password')}
        />
        {err('password')}
      </div>
      {state.message && !state.ok ? (
        <p role="alert" className="text-sm text-[#7a2222]">{state.message}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full" data-testid="login-submit">
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
