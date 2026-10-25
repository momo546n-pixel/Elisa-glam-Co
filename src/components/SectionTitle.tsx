import Link from 'next/link'

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  as: Tag = 'h2',
  className = '',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  as?: 'h1' | 'h2'
  className?: string
}) {
  return (
    <div className={`text-center ${className}`}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <Tag className="section-title text-[2rem] md:text-[2.6rem]">
        <span>{title}</span>
      </Tag>
      {subtitle ? <p className="mx-auto mt-4 max-w-xl text-[0.95rem] text-muted">{subtitle}</p> : null}
    </div>
  )
}

export function SeeAll({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="mt-10 text-center md:mt-14">
      <Link href={href} className="btn btn-secondary">
        {children}
      </Link>
    </div>
  )
}
