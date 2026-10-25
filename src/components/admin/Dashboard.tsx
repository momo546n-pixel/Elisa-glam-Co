import React from 'react'
import type { Payload } from 'payload'
import { formatFCFA } from '../../lib/format'

type Props = { payload: Payload }

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  padding: '16px 18px',
  background: 'var(--theme-elevation-50)',
}

/**
 * Tableau de bord affiché en haut de l'accueil de l'administration :
 * commandes du jour, chiffre d'affaires, commandes à traiter, stocks bas.
 */
export async function Dashboard({ payload }: Props) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [today, toProcess, paidThisMonth, products] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: { createdAt: { greater_than_equal: startOfDay.toISOString() } },
      limit: 0,
      depth: 0,
    }),
    payload.find({
      collection: 'orders',
      where: { status: { in: ['received', 'confirmed', 'preparing'] } },
      limit: 20,
      sort: '-createdAt',
      depth: 0,
    }),
    payload.find({
      collection: 'orders',
      where: {
        and: [
          { paymentStatus: { equals: 'paid' } },
          { createdAt: { greater_than_equal: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString() } },
        ],
      },
      limit: 1000,
      depth: 0,
      pagination: false,
    }),
    payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 500, depth: 0, pagination: false }),
  ])

  const todayRevenue = (
    await payload.find({
      collection: 'orders',
      where: {
        and: [{ paymentStatus: { equals: 'paid' } }, { createdAt: { greater_than_equal: startOfDay.toISOString() } }],
      },
      limit: 1000,
      depth: 0,
      pagination: false,
    })
  ).docs.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const monthRevenue = paidThisMonth.docs.reduce((sum, o) => sum + (o.total ?? 0), 0)

  const lowStock: Array<{ id: number | string; label: string; stock: number }> = []
  for (const p of products.docs) {
    if (p.fulfillment === 'made_to_order') continue
    for (const c of p.colors ?? []) {
      for (const s of c.sizes ?? []) {
        if (!s.onRequest && (s.stock ?? 0) <= 2) {
          lowStock.push({ id: p.id, label: `${p.name} — ${c.name}, pointure ${s.size}`, stock: s.stock ?? 0 })
        }
      }
    }
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginTop: 0 }}>Tableau de bord</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <div style={box}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Commandes du jour</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{today.totalDocs}</div>
        </div>
        <div style={box}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Chiffre d’affaires du jour (payé)</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{formatFCFA(todayRevenue)}</div>
        </div>
        <div style={box}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Chiffre d’affaires du mois (payé)</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{formatFCFA(monthRevenue)}</div>
        </div>
        <div style={box}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Commandes à traiter</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{toProcess.totalDocs}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={box}>
          <strong>À traiter</strong>
          {toProcess.docs.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Aucune commande en attente.</p>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {toProcess.docs.map((o) => (
                <li key={o.id}>
                  <a href={`/admin/collections/orders/${o.id}`}>{o.orderNumber}</a> — {o.customerName} — {formatFCFA(o.total ?? 0)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={box}>
          <strong>Stocks bas (2 ou moins)</strong>
          {lowStock.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Aucun stock bas.</p>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {lowStock.slice(0, 15).map((l, i) => (
                <li key={i}>
                  <a href={`/admin/collections/products/${l.id}`}>{l.label}</a> : {l.stock}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
