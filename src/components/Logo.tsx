import Link from 'next/link'

/**
 * Logotype provisoire (texte) en attendant le logo officiel (dossier /brand/).
 * À remplacer par le SVG officiel dès réception — voir CONTENUS_A_FOURNIR.md.
 */
export function Logo({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Elisa’glam&Co — accueil"
      className={`inline-flex flex-col items-center leading-none ${light ? 'text-ivory' : 'text-ink'} ${className}`}
    >
      <span className="font-serif text-[1.55rem] font-medium tracking-[0.02em] md:text-[1.8rem]">
        Elisa’glam<span className="text-gold">&amp;</span>Co
      </span>
      <span className="mt-1 text-[0.5rem] font-medium uppercase tracking-[0.42em] opacity-70 md:text-[0.55rem]">
        Maroquinerie · Sénégal
      </span>
    </Link>
  )
}
