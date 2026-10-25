export type PaymentMethodId = 'wave' | 'orange_money' | 'card' | 'cod'

export type CreatePaymentInput = {
  orderNumber: string
  /** Montant total en FCFA (XOF), entier */
  amount: number
  description: string
  customer: { name: string; phone: string; email?: string }
  method: Exclude<PaymentMethodId, 'cod'>
  returnUrl: string
  cancelUrl: string
  callbackUrl: string
}

export type CreatePaymentResult = {
  redirectUrl: string
  /** Référence ou jeton côté prestataire */
  reference: string
}

/**
 * Couche d'abstraction des paiements : ajouter ou changer de prestataire
 * sans toucher au tunnel de commande. Chaque prestataire gère aussi son propre webhook.
 */
export interface PaymentProvider {
  readonly id: string
  readonly label: string
  /** Les clés nécessaires sont-elles présentes ? */
  isConfigured(): boolean
  supports(method: Exclude<PaymentMethodId, 'cod'>): boolean
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
}
