/**
 * Limiteur de débit en mémoire (par instance serveur).
 * Suffisant pour freiner les abus sur un VPS. Sur un hébergement serverless, remplacer par un store partagé
 * (ex. Upstash Redis) : voir docs/MAINTENANCE.md.
 */
const buckets = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  // Désactivable pour les tests automatisés, jamais en production
  if (process.env.DISABLE_RATE_LIMIT === '1' && process.env.NODE_ENV !== 'production') return { ok: true, retryAfterSec: 0 }
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k)
    return { ok: true, retryAfterSec: 0 }
  }
  b.count += 1
  return { ok: b.count <= max, retryAfterSec: Math.ceil((b.reset - now) / 1000) }
}
