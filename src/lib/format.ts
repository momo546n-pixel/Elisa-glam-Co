/** Formate un montant en FCFA : 45 000 FCFA (espace insécable). */
export function formatFCFA(amount: number): string {
  const n = Math.round(amount)
  const grouped = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${grouped} FCFA`
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(date),
  )
}
