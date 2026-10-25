'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-eg max-w-xl py-28 text-center">
      <p className="eyebrow mb-3">Oups</p>
      <h1 className="text-[2.4rem] md:text-[3rem]">Une erreur est survenue</h1>
      <p className="mt-5 text-muted">Veuillez réessayer. Si le problème persiste, écrivez-nous sur WhatsApp.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Réessayer
      </button>
    </div>
  )
}
