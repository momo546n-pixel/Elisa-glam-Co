import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayloadClient } from '@/lib/payload'
import { mediaToImage } from '@/lib/catalog'
import { SiteImage } from '@/components/SiteImage'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getPage(slug: string) {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.intro || undefined,
    alternates: { canonical: `/${slug}` },
  }
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  const hero = mediaToImage(typeof page.heroImage === 'object' ? page.heroImage : null)

  return (
    <article className="container-eg max-w-3xl py-12 md:py-20">
      <header className="text-center">
        <h1 className="section-title text-[2.3rem] md:text-[3.4rem]">
          <span>{page.title}</span>
        </h1>
        {page.intro ? <p className="mx-auto mt-5 max-w-xl text-[1.05rem] text-muted">{page.intro}</p> : null}
      </header>
      {hero ? (
        <div className="relative mt-10 aspect-[16/10] overflow-hidden bg-sand">
          <SiteImage image={hero} sizes="(min-width:768px) 768px, 100vw" priority />
        </div>
      ) : null}
      <div className="prose-eg mt-10 text-[1.02rem] leading-relaxed">
        <RichText data={page.body as never} />
      </div>
    </article>
  )
}
