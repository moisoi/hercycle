import { supabase } from './supabase'

export const GUEST_CYCLES_KEY = 'hercycle.local.cycles'
export const GUEST_INTIMACY_KEY = 'hercycle.local.intimacy'
export const GUEST_MIGRATION_DISMISSED_PREFIX = 'hercycle.migration.dismissed.'
export const LOCAL_ACCOUNTS_KEY = 'hercycle.local.accounts'
export const LOCAL_SESSION_KEY = 'hercycle.local.session'
export const PROFILE_DISPLAY_NAMES_KEY = 'hercycle.profile.names'
export const PROFILE_AVATARS_KEY = 'hercycle.profile.avatars'
export const GUEST_PROFILE_SLOT = '__guest__'

const hashPasswordLocal = (password) => {
  const input = `hc-sanctuary::${String(password || '')}`
  let h1 = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h1 ^= input.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193)
  }
  return `v1:${(h1 >>> 0).toString(16).padStart(8, '0')}:${input.length}`
}

const deriveNameFromEmail = (email) => {
  const localPart = String(email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
  if (!localPart) return 'Member'
  return localPart
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const readStoredDisplayNames = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_DISPLAY_NAMES_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const readStoredAvatars = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_AVATARS_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const computeInitials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return ''
  return parts.length >= 2
    ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

export const getAccountProfile = (session) => {
  const storedNames = typeof window !== 'undefined' ? readStoredDisplayNames() : {}
  const storedAvatars = typeof window !== 'undefined' ? readStoredAvatars() : {}
  const user = session?.user

  if (!user) {
    const guestName = String(storedNames[GUEST_PROFILE_SLOT] || '').trim()
    const guestAvatar = String(storedAvatars[GUEST_PROFILE_SLOT] || '').trim()
    return {
      isAuthenticated: false,
      isSignedIn: false,
      displayName: guestName,
      email: '',
      initials: computeInitials(guestName) || 'H',
      avatarUrl: guestAvatar,
      isLocalAccount: false,
      provider: 'guest',
      createdAt: null,
      sessionStartedAt: null,
    }
  }

  const customName =
    (user.id && storedNames[user.id]) || (user.email && storedNames[user.email]) || ''
  const metaName = String(user.user_metadata?.full_name || user.user_metadata?.name || '').trim()
  const displayName = String(customName || metaName || deriveNameFromEmail(user.email)).trim()
  const avatarUrl = String(
    (user.id && storedAvatars[user.id]) ||
      (user.email && storedAvatars[user.email]) ||
      user.user_metadata?.avatar_url ||
      ''
  ).trim()

  const isLocalAccount = Boolean(
    session?.isLocalSanctuary || user?.app_metadata?.provider === 'local'
  )

  return {
    isAuthenticated: true,
    isSignedIn: true,
    id: user.id,
    displayName,
    email: user.email || '',
    initials: computeInitials(displayName) || 'H',
    avatarUrl,
    isLocalAccount,
    provider: isLocalAccount
      ? 'local'
      : String(user?.app_metadata?.provider || 'email'),
    createdAt: user.created_at || session?.created_at || null,
    sessionStartedAt: session?.created_at || user.last_sign_in_at || user.created_at || null,
  }
}

export const saveAccountProfileDetails = async (
  session,
  { displayName: rawName = '', avatarUrl } = {}
) => {
  const cleanName = String(rawName || '').trim().slice(0, 48)
  const user = session?.user

  const nameMap = readStoredDisplayNames()
  if (user) {
    if (user.id) {
      if (cleanName) nameMap[user.id] = cleanName
      else delete nameMap[user.id]
    }
    if (user.email) {
      if (cleanName) nameMap[user.email] = cleanName
      else delete nameMap[user.email]
    }
  } else if (cleanName) {
    nameMap[GUEST_PROFILE_SLOT] = cleanName
  } else {
    delete nameMap[GUEST_PROFILE_SLOT]
  }
  window.localStorage.setItem(PROFILE_DISPLAY_NAMES_KEY, JSON.stringify(nameMap))

  if (avatarUrl !== undefined) {
    const cleanAvatar = String(avatarUrl || '').trim()
    const avatarMap = readStoredAvatars()
    if (user) {
      if (user.id) {
        if (cleanAvatar) avatarMap[user.id] = cleanAvatar
        else delete avatarMap[user.id]
      }
      if (user.email) {
        if (cleanAvatar) avatarMap[user.email] = cleanAvatar
        else delete avatarMap[user.email]
      }
    } else if (cleanAvatar) {
      avatarMap[GUEST_PROFILE_SLOT] = cleanAvatar
    } else {
      delete avatarMap[GUEST_PROFILE_SLOT]
    }
    window.localStorage.setItem(PROFILE_AVATARS_KEY, JSON.stringify(avatarMap))
  }

  if (user) {
    const rawLocalSession = window.localStorage.getItem(LOCAL_SESSION_KEY)
    if (rawLocalSession) {
      const parsed = JSON.parse(rawLocalSession)
      if (parsed?.user?.id === user.id) {
        parsed.user.user_metadata = {
          ...(parsed.user.user_metadata || {}),
          ...(cleanName ? { full_name: cleanName } : {}),
          ...(avatarUrl !== undefined ? { avatar_url: String(avatarUrl || '').trim() } : {}),
        }
        window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(parsed))
      }
    }

    if (supabase && !session?.isLocalSanctuary) {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
        },
      })
      if (error) throw error
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hercycle:account-changed'))
  }

  return getAccountProfile(session)
}

