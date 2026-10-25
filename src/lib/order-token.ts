import { createHmac, timingSafeEqual } from 'node:crypto'

/** Jeton signé qui autorise l'affichage de la page de confirmation d'une commande. */
export function signOrder(orderNumber: string): string {
  const secret = process.env.PAYLOAD_SECRET ?? ''
  return createHmac('sha256', secret).update(`order:${orderNumber}`).digest('hex').slice(0, 24)
}

export function verifyOrderToken(orderNumber: string, token: string | undefined | null): boolean {
  if (!token) return false
  const expected = Buffer.from(signOrder(orderNumber))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
