import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 20, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const MenuIcon = (p: P) => (
  <Base {...p}>
    <path d="M3 7h18M3 12h18M3 17h18" />
  </Base>
)
export const CloseIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 5l14 14M19 5L5 19" />
  </Base>
)
export const BagIcon = (p: P) => (
  <Base {...p}>
    <path d="M5.5 8h13l-1 12h-11l-1-12z" />
    <path d="M9 8V6.5a3 3 0 016 0V8" />
  </Base>
)
export const SearchIcon = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Base>
)
export const UserIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5.2 19.6c1-3.4 3.6-5.1 6.8-5.1s5.8 1.7 6.8 5.1" />
  </Base>
)
export const PlusIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)
export const MinusIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
)
export const ChevronDown = (p: P) => (
  <Base {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
)
export const ArrowRight = (p: P) => (
  <Base {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </Base>
)
export const CheckIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
)
export const ZoomIcon = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" />
  </Base>
)

export const WhatsAppIcon = ({ size = 22, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.87 9.87 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
  </svg>
)

export const InstagramIcon = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
  </Base>
)
export const FacebookIcon = (p: P) => (
  <Base {...p}>
    <path d="M14 8.5h2.5V5H14c-2.2 0-3.5 1.5-3.5 3.6V11H8v3.5h2.5V21H14v-6.5h2.4L17 11h-3V9.2c0-.5.3-.7 1-.7z" />
  </Base>
)
export const TikTokIcon = (p: P) => (
  <Base {...p}>
    <path d="M14 3v11.2a3.2 3.2 0 11-3.2-3.2" />
    <path d="M14 3c.4 2.4 2 4 4.5 4.2" />
  </Base>
)

/* Pictogrammes des engagements (traits fins, sobres) */
export const CraftIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 17c2-6 6-9 11-9 2 0 4 .6 5 1.5-1 5-5 8.5-10 8.5-2.5 0-4.5-.3-6-1z" />
    <path d="M9 14l6-4" />
  </Base>
)
export const LeatherIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 6l3-2 4 2 4-2 3 2-1.5 4L17 11v8H7v-8l-.5-1z" />
  </Base>
)
export const SenegalIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8.2l1.1 2.3 2.5.35-1.8 1.75.45 2.5L12 13.9l-2.25 1.2.45-2.5-1.8-1.75 2.5-.35z" />
  </Base>
)
export const DeliveryIcon = (p: P) => (
  <Base {...p}>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
    <circle cx="7" cy="17" r="1.6" />
    <circle cx="17" cy="17" r="1.6" />
  </Base>
)
export const ExchangeIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 9h13l-3-3M20 15H7l3 3" />
  </Base>
)
export const SecureIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </Base>
)

export const COMMITMENT_ICONS = {
  craft: CraftIcon,
  leather: LeatherIcon,
  senegal: SenegalIcon,
  delivery: DeliveryIcon,
  exchange: ExchangeIcon,
  secure: SecureIcon,
} as const
