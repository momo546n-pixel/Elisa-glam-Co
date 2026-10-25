import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { whatsappLink } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Guide des pointures',
  description: 'Mesurez votre pied et trouvez la pointure idéale : tableau de correspondance EU / UK / US et conseils.',
  alternates: { canonical: '/guide-des-pointures' },
}

export default async function SizeGuidePage() {
  const payload = await getPayloadClient()
  const [guide, settings] = await Promise.all([payload.findGlobal({ slug: 'size-guide' }), getSettings()])
  const wa = settings.whatsappNumber ? whatsappLink(settings.whatsappNumber, 'Bonjour, j’ai une question sur le choix de ma pointure.') : null

  return (
    <div className="container-eg max-w-3xl py-12 md:py-20">
      <header className="text-center">
        <p className="eyebrow mb-3">Aide</p>
        <h1 className="section-title text-[2.3rem] md:text-[3.4rem]">
          <span>Guide des pointures</span>
        </h1>
        {guide.intro ? <p className="mx-auto mt-5 max-w-xl text-muted">{guide.intro}</p> : null}
      </header>

      {guide.rows?.length ? (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-center">
            <caption className="sr-only">Correspondance des pointures</caption>
            <thead>
              <tr className="border-y border-ink text-[0.75rem] uppercase tracking-[0.16em]">
                <th scope="col" className="py-3">EU</th>
                <th scope="col" className="py-3">UK</th>
                <th scope="col" className="py-3">US</th>
                <th scope="col" className="py-3">Pied (cm)</th>
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((r, i) => (
                <tr key={i} className="border-b border-line even:bg-sand/40">
                  <th scope="row" className="py-3 font-serif text-[1.2rem] font-medium">{r.eu}</th>
                  <td className="py-3">{r.uk || '—'}</td>
                  <td className="py-3">{r.us || '—'}</td>
                  <td className="py-3">{r.footLengthCm || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {guide.note ? <p className="mt-3 text-xs text-muted">{guide.note}</p> : null}
        </div>
      ) : null}

      {guide.tips?.length ? (
        <section className="mt-14">
          <h2 className="text-center font-serif text-[1.9rem]">Bien choisir sa pointure</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {guide.tips.map((t, i) => (
              <li key={i} className="border border-line bg-white/50 p-6">
                <h3 className="font-serif text-[1.35rem]">{t.title}</h3>
                <p className="mt-2 text-[0.95rem] text-[#2c2723]">{t.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-12 text-center">
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Demander conseil sur WhatsApp
          </a>
        ) : (
          <Link href="/contact" className="btn btn-primary">
            Nous contacter
          </Link>
        )}
      </div>
    </div>
  )
}
