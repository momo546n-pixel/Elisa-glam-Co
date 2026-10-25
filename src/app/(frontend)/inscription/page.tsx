import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from './RegisterForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte client Elisa’glam&Co pour retrouver plus vite vos informations et commandes.',
  robots: { index: false },
}

export default function RegisterPage() {
  return (
    <div className="container-eg py-12 md:py-20">
      <div className="mx-auto max-w-md">
        <header className="text-center">
          <p className="eyebrow mb-3">Nouveau client</p>
          <h1 className="section-title text-[2.3rem] md:text-[2.8rem]">
            <span>Créer un compte</span>
          </h1>
          <p className="mt-4 text-muted">
            Votre panier reste enregistré sur cet appareil ; le compte sert à vous identifier lors du paiement et
            à retrouver vos commandes.
          </p>
        </header>

        <div className="mt-10">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-[0.92rem] text-muted">
          Vous avez déjà un compte ?{' '}
          <Link href="/connexion" className="link-underline text-leather">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
