import Image from 'next/image'
import type { ImageDTO } from '../lib/catalog'

type Props = {
  image: ImageDTO | null | undefined
  /** Texte alternatif de repli */
  alt?: string
  sizes: string
  variant?: 'card' | 'large'
  priority?: boolean
  className?: string
  /** Affiche la mention « [PHOTO À FOURNIR] » dans le placeholder */
  label?: boolean
  rounded?: boolean
}

/** Silhouette de sandale originale, utilisée uniquement dans les placeholders. */
function SandaleOutline() {
  return (
    <svg viewBox="0 0 220 130" className="w-1/2 max-w-[11rem] opacity-40" fill="none" stroke="#7A4E2D" strokeWidth="1.2" aria-hidden="true">
      <path d="M22 78c0-22 30-36 74-36h56c26 0 44 12 44 30 0 20-20 32-46 32H66c-26 0-44-10-44-26z" />
      <path d="M96 45c4 26 30 30 46 4" />
      <path d="M104 52c6 14 22 14 30 0" opacity=".5" />
    </svg>
  )
}

export function Placeholder({ label = true, className = '' }: { label?: boolean; className?: string }) {
  return (
    <div
      role="img"
      aria-label="Photo à fournir"
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#efe6d8] via-[#e9dfd0] to-[#dccfba] ${className}`}
    >
      <SandaleOutline />
      {label ? (
        <span className="px-3 text-center text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted">
          [Photo à fournir]
        </span>
      ) : null}
    </div>
  )
}

/**
 * Image du site : photo optimisée si disponible, sinon placeholder neutre.
 * Le parent doit être `relative` avec un ratio défini.
 */
export function SiteImage({ image, alt, sizes, variant = 'card', priority, className = '', label = true }: Props) {
  if (!image) return <Placeholder label={label} />
  const src = variant === 'large' ? image.largeUrl : image.cardUrl
  const external = /^https?:\/\//.test(src)
  return (
    <Image
      src={src}
      alt={image.alt || alt || ''}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={external}
      className={`object-cover ${className}`}
    />
  )
}
