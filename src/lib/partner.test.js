import {
  buildMailtoUrl,
  buildSmsUrl,
  buildWhatsAppUrl,
  isValidEmail,
  normalizeEthiopianMobile,
} from './partner'

describe('normalizeEthiopianMobile', () => {
  test('accepts international Ethiopian mobile numbers, ignoring spacing', () => {
    expect(normalizeEthiopianMobile('+251 911 234 567')).toEqual({ valid: true, error: null, value: '+251911234567' })
    expect(normalizeEthiopianMobile('+251-712-345-678').valid).toBe(true)
  })

  test('rejects a local number that starts with 0, which would point at the wrong chat', () => {
    expect(normalizeEthiopianMobile('0911234567')).toMatchObject({ valid: false, error: 'local' })
  })

  test('rejects other formats, wrong prefixes, and wrong lengths', () => {
    expect(normalizeEthiopianMobile('+251 811 234 567').valid).toBe(false)
    expect(normalizeEthiopianMobile('+251 91123').valid).toBe(false)
    expect(normalizeEthiopianMobile('+254711234567').valid).toBe(false)
    expect(normalizeEthiopianMobile('').valid).toBe(false)
  })
})

describe('partner handoff links', () => {
  test('WhatsApp uses digits only, without the plus sign', () => {
    const url = buildWhatsAppUrl('+251911234567', 'Hi love & more')
    expect(url).toBe('https://wa.me/251911234567?text=Hi%20love%20%26%20more')
  })

  test('SMS keeps the international number and encodes the body', () => {
    expect(buildSmsUrl('+251911234567', 'Tonight?')).toBe('sms:+251911234567?body=Tonight%3F')
  })

  test('email validates the address and builds a mailto link', () => {
    expect(isValidEmail('me@example.com')).toBe(true)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(buildMailtoUrl('me@example.com', 'Hey', 'Line 1')).toBe('mailto:me%40example.com?subject=Hey&body=Line%201')
  })
})
