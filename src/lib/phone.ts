/**
 * Téléphone sénégalais : +221 suivi de 9 chiffres.
 * Mobiles : 70, 75, 76, 77, 78 — fixes : 33.
 * Accepte "77 123 45 67", "+221 77 123 45 67", "00221771234567", "771234567".
 */
export function normalizeSenegalPhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('221')) digits = digits.slice(3)
  if (!/^(7[05678]|33)\d{7}$/.test(digits)) return null
  return `+221${digits}`
}

export function formatPhoneDisplay(e164: string): string {
  const m = /^\+221(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164)
  return m ? `+221 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164
}
