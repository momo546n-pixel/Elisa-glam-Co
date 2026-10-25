/** Construit un lien wa.me avec message prérempli. `phone` au format international (+221…). */
export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