export const saveAccountProfileName = async (session, rawName) => {
  const cleanName = String(rawName || '').trim().slice(0, 48)
  if (!session?.user || !cleanName) return getAccountProfile(session)
  try {
    return await saveAccountProfileDetails(session, { displayName: cleanName })
  } catch {
    return getAccountProfile(session)
  }
}

export const updateAccountPassword = async (
  session,
  { currentPassword = '', newPassword = '' } = {}
) => {
  if (!session?.user) {
    return { ok: false, reason: 'not_signed_in' }
  }
  const cleanNew = String(newPassword || '')
  if (cleanNew.length < 8) {
    return { ok: false, reason: 'too_short' }
  }

  if (session?.isLocalSanctuary || session.user?.app_metadata?.provider === 'local') {
    const accounts = readLocalAccounts()
    const idx = accounts.findIndex(
      (acc) => acc.id === session.user.id || acc.email === session.user.email
    )
    if (idx === -1) {
      return { ok: false, reason: 'account_not_found' }
    }
    const existing = accounts[idx]
    if (existing.passwordHash !== hashPasswordLocal(currentPassword)) {
      return { ok: false, reason: 'wrong_current_password' }
    }
    const updatedAccounts = [...accounts]
    updatedAccounts[idx] = {
      ...existing,
      passwordHash: hashPasswordLocal(cleanNew),
      updated_at: new Date().toISOString(),
    }
    window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(updatedAccounts))
    return { ok: true, reason: null }
  }

  if (supabase) {
    const { error } = await supabase.auth.updateUser({ password: cleanNew })
    if (error) {
      return { ok: false, reason: 'provider_error', message: error.message }
    }
    return { ok: true, reason: null }
  }

  return { ok: false, reason: 'unavailable' }
}

export const deleteAccountOnDevice = async (session) => {
  const user = session?.user
  if (user) {
    const accounts = readLocalAccounts().filter(
      (acc) => acc.id !== user.id && acc.email !== user.email
    )
    window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))

    const names = readStoredDisplayNames()
    if (user.id) delete names[user.id]
    if (user.email) delete names[user.email]
    window.localStorage.setItem(PROFILE_DISPLAY_NAMES_KEY, JSON.stringify(names))

    const avatars = readStoredAvatars()
    if (user.id) delete avatars[user.id]
    if (user.email) delete avatars[user.email]
    window.localStorage.setItem(PROFILE_AVATARS_KEY, JSON.stringify(avatars))
  }

  window.localStorage.removeItem(LOCAL_SESSION_KEY)

  if (supabase && !session?.isLocalSanctuary) {
    await supabase.auth.signOut().catch(() => {})
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hercycle:account-changed', { detail: { session: null } }))
  }
}

