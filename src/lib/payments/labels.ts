import type { PaymentMethodId } from './types'

export const METHOD_LABELS: Record<PaymentMethodId, { label: string; hint: string }> = {
  wave: { label: 'Wave', hint: 'Paiement mobile immédiat' },
  orange_money: { label: 'Orange Money', hint: 'Paiement mobile immédiat' },
  card: { label: 'Carte bancaire', hint: 'Visa, Mastercard' },
  cod: { label: 'Paiement à la livraison', hint: 'Nous confirmons votre commande par WhatsApp avant la préparation' },
}
