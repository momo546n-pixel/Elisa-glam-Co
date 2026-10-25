import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { verifyOrderToken } from '@/lib/order-token'
import { findOrderByNumber } from '@/lib/orders'
import { getSettings } from '@/lib/payload'
import { getPaymentProvider, METHOD_LABELS } from '@/lib/payments'
import { formatFCFA } from '@/lib/format'
import { whatsappLink } from '@/lib/whatsapp'
import { ConfirmationEffects, PaymentPoller, RetryPayment } from './ConfirmationClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Confirmation de commande', robots: { index: false, follow: false } }

type Props = {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ t?: string; annule?: string }>
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { orderNumber } = await params
  const { t, annule } = await searchParams
  if (!verifyOrderToken(orderNumber, t)) notFound()
  const order = await findOrderByNumber(orderNumber)
  if (!order) notFound()

  const settings = await getSettings()
  const isCod = order.paymentMethod === 'cod'
  const paid = order.paymentStatus === 'paid'
  const failed = order.paymentStatus === 'failed' || (!paid && !isCod && Boolean(annule))
  const pending = !paid && !isCod && !failed
  const cancelled = order.status === 'cancelled'

  const waMessage = `Bonjour Elisa’glam&Co, je vous contacte au sujet de ma commande ${order.orderNumber} (${formatFCFA(order.total)}).`
  const wa = settings.whatsappNumber ? whatsappLink(settings.whatsappNumber, waMessage) : null
  const canRetry = !isCod && !paid && !cancelled && Boolean(getPaymentProvider())

  const headline = paid
    ? 'Paiement confirmé, merci !'
    : isCod
      ? 'Commande reçue, merci !'
      : failed
        ? 'Paiement non abouti'
        : 'Paiement en cours de vérification'

  const message = paid
    ? 'Nous avons bien reçu votre paiement. Nous préparons votre commande avec soin.'
    : isCod
      ? 'Nous allons vous contacter par WhatsApp ou par appel pour confirmer votre commande avant la préparation. Vous réglerez à la livraison.'
      : failed
        ? 'Votre paiement n’a pas été finalisé et aucun montant n’a été débité. Vous pouvez réessayer ci-dessous.'
        : 'Nous attendons la confirmation de votre opérateur. Cette page se met à jour automatiquement.'

  return (
    <div className="container-eg max-w-3xl py-12 md:py-20">
      <ConfirmationEffects orderNumber={order.orderNumber as string} paid={paid} cod={isCod} total={order.total} clearCart={paid || isCod} />
      {pending ? <PaymentPoller /> : null}

      <div className="text-center">
        <p className="eyebrow mb-3">Commande {order.orderNumber}</p>
        <h1 className="text-[2.4rem] md:text-[3.2rem]" data-testid="confirmation-title">
          {headline}
        </h1>
        <span className="mx-auto mt-5 block h-px w-12 bg-gold" aria-hidden="true" />
        <p className="mx-auto mt-5 max-w-lg text-[1rem] text-[#2c2723]">{message}</p>
      </div>

      {canRetry && (failed || pending) ? <RetryPayment orderNumber={order.orderNumber as string} token={t as string} current={order.paymentMethod} /> : null}

      <section className="mt-12 border border-line bg-white/60 p-6 md:p-8" aria-label="Récapitulatif">
        <h2 className="font-serif text-[1.6rem]">Récapitulatif</h2>
        <ul className="mt-4 divide-y divide-line">
          {(order.items ?? []).map((i, idx) => (
            <li key={idx} className="flex justify-between gap-4 py-3 text-[0.95rem]">
              <span>
                {i.productName} <span className="text-muted">· {i.color}, pointure {i.size} · ×{i.quantity}</span>
              </span>
              <span className="shrink-0">{formatFCFA((i.unitPrice ?? 0) * (i.quantity ?? 1))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[0.95rem]">
          <div className="flex justify-between">
            <dt className="text-muted">Sous-total</dt>
            <dd>{formatFCFA(order.subtotal)}</dd>
          </div>
          {order.discount ? (
            <div className="flex justify-between">
              <dt className="text-muted">Réduction</dt>
              <dd>-{formatFCFA(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted">Livraison ({order.deliveryZoneName})</dt>
            <dd>{order.deliveryFee ? formatFCFA(order.deliveryFee) : 'Offerte'}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-medium">Total</dt>
            <dd className="font-serif text-[1.6rem]">{formatFCFA(order.total)}</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-muted">
          Paiement : {METHOD_LABELS[order.paymentMethod]?.label} · Livraison à : {order.address}
        </p>
      </section>

      <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
        <Link href="/suivi-commande" className="btn btn-secondary">
          Suivre ma commande
        </Link>
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {isCod ? 'Confirmer sur WhatsApp' : 'Une question ? WhatsApp'}
          </a>
        ) : null}
        <Link href="/boutique" className="btn btn-secondary">
          Continuer mes achats
        </Link>
      </div>
      <p className="mt-6 text-center text-sm text-muted">Conservez votre numéro de commande : il vous servira, avec votre téléphone, à suivre la livraison.</p>
    </div>
  )
}