export const readLocalSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_SESSION_KEY) || 'null')
    return parsed?.user?.id ? parsed : null
  } catch {
    return null
  }
}

const readLocalAccounts = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const signUpLocalAccount = ({ name, displayName: rawDisplayName, email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const displayName =
    String(name || rawDisplayName || '').trim() || deriveNameFromEmail(normalizedEmail)
  const accounts = readLocalAccounts()
  const existing = accounts.find((acc) => acc.email === normalizedEmail)
  if (existing) {
    return {
      ok: false,
      error: new Error('An account with this email already exists on this device. Sign in instead.'),
      session: null,
    }
  }

  const user = {
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    email: normalizedEmail,
    user_metadata: { full_name: displayName },
    app_metadata: { provider: 'local' },
    created_at: new Date().toISOString(),
  }

  const nextRecord = {
    ...user,
    passwordHash: hashPasswordLocal(password),
  }

  const nextSession = {
    isLocalSanctuary: true,
    user,
    created_at: new Date().toISOString(),
  }

  window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify([...accounts, nextRecord]))
  window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(nextSession))

  const map = readStoredDisplayNames()
  map[user.id] = displayName
  map[normalizedEmail] = displayName
  window.localStorage.setItem(PROFILE_DISPLAY_NAMES_KEY, JSON.stringify(map))

  window.dispatchEvent(new CustomEvent('hercycle:account-changed', { detail: { session: nextSession } }))
  return { ok: true, error: null, session: nextSession }
}

export const signInLocalAccount = ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const accounts = readLocalAccounts()
  const match = accounts.find((acc) => acc.email === normalizedEmail)

  if (!match) {
    // Allow seamless private profile creation when signing in for the first time locally
    return signUpLocalAccount({
      name: deriveNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      password,
    })
  }

  if (match.passwordHash !== hashPasswordLocal(password)) {
    return {
      ok: false,
      error: new Error('Incorrect password for this account. Please try again.'),
      session: null,
    }
  }

  const nextSession = {
    isLocalSanctuary: true,
    user: {
      id: match.id,
      email: match.email,
      user_metadata: match.user_metadata || { full_name: deriveNameFromEmail(match.email) },
      app_metadata: { provider: 'local' },
      created_at: match.created_at,
    },
    created_at: new Date().toISOString(),
  }

  window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(nextSession))
  window.dispatchEvent(new CustomEvent('hercycle:account-changed', { detail: { session: nextSession } }))
  return { ok: true, error: null, session: nextSession }
}

export const signOutLocalAccount = () => {
  try {
    window.localStorage.removeItem(LOCAL_SESSION_KEY)
  } catch {
    // Ignore storage restrictions.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hercycle:account-changed', { detail: { session: null } }))
  }
}

/**
 * Validates a WhatsApp phone number with strict international format enforcement
 * tailored for Ethiopia (+251...) as well as valid international E.164 numbers,
 * explicitly rejecting local numbers starting with 0 (e.g., 0911..., 07...).
 */
export const validateWhatsAppNumber = (rawInput) => {
  const raw = String(rawInput || '').trim()
  if (!raw) {
    return {
      valid: false,
      reason: 'empty',
      normalized: '',
      suggestion: '+2519',
    }
  }

  const compact = raw.replace(/[\s()-]/g, '')

  if (/^0[79]\d{8}$/.test(compact)) {
    return {
      valid: false,
      reason: 'local_zero',
      normalized: '',
      suggestion: `+251${compact.slice(1)}`,
    }
  }
  if (/^[79]\d{8}$/.test(compact)) {
    return {
      valid: false,
      reason: 'missing_plus_country',
      normalized: '',
      suggestion: `+251${compact}`,
    }
  }
  if (/^251[79]\d{8}$/.test(compact)) {
    return {
      valid: false,
      reason: 'missing_plus_sign',
      normalized: '',
      suggestion: `+${compact}`,
    }
  }
  if (/^0/.test(compact) || !compact.startsWith('+')) {
    return {
      valid: false,
      reason: 'must_start_with_plus_251',
      normalized: '',
      suggestion: compact.startsWith('0')
        ? `+251${compact.replace(/^0+/, '')}`
        : `+251${compact.replace(/^\++/, '')}`,
    }
  }

  if (compact.startsWith('+251')) {
    if (!/^\+251[79]\d{8}$/.test(compact)) {
      return {
        valid: false,
        reason: 'invalid_ethiopian_length',
        normalized: '',
        suggestion: '+251911000000',
      }
    }
    return {
      valid: true,
      reason: null,
      normalized: compact,
      waDigits: compact.slice(1),
      suggestion: null,
    }
  }

  if (/^\+[1-9]\d{7,14}$/.test(compact)) {
    return {
      valid: true,
      reason: null,
      normalized: compact,
      waDigits: compact.slice(1),
      suggestion: null,
    }
  }

  return {
    valid: false,
    reason: 'invalid_format',
    normalized: '',
    suggestion: '+2519',
  }
}

