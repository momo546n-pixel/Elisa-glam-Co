'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Comptes du site :
 * - « client » : visiteurs qui se connectent pour retrouver leurs informations (créés via /inscription) ;
 * - admin / éditeur : le personnel, redirigé vers le panneau d'administration (/admin) après connexion.
 *
 * L'API locale Payload ne passe pas par les règles d'accès des collections (comportement voulu :
 * les formulaires publics créent uniquement le rôle « client » explicitement). Les données
 * sensibles (commandes, messages) restent lisibles par les rôles admin/éditeur uniquement.
 */

export type AuthState = { ok: boolean; message?: string; errors?: Record<string, string> }

/** Cookie d'authentification Payload (même nom que celui défini par l'API REST / l'admin). */
const AUTH_COOKIE = 'payload-token'

// Cookie « secure » uniquement sur un site servi en HTTPS (localhost en HTTP reste possible)
const COOKIE_SECURE = process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https')

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(120).email('Adresse email invalide.'),
  password: z.string().min(1, 'Entrez votre mot de passe.').max(72, 'Mot de passe trop long.'),
})

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Indiquez votre nom.').max(80),
    email: z.string().trim().toLowerCase().max(120).email('Adresse email invalide.'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
      .max(72, 'Mot de passe trop long (72 caractères maximum).'),
    confirm: z.string(),
    website: z.string().max(0).optional(), // champ piège anti-robots
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Les deux mots de passe ne correspondent pas.',
  })

/** Erreurs renvoyées par Payload (identifiants invalides, compte verrouillé…). */
function friendlyAuthError(error: unknown): string {
  const raw =
    error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : ''
  if (/maximum|locked|verrou/i.test(raw)) {
    return 'Trop de tentatives échouées. Réessayez dans quelques minutes, ou contactez-nous si vous avez perdu vos accès.'
  }
  return 'Email ou mot de passe incorrect.'
}

/** Redirection Next : un digest NEXT_REDIRECT_… qui ne doit pas être avalé par le try/catch. */
function isRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

export async function setSessionCookie(token: string, exp?: number): Promise<void> {
  const jar = await cookies()
  const maxAge = exp != null ? Math.max(60, Math.floor(exp - Date.now() / 1000)) : 60 * 60 * 12
  jar.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // vrai sur le domaine HTTPS de production, faux sur localhost en HTTP
    secure: COOKIE_SECURE,
    maxAge,
  })
}

/* ────────────────────────────── Connexion ────────────────────────────── */

export async function loginClient(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const rl = rateLimit(`login:${await clientIp()}`, 10, 10 * 60_000)
  if (!rl.ok) return { ok: false, message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message
    return { ok: false, errors }
  }

  const payload = await getPayloadClient()
  try {
    const res = await payload.login({
      collection: 'users',
      data: { email: parsed.data.email, password: parsed.data.password },
    })
    const { token, exp, user: account } = res
    if (!token || !account) return { ok: false, message: 'Connexion impossible pour le moment. Réessayez.' }
    await setSessionCookie(token, exp)
    // Le personnel va au panneau d'administration, le client à son espace.
    if (account.role === 'client') redirect('/compte')
    redirect('/admin')
  } catch (error) {
    if (isRedirect(error)) throw error
    return { ok: false, message: friendlyAuthError(error) }
  }
}

/* ────────────────────────────── Inscription ────────────────────────────── */

export async function registerClient(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const rl = rateLimit(`register:${await clientIp()}`, 3, 30 * 60_000)
  if (!rl.ok) return { ok: false, message: 'Trop de tentatives d’inscription. Réessayez dans quelques minutes.' }

  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message
    return { ok: false, errors }
  }
  const d = parsed.data
  if (d.website) return { ok: true, message: 'Compte créé. Vous pouvez vous connecter.' } // robot : on fait semblant

  const payload = await getPayloadClient()

  // Sécurité : le tout premier compte (administratrice) se crée via /admin, jamais depuis ce formulaire public.
  const { totalDocs: existingUsers } = await payload.count({ collection: 'users' })
  if (existingUsers === 0) {
    return {
      ok: false,
      message:
        'La création de comptes sera disponible après la configuration de l’espace d’administration (/admin).',
    }
  }

  // Unicité de l'email
  const taken = await payload.count({ collection: 'users', where: { email: { equals: d.email } } })
  if (taken.totalDocs > 0) {
    return { ok: false, errors: { email: 'Un compte existe déjà avec cette adresse. Connectez-vous ou utilisez « Mot de passe oublié ».' } }
  }

  try {
    // rôle « client » explicite : ce formulaire ne peut jamais créer d'administrateur
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { name: d.name, email: d.email, password: d.password, role: 'client' },
    })
  } catch (error) {
    if (isRedirect(error)) throw error
    return { ok: false, message: friendlyAuthError(error) }
  }

  // Connexion immédiate : on ouvre la session comme après une connexion classique.
  try {
    const res = await payload.login({ collection: 'users', data: { email: d.email, password: d.password } })
    if (res.token) await setSessionCookie(res.token, res.exp)
  } catch {
    /* la session ne s'ouvre pas : le formulaire de connexion reste disponible */
  }
  redirect('/compte')
}

/* ────────────────────────────── Déconnexion ────────────────────────────── */

export async function logoutClient(): Promise<void> {
  const jar = await cookies()
  jar.delete(AUTH_COOKIE)
  redirect('/')
}
