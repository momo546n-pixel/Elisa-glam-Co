import type { Metadata } from 'next'
import { AccountView } from './AccountView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mon compte',
  description: 'Votre compte client Elisa’glam&Co.',
  robots: { index: false },
}

export default function AccountPage() {
  return (
    <div className="container-eg py-12 md:py-20">
      <div className="mx-auto max-w-xl">
        <header className="text-center">
          <p className="eyebrow mb-3">Votre espace</p>
          <h1 className="section-title text-[2.3rem] md:text-[2.8rem]">
            <span>Mon compte</span>
          </h1>
        </header>
        <div className="mt-10">
          <AccountView />
        </div>
      </div>
    </div>
  )
}