export const normalizeToEthiopianWhatsApp = (rawInput) => {
  const result = validateWhatsAppNumber(rawInput)
  if (result.valid) return result.normalized
  return result.suggestion || '+251'
}

export const validateSmsNumber = (rawInput) => {
  const compact = String(rawInput || '').trim().replace(/[\s()-]/g, '')
  if (!compact) return { valid: false, normalized: '' }
  if (/^\+?[0-9]{7,15}$/.test(compact)) {
    return { valid: true, normalized: compact }
  }
  return { valid: false, normalized: '' }
}

export const validateEmailAddress = (rawInput) => {
  const trimmed = String(rawInput || '').trim()
  if (!trimmed) return { valid: false, normalized: '' }
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)
  return { valid: ok, normalized: ok ? trimmed : '' }
}

export const normalizeSocialHandle = (rawHandle) =>
  String(rawHandle || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '')

export const detectMobilePlatform = (uaOverride) => {
  const ua = String(
    uaOverride !== undefined
      ? uaOverride
      : typeof navigator !== 'undefined'
      ? navigator.userAgent || ''
      : ''
  )
  const isIos = /iPad|iPhone|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const uaDataMobile =
    uaOverride === undefined &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.userAgentData?.mobile)
  const isMobile =
    isIos || isAndroid || uaDataMobile || /IEMobile|Opera Mini|Mobile|CriOS|FxiOS/i.test(ua)
  return { isMobile, isIos, isAndroid }
}

/**
 * Copies draft text synchronously first inside the user-activation frame (crucial on iOS Safari
 * & mobile Chrome before deep-link app switching blurs the document) and also triggers the async
 * Clipboard API as backup.
 */
export const copyDraftSynchronously = (text) => {
  const clean = String(text || '').trim()
  if (!clean || typeof document === 'undefined') return false

  let copiedSync = false
  try {
    const copyField = document.createElement('textarea')
    copyField.value = clean
    copyField.setAttribute('readonly', '')
    copyField.style.position = 'fixed'
    copyField.style.top = '0'
    copyField.style.left = '-9999px'
    copyField.style.opacity = '0'
    document.body.appendChild(copyField)
    copyField.focus()
    copyField.select()
    copyField.setSelectionRange(0, clean.length)
    copiedSync = Boolean(document.execCommand && document.execCommand('copy'))
    copyField.remove()
  } catch {
    copiedSync = false
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(clean).catch(() => {})
      return true
    }
  } catch {
    // Ignore clipboard permission errors after synchronous copy attempt.
  }

  return copiedSync
}

