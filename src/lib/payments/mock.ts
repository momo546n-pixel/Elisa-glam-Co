import { signOrder } from '../order-token'
import { SITE_URL } from '../payload'
import type { PaymentProvider } from './types'

/** Prestataire de SIMULATION pour tester le tunnel de bout en bout sans compte. Désactivé en production. */
export const mockProvider: PaymentProvider = {
  id: 'mock',
  label: 'Simulation (test)',
  isConfigured: () => process.env.NODE_ENV !== 'production',
  supports: () => true,
  async createPayment(input) {
    const url = new URL(`${SITE_URL}/paiement/simulation`)
    url.searchParams.set('o', input.orderNumber)
    url.searchParams.set('t', signOrder(input.orderNumber))
    return { redirectUrl: url.toString(), reference: `MOCK-${input.orderNumber}` }
  },
}
