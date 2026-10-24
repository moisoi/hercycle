import {
  GUEST_CYCLES_KEY,
  GUEST_INTIMACY_KEY,
  buildPartnerHandoffLinks,
  getAccountProfile,
  importGuestDataToAccount,
  readLocalSession,
  saveAccountProfileName,
  signInLocalAccount,
  signOutLocalAccount,
  signUpLocalAccount,
  validatePartnerEmail,
  validateWhatsappPlus251,
} from './account'

describe('Partner handoff validation (+251 WhatsApp, Instagram, Telegram, Snapchat, Email, SMS), Account Profile & Guest migration', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('enforces international +251 WhatsApp format and rejects local 0-prefixed numbers with helpful auto-suggestion', () => {
    const localZero = validateWhatsappPlus251('0911223344')
    expect(localZero.valid).toBe(false)
    expect(localZero.suggestion).toBe('+251911223344')

    const missingPlus = validateWhatsappPlus251('251911223344')
    expect(missingPlus.valid).toBe(false)
    expect(missingPlus.suggestion).toBe('+251911223344')

    const validEth = validateWhatsappPlus251('+251911223344')
    expect(validEth.valid).toBe(true)
    expect(validEth.normalized).toBe('+251911223344')
    expect(validEth.waDigits).toBe('251911223344')
  })

  test('builds valid Instagram, Telegram, Snapchat, WhatsApp, Email (Mail App + Webmail), and SMS handoff URIs', () => {
    expect(validatePartnerEmail('partner@example.com').valid).toBe(true)
    expect(validatePartnerEmail('not-an-email').valid).toBe(false)

    const links = buildPartnerHandoffLinks({
      message: 'Come hold me tonight ♡',
      handle: '@beloved_partner',
      phone: '+251911223344',
      email: 'partner@example.com',
      subject: 'Tonight',
    })
    expect(links.instagramHref).toBe('https://ig.me/m/beloved_partner')
    expect(links.telegramHref).toContain('https://t.me/beloved_partner?text=')
    expect(links.snapchatHref).toBe('https://www.snapchat.com/add/beloved_partner')
    expect(links.whatsappHref).toContain('https://wa.me/251911223344?text=')
    expect(links.whatsappWebChooserHref).toContain('https://api.whatsapp.com/send?text=')
    expect(links.gmailHref).toContain('https://mail.google.com/mail/?view=cm')
    expect(links.outlookHref).toContain('https://outlook.live.com/mail/0/deeplink/compose')
    expect(links.yahooHref).toContain('https://compose.mail.yahoo.com/')
    expect(links.smsHref).toContain('sms:%2B251911223344?body=')
    expect(links.emailHref).toContain('mailto:partner%40example.com?subject=Tonight')
  })

  test('creates, signs in, updates display name, and signs out local sanctuary accounts cleanly', () => {
    const up = signUpLocalAccount({
      email: 'hana.tekle@example.com',
      password: 'password123',
      displayName: 'Hana Tekle',
    })
    expect(up.ok).toBe(true)
    expect(readLocalSession()?.user?.email).toBe('hana.tekle@example.com')

    const profile = getAccountProfile(up.session)
    expect(profile.isSignedIn).toBe(true)
    expect(profile.displayName).toBe('Hana Tekle')
    expect(profile.initials).toBe('HT')

    saveAccountProfileName(up.session, 'Hana B.')
    expect(getAccountProfile(up.session).displayName).toBe('Hana B.')

    signOutLocalAccount()
    expect(readLocalSession()).toBeNull()

    const backIn = signInLocalAccount({
      email: 'hana.tekle@example.com',
      password: 'password123',
    })
    expect(backIn.ok).toBe(true)
    expect(getAccountProfile(backIn.session).displayName).toBe('Hana B.')
  })

  test('imports guest device entries respecting keep_account conflict strategy', async () => {
    window.localStorage.setItem(
      GUEST_CYCLES_KEY,
      JSON.stringify([
        { date: '2026-10-20', phase: 'luteal', mood: 6, energy: 5 },
        { date: '2026-10-21', phase: 'menstrual', mood: 7, energy: 6 },
      ])
    )
    window.localStorage.setItem(GUEST_INTIMACY_KEY, JSON.stringify([]))

    const upsertedBatches = []
    const mockSupabase = {
      from: (table) => ({
        select: () => ({
          eq: async () => ({
            data: table === 'cycles' ? [{ date: '2026-10-20' }] : [],
            error: null,
          }),
        }),
        upsert: async (payload) => {
          upsertedBatches.push({ table, payload })
          return { error: null }
        },
      }),
    }

    const res = await importGuestDataToAccount(mockSupabase, 'user-123', {
      conflictStrategy: 'keep_account',
    })
    expect(res.importedCycles).toBe(1)
    expect(upsertedBatches[0].payload[0].date).toBe('2026-10-21')
  })
})