export const buildPartnerHandoffLinks = ({
  message,
  phone,
  email,
  subject,
  handle,
  userAgent,
}) => {
  const body = String(message || '').trim()
  const cleanSubject = String(subject || 'Thinking of you ✦').trim()
  const smsCheck = validateSmsNumber(phone)
  const waCheck = validateWhatsAppNumber(phone)
  const emailCheck = validateEmailAddress(email)
  const cleanHandle = normalizeSocialHandle(handle)

  const { isMobile, isIos, isAndroid } = detectMobilePlatform(userAgent)
  const smsDelimiter = isIos ? '&' : '?'

  const smsHref = body
    ? smsCheck.valid
      ? `sms:${encodeURIComponent(smsCheck.normalized)}${smsDelimiter}body=${encodeURIComponent(body)}`
      : `sms:${smsDelimiter}body=${encodeURIComponent(body)}`
    : ''

  const whatsappHref = body
    ? waCheck.valid
      ? `https://wa.me/${waCheck.waDigits}?text=${encodeURIComponent(body)}`
      : ''
    : ''

  const whatsappWebChooserHref = body
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`
    : ''

  // Native mobile app URI deep links + Universal Link fallbacks for Instagram & Snapchat
  const instagramAppHref = body
    ? cleanHandle
      ? `instagram://user?username=${encodeURIComponent(cleanHandle)}`
      : isAndroid
      ? `instagram://sharesheet?text=${encodeURIComponent(body)}`
      : 'instagram://direct-inbox'
    : ''

  const instagramWebHref = body
    ? cleanHandle
      ? `https://ig.me/m/${encodeURIComponent(cleanHandle)}`
      : 'https://www.instagram.com/direct/inbox/'
    : ''

  const instagramHref = instagramWebHref

  const telegramAppHref = body
    ? cleanHandle
      ? `tg://resolve?domain=${encodeURIComponent(cleanHandle)}&text=${encodeURIComponent(body)}`
      : `tg://msg?text=${encodeURIComponent(body)}`
    : ''

  const telegramHref = body
    ? cleanHandle
      ? `https://t.me/${encodeURIComponent(cleanHandle)}?text=${encodeURIComponent(body)}`
      : `https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(body)}`
    : ''

  // Never use web.snapchat.com on mobile (Snapchat blocks mobile browsers there);
  // open native snapchat:// scheme first and fall back to mobile-supported snapchat.com Universal Links.
  const snapchatAppHref = body
    ? cleanHandle
      ? `snapchat://add/${encodeURIComponent(cleanHandle)}`
      : 'snapchat://camera'
    : ''

  const snapchatMobileFallbackHref = body
    ? cleanHandle
      ? `https://www.snapchat.com/add/${encodeURIComponent(cleanHandle)}`
      : 'https://www.snapchat.com/'
    : ''

  const snapchatHref = body
    ? cleanHandle
      ? `https://www.snapchat.com/add/${encodeURIComponent(cleanHandle)}`
      : isMobile
      ? 'https://www.snapchat.com/'
      : 'https://web.snapchat.com/'
    : ''

  const encodedTo = emailCheck.valid ? encodeURIComponent(emailCheck.normalized) : ''
  const encodedSub = encodeURIComponent(cleanSubject)
  const encodedBody = encodeURIComponent(body)

  const mailtoHref = body
    ? `mailto:${encodedTo}?subject=${encodedSub}&body=${encodedBody}`
    : ''

  const gmailHref = body
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSub}&body=${encodedBody}`
    : ''

  const outlookHref = body
    ? `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSub}&body=${encodedBody}`
    : ''

  const yahooHref = body
    ? `https://compose.mail.yahoo.com/?to=${encodedTo}&subj=${encodedSub}&body=${encodedBody}`
    : ''

  return {
    smsHref,
    whatsappHref,
    whatsappWebChooserHref,
    instagramHref,
    instagramAppHref,
    instagramWebHref,
    telegramHref,
    telegramAppHref,
    snapchatHref,
    snapchatAppHref,
    snapchatMobileFallbackHref,
    mailtoHref,
    emailHref: mailtoHref,
    gmailHref,
    outlookHref,
    yahooHref,
    cleanHandle,
    isMobile,
    smsCheck,
    waCheck,
    emailCheck,
  }
}

/**
 * Launches Instagram or Snapchat synchronously inside the click gesture:
 * - Copies draft synchronously first so mobile iOS/Android clipboards hold the message reliably.
 * - On mobile devices: invokes the native app deep link (`instagram://` or `snapchat://`) directly
 *   and arms a visibility-guarded Universal Link fallback in case the native app is not installed.
 * - On desktop browsers: opens the clean web destination in a new tab.
 */
