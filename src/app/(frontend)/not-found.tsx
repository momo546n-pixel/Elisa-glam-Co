import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-eg max-w-xl py-28 text-center">
      <p className="eyebrow mb-3">Erreur 404</p>
      <h1 className="text-[2.6rem] md:text-[3.4rem]">Page introuvable</h1>
      <span className="mx-auto mt-5 block h-px w-12 bg-gold" aria-hidden="true" />
      <p className="mt-5 text-muted">La page que vous cherchez n’existe pas ou a été déplacée.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn btn-secondary">
          Retour à l’accueil
        </Link>
        <Link href="/boutique" className="btn btn-primary">
          Voir la boutique
        </Link>
      </div>
    </div>
  )
}
