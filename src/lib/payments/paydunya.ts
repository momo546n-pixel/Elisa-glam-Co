import type { PaymentProvider } from './types'

/**
 * PayDunya : canaux Wave Sénégal, Orange Money Sénégal et carte bancaire.
 * Documentation : https://developers.paydunya.com/doc/EN/http_json
 * Mode « test » = sandbox-api ; mode « live » = api (production).
 */
const CHANNELS = {
  wave: 'wave-senegal',
  orange_money: 'orange-money-senegal',
  card: 'card',
} as const

const base = () =>
  process.env.PAYDUNYA_MODE === 'live' ? 'https://app.paydunya.com/api/v1' : 'https://app.paydunya.com/sandbox-api/v1'

export const paydunyaHeaders = () => ({
  'Content-Type': 'application/json',
  'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY ?? '',
  'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY ?? '',
  'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN ?? '',
})

export type PaydunyaConfirm = {
  response_code?: string
  status?: 'pending' | 'completed' | 'cancelled' | 'failed'
  invoice?: { total_amount?: number | string; token?: string }
  custom_data?: Record<string, string>
}

/** Interroge PayDunya pour connaître l'état réel d'une facture (source de vérité, jamais le corps du webhook). */
export async function paydunyaConfirm(token: string): Promise<PaydunyaConfirm> {
  const res = await fetch(`${base()}/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
    headers: paydunyaHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayDunya confirm: HTTP ${res.status}`)
  return (await res.json()) as PaydunyaConfirm
}

export const paydunyaProvider: PaymentProvider = {
  id: 'paydunya',
  label: 'PayDunya',
  isConfigured: () =>
    Boolean(process.env.PAYDUNYA_MASTER_KEY && process.env.PAYDUNYA_PRIVATE_KEY && process.env.PAYDUNYA_TOKEN),
  supports: () => true,
  async createPayment(input) {
    const res = await fetch(`${base()}/checkout-invoice/create`, {
      method: 'POST',
      headers: paydunyaHeaders(),
      cache: 'no-store',
      body: JSON.stringify({
        invoice: {
          total_amount: input.amount,
          description: input.description,
          customer: { name: input.customer.name, phone: input.customer.phone, email: input.customer.email },
          channels: [CHANNELS[input.method]],
        },
        store: { name: 'Elisa’glam&Co', tagline: 'Maroquinerie artisanale, Made in Senegal' },
        custom_data: { order_number: input.orderNumber },
        actions: { cancel_url: input.cancelUrl, return_url: input.returnUrl, callback_url: input.callbackUrl },
      }),
    })
    const json = (await res.json().catch(() => ({}))) as {
      response_code?: string
      response_text?: string
      token?: string
      description?: string
    }
    if (!res.ok || json.response_code !== '00' || !json.response_text || !json.token) {
      throw new Error(`PayDunya: ${json.response_text || json.description || `HTTP ${res.status}`}`)
    }
    return { redirectUrl: json.response_text, reference: json.token }
  },
}
