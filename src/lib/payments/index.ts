import type { SiteSetting } from '../../payload-types'
import { mockProvider } from './mock'
import { paydunyaProvider } from './paydunya'
import type { PaymentMethodId, PaymentProvider } from './types'

export * from './types'
export { METHOD_LABELS } from './labels'

/** Prestataire actif, choisi par PAYMENT_PROVIDER (paydunya, mock ou none). */
export function getPaymentProvider(): PaymentProvider | null {
  const id = (process.env.PAYMENT_PROVIDER ?? 'none').toLowerCase()
  const provider = id === 'paydunya' ? paydunyaProvider : id === 'mock' ? mockProvider : null
  return provider && provider.isConfigured() ? provider : null
}

/** Modes de paiement disponibles pour une zone donnée. */
export function availableMethods(
  settings: SiteSetting,
  zone: { codAvailable?: boolean | null } | null,
): PaymentMethodId[] {
  const provider = getPaymentProvider()
  const out: PaymentMethodId[] = []
  if (provider && settings.enableMobileMoney !== false) {
    if (provider.supports('wave')) out.push('wave')
    if (provider.supports('orange_money')) out.push('orange_money')
  }
  if (provider && settings.enableCard && provider.supports('card')) out.push('card')
  if (settings.enableCod !== false && zone?.codAvailable) out.push('cod')
  return out
}
