// Partner messages are handed off to the user's own apps (WhatsApp, SMS, email).
// Nothing is sent by HerCycle's servers: these helpers only build links.

const ETHIOPIA_MOBILE = /^\+251[79]\d{8}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Accepts only international Ethiopian mobile numbers: +251 then 9 digits starting 7 or 9.
 * Spaces, dashes, and brackets are ignored while typing. A local number starting with 0 is
 * rejected, because wa.me and sms links would point at the wrong chat.
 */
export function normalizeEthiopianMobile(input = '') {
  const compact = String(input).replace(/[\s()-]/g, '')
  if (compact.startsWith('0')) {
    return { valid: false, error: 'local', value: compact }
  }
  const withPlus = compact.startsWith('251') ? `+${compact}` : compact
  if (!ETHIOPIA_MOBILE.test(withPlus)) {
    return { valid: false, error: 'format', value: withPlus }
  }
  return { valid: true, error: null, value: withPlus }
}

export const isValidEmail = (value = '') => EMAIL.test(String(value).trim())

export function buildWhatsAppUrl(e164, message) {
  const digits = String(e164).replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildSmsUrl(e164, message) {
  return `sms:${e164}?body=${encodeURIComponent(message)}`
}

export function buildMailtoUrl(email, subject, message) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
}
