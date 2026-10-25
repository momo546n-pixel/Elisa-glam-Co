import { WhatsAppIcon } from './icons'

/** Bouton WhatsApp flottant, discret, aux couleurs de la marque (pas de vert vif). */
export function WhatsAppFloat({ href }: { href: string | null }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire à Elisa’glam&Co sur WhatsApp"
      className="wa-float fixed bottom-4 right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-leather text-ivory shadow-[0_6px_20px_rgba(20,18,16,0.25)] transition-transform duration-300 hover:scale-105 hover:bg-ink md:bottom-6 md:right-6"
    >
      <WhatsAppIcon size={24} />
    </a>
  )
}
