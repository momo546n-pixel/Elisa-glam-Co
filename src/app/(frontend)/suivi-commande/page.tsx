import type { Metadata } from 'next'
import { TrackForm } from './TrackForm'

export const metadata: Metadata = {
  title: 'Suivre ma commande',
  description: 'Suivez l’avancement de votre commande Elisa’glam&Co avec votre numéro de commande et votre téléphone.',
  alternates: { canonical: '/suivi-commande' },
}

export default function TrackPage() {
  return (
    <div className="container-eg max-w-2xl py-12 md:py-20">
      <div className="text-center">
        <p className="eyebrow mb-3">Votre commande</p>
        <h1 className="section-title text-[2.3rem] md:text-[3.2rem]">
          <span>Suivi</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">Saisissez votre numéro de commande et le téléphone utilisé lors de l’achat.</p>
      </div>
      <TrackForm />
    </div>
  )
}