export const launchMobileAwareSocialHandoff = (
  channel,
  links,
  { message = '', userAgent, navigateApp, openWindow } = {}
) => {
  copyDraftSynchronously(message)
  const { isMobile } = detectMobilePlatform(userAgent)

  const appUri =
    channel === 'instagram' ? links.instagramAppHref : links.snapchatAppHref
  const webFallback =
    channel === 'instagram'
      ? links.instagramWebHref || links.instagramHref
      : links.snapchatMobileFallbackHref || links.snapchatHref
  const desktopHref =
    channel === 'instagram' ? links.instagramHref : links.snapchatHref

  const runOpen =
    openWindow ||
    ((url) => {
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    })

  if (!isMobile) {
    if (desktopHref) runOpen(desktopHref)
    return { mode: 'desktop', primaryHref: desktopHref, fallbackHref: null }
  }

  const runAppNavigate =
    navigateApp ||
    ((uri) => {
      if (typeof window !== 'undefined' && window.location) {
        window.location.assign(uri)
      }
    })

  let appOpened = false
  let fallbackTimer = null

  const removeWatchers = () => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer)
      fallbackTimer = null
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', markAppOpened)
      window.removeEventListener('blur', markAppOpened)
    }
  }

  const markAppOpened = () => {
    appOpened = true
    removeWatchers()
  }

  const onVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      markAppOpened()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility)
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', markAppOpened)
    window.addEventListener('blur', markAppOpened)
  }

  if (appUri) {
    runAppNavigate(appUri)
  }

  if (webFallback) {
    fallbackTimer = setTimeout(() => {
      const hidden =
        typeof document !== 'undefined' && document.visibilityState === 'hidden'
      const shouldFallback = !appOpened && !hidden
      removeWatchers()
      if (shouldFallback) {
        runAppNavigate(webFallback)
      }
    }, 820)
  }

  return { mode: 'mobile-app', primaryHref: appUri, fallbackHref: webFallback }
}

export const readGuestDeviceEntries = () => {
  try {
    const cycles = JSON.parse(window.localStorage.getItem(GUEST_CYCLES_KEY) || '[]')
    const intimacy = JSON.parse(window.localStorage.getItem(GUEST_INTIMACY_KEY) || '[]')
    return {
      cycles: Array.isArray(cycles) ? cycles : [],
      intimacy: Array.isArray(intimacy) ? intimacy : [],
    }
  } catch {
    return { cycles: [], intimacy: [] }
  }
}

export const hasDismissedGuestMigration = (userId) => {
  if (!userId) return true
  try {
    return window.localStorage.getItem(`${GUEST_MIGRATION_DISMISSED_PREFIX}${userId}`) === 'true'
  } catch {
    return false
  }
}

export const dismissGuestMigration = (userId) => {
  if (!userId) return
  try {
    window.localStorage.setItem(`${GUEST_MIGRATION_DISMISSED_PREFIX}${userId}`, 'true')
  } catch {
    // Ignore storage quota issues.
  }
}

export const inspectGuestMigrationCandidates = (userId) => {
  if (!userId || hasDismissedGuestMigration(userId)) {
    return { hasGuestData: false, cycleCount: 0, intimacyCount: 0 }
  }
  const { cycles, intimacy } = readGuestDeviceEntries()
  return {
    hasGuestData: cycles.length > 0 || intimacy.length > 0,
    cycleCount: cycles.length,
    intimacyCount: intimacy.length,
  }
}

