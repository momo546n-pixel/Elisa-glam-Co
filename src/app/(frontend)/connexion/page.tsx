import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre compte Elisa’glam&Co : espace client et panneau d’administration.',
  robots: { index: false },
}

export default function LoginPage() {
  return (
    <div className="container-eg py-12 md:py-20">
      <div className="mx-auto max-w-md">
        <header className="text-center">
          <p className="eyebrow mb-3">Votre compte</p>
          <h1 className="section-title text-[2.3rem] md:text-[2.8rem]">
            <span>Connexion</span>
          </h1>
          <p className="mt-4 text-muted">
            Espace client pour retrouver vos informations, ou accès du personnel au panneau d’administration.
          </p>
        </header>

        <div className="mt-10">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-[0.92rem] text-muted">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="link-underline text-leather">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
