import { ChevronDown } from './icons'

/** Accordéon natif (<details>) : accessible au clavier, sans JavaScript. */
export function Accordion({
  items,
  className = '',
}: {
  items: { id?: string; title: string; content: React.ReactNode; open?: boolean }[]
  className?: string
}) {
  return (
    <div className={`border-t border-line ${className}`}>
      {items.map((item, i) => (
        <details key={item.id ?? i} className="group border-b border-line" open={item.open}>
          <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-4 text-[0.82rem] font-medium uppercase tracking-[0.16em] hover:text-leather">
            <span>{item.title}</span>
            <ChevronDown size={18} className="shrink-0 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <div className="pb-6 text-[0.95rem] leading-relaxed text-[#2c2723]">{item.content}</div>
        </details>
      ))}
    </div>
  )
}
