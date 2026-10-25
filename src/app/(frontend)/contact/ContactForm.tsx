'use client'

import { useActionState } from 'react'
import { submitContact, type ContactState } from '../actions/contact'

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, { ok: false })
  const e = state.errors ?? {}
  const field = (k: string) => ({ 'aria-invalid': e[k] ? true : undefined, 'aria-describedby': e[k] ? `c-${k}-error` : undefined })
  const err = (k: string) => (e[k] ? <p id={`c-${k}-error`} className="field-error" role="alert">{e[k]}</p> : null)

  if (state.ok) {
    return (
      <div role="status" className="border border-line bg-white/60 p-8 text-center" data-testid="contact-success">
        <p className="font-serif text-[1.8rem]">Message envoyé</p>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={action} noValidate className="grid gap-5 border border-line bg-white/60 p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">Nom *</label>
          <input id="c-name" name="name" autoComplete="name" className="field" {...field('name')} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="c-phone" className="field-label">Téléphone</label>
          <input id="c-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" className="field" {...field('phone')} />
          {err('phone')}
        </div>
      </div>
      <div>
        <label htmlFor="c-email" className="field-label">Email</label>
        <input id="c-email" name="email" type="email" autoComplete="email" className="field" {...field('email')} />
        {err('email')}
      </div>
      <div>
        <label htmlFor="c-subject" className="field-label">Objet *</label>
        <input id="c-subject" name="subject" className="field" {...field('subject')} />
        {err('subject')}
      </div>
      <div>
        <label htmlFor="c-message" className="field-label">Message *</label>
        <textarea id="c-message" name="message" rows={5} className="field" {...field('message')} />
        {err('message')}
      </div>
      {/* Champ piège anti-robots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="c-website">Ne pas remplir</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.message && !state.ok ? (
        <p role="alert" className="text-sm text-[#7a2222]">{state.message}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Envoi…' : 'Envoyer le message'}
      </button>
    </form>
  )
}
