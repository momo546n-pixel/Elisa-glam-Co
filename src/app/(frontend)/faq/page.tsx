import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { Accordion } from '@/components/Accordion'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description: 'Tailles, matières, commandes, paiement, entretien et livraison : les réponses à vos questions.',
  alternates: { canonical: '/faq' },
}

const CATEGORY_LABELS: Record<string, string> = {
  sizes: 'Tailles',
  materials: 'Matières',
  orders: 'Commandes',
  payment: 'Paiement',
  care: 'Entretien',
  delivery: 'Livraison',
}

export default async function FaqPage() {
  const payload = await getPayloadClient()
  const faq = await payload.findGlobal({ slug: 'faq' })
  const items = faq.items ?? []

  const groups = Object.keys(CATEGORY_LABELS)
    .map((k) => ({ key: k, label: CATEGORY_LABELS[k], items: items.filter((i) => i.category === k) }))
    .filter((g) => g.items.length)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }

  return (
    <div className="container-eg max-w-3xl py-12 md:py-20">
      <header className="text-center">
        <p className="eyebrow mb-3">Aide</p>
        <h1 className="section-title text-[2.3rem] md:text-[3.4rem]">
          <span>Questions fréquentes</span>
        </h1>
        {faq.intro ? <p className="mx-auto mt-5 max-w-xl text-muted">{faq.intro}</p> : null}
      </header>

      <div className="mt-12 space-y-12">
        {groups.map((g) => (
          <section key={g.key} aria-labelledby={`faq-${g.key}`}>
            <h2 id={`faq-${g.key}`} className="mb-4 font-serif text-[1.7rem]">
              {g.label}
            </h2>
            <Accordion items={g.items.map((i, idx) => ({ id: `${g.key}-${idx}`, title: i.question.replace(/^./, (c) => c), content: <p className="whitespace-pre-line normal-case tracking-normal">{i.answer}</p> }))} />
          </section>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}
