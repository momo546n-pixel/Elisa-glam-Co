import { withPayload } from '@payloadcms/next/withPayload'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Autorise les appareils du réseau local (PC, téléphone, tablette) à accéder
  // au serveur de développement via l'IP LAN — sinon les scripts de dev sont
  // bloqués et les boutons ne réagissent pas côté navigateur.
  allowedDevOrigins: ['192.168.1.4', '192.168.1.*'],
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/**' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  poweredByHeader: false,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
