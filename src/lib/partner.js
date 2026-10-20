// Partner handoff. HerCycle never sends these messages itself. Each helper only builds a link
// that opens the user's own app, where they press send.

const E164_ETHIOPIA = /^\+251([79]\d{8})$/

/**
 * Accepts only international format, +251 followed by 9 digits starting with 7 or 9.
 * A local number starting with 0 points at the wrong WhatsApp chat, so it is rejected with a
 * specific error the form can explain.
 */
export function normalizeEthiopianMobile(input) {
  const compact = String(input || '').trim().replace(/[\s\-()]/g, '')
  if (!compact) return { valid: false, error: 'empty' }
  if (compact.startsWith('0')) return { valid: false, error: 'local' }
  const match = E164_ETHIOPIA.exec(compact)
  if (!match) return { valid: false, error: 'format' }
  return { valid: true, e164: `+251${match[1]}`, digits: `251${match[1]}` }
}

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

export const buildWhatsAppUrl = (phone, text) => {
  const { valid, digits } = normalizeEthiopianMobile(phone)
  if (!valid) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export const buildSmsUrl = (phone, text) => {
  const { valid, e164 } = normalizeEthiopianMobile(phone)
  if (!valid) return null
  return `sms:${e164}?body=${encodeURIComponent(text)}`
}

export const buildMailtoUrl = (email, subject, text) => {
  if (!isValidEmail(email)) return null
  return `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
}
