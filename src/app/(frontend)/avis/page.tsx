import type { Metadata } from 'next'
import { ReviewForm } from './ReviewForm'

export const metadata: Metadata = {
  title: 'Donner mon avis',
  description: 'Vous avez reçu votre commande ? Partagez votre avis sur votre achat Elisa’glam&Co.',
  alternates: { canonical: '/avis' },
}

export default function AvisPage() {
  return (
    <div className="container-eg max-w-2xl py-12 md:py-20">
      <div className="text-center">
        <p className="eyebrow mb-3">Après votre achat</p>
        <h1 className="section-title text-[2.3rem] md:text-[3.2rem]">
          <span>Donner mon avis</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Seuls les clients dont la commande a été livrée peuvent donner leur avis. Chaque avis est relu avant publication, avec votre prénom, la date et le produit acheté.
        </p>
      </div>
      <ReviewForm />
    </div>
  )
}