export const importGuestDataToAccount = async (firstArg, secondArg = {}, thirdArg = {}) => {
  const client =
    firstArg && typeof firstArg === 'object' && typeof firstArg.from === 'function'
      ? firstArg
      : supabase
  const userId = typeof firstArg === 'string' ? firstArg : secondArg
  const opts = typeof firstArg === 'string' ? secondArg || {} : thirdArg || {}
  const conflictRule = opts.conflictStrategy || opts.conflictRule || 'keep_account'

  if (!userId || !client) {
    throw new Error('Sign in with an active connection to import device entries.')
  }

  const { cycles, intimacy } = readGuestDeviceEntries()
  let importedCycles = 0
  let importedIntimacy = 0

  if (cycles.length) {
    let rowsToWrite = cycles
    if (conflictRule === 'keep_account') {
      const { data: existingRows, error: fetchError } = await client
        .from('cycles')
        .select('date')
        .eq('user_id', userId)
      if (fetchError) throw fetchError
      const existingDates = new Set((existingRows || []).map((row) => row.date))
      rowsToWrite = cycles.filter((entry) => entry?.date && !existingDates.has(entry.date))
    }

    if (rowsToWrite.length) {
      const payload = rowsToWrite.map((entry) => ({
        user_id: userId,
        phase: entry.phase || 'menstrual',
        mood: entry.mood ?? 5,
        energy: entry.energy ?? 5,
        libido: entry.libido ?? null,
        period: Boolean(entry.period),
        date: entry.date,
        period_start_date: entry.period ? entry.period_start_date || entry.date : null,
        period_duration_days: entry.period ? Number(entry.period_duration_days) || 5 : null,
      }))
      const { error: upsertError } = await client
        .from('cycles')
        .upsert(payload, { onConflict: 'user_id,date' })
      if (upsertError) throw upsertError
      importedCycles = payload.length
    }
  }

  if (intimacy.length) {
    let rowsToWrite = intimacy
    if (conflictRule === 'keep_account') {
      const { data: existingRows, error: fetchError } = await client
        .from('intimacy_logs')
        .select('date')
        .eq('user_id', userId)
      if (fetchError) throw fetchError
      const existingDates = new Set((existingRows || []).map((row) => row.date))
      rowsToWrite = intimacy.filter((entry) => entry?.date && !existingDates.has(entry.date))
    }

    if (rowsToWrite.length) {
      const payload = rowsToWrite.map((entry) => ({
        user_id: userId,
        libido: entry.libido ?? null,
        intimacy_level: entry.intimacy_level ?? 0,
        traffic_light: entry.traffic_light || null,
        preferred_terms: Array.isArray(entry.preferred_terms) ? entry.preferred_terms : [],
        desire_vibe: ['tender', 'playful', 'naughty'].includes(entry.desire_vibe)
          ? entry.desire_vibe
          : 'tender',
        date: entry.date,
      }))
      const { error: upsertError } = await supabase
        .from('intimacy_logs')
        .upsert(payload, { onConflict: 'user_id,date' })
      if (upsertError) throw upsertError
      importedIntimacy = payload.length
    }
  }

  try {
    window.localStorage.removeItem(GUEST_CYCLES_KEY)
    window.localStorage.removeItem(GUEST_INTIMACY_KEY)
    dismissGuestMigration(userId)
  } catch {
    // Database records are already safely written.
  }

  window.dispatchEvent(
    new CustomEvent('hercycle:data-changed', {
      detail: { source: 'account-import', importedCycles, importedIntimacy },
    })
  )

  return { importedCycles, importedIntimacy }
}

export const seedFirstAccountPreferences = async (userId) => {
  if (!userId || !supabase) return
  let onboarding = {}
  let preferences = {}
  try {
    onboarding = JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}')
    preferences = JSON.parse(window.localStorage.getItem('hercycle.preferences') || '{}')
  } catch {
    return
  }

  const { data: existing, error: loadError } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (loadError) throw loadError
  if (existing || !onboarding.phase_selected) return

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      onboarding_completed: true,
      phase_selected: onboarding.phase_selected,
      tone_preference: onboarding.tone_preference || 'balanced',
      theme_preference: preferences.theme || 'light',
      font_size: preferences.fontSize || 'medium',
      hide_intimacy: Boolean(preferences.hide_intimacy ?? preferences.hideIntimacy),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) throw error
}

export const validateWhatsappPlus251 = validateWhatsAppNumber
export const validatePartnerSms = validateSmsNumber
export const validatePartnerEmail = validateEmailAddress
export const isGuestImportDismissed = hasDismissedGuestMigration
export const markGuestImportDismissed = dismissGuestMigration
export const inspectLocalGuestData = () => {
  const { cycles, intimacy } = readGuestDeviceEntries()
  return {
    hasGuestData: cycles.length > 0 || intimacy.length > 0,
    cycleCount: cycles.length,
    intimacyCount: intimacy.length,
  }
}
