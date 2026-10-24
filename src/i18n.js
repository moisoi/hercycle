import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import english from './locales/en.json'
import amharic from './locales/am.json'

export const LANGUAGE_STORAGE_KEY = 'hercycle.language'

export const getSavedLanguage = () => {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return stored === 'am' ? 'am' : 'en'
  } catch {
    return 'en'
  }
}

export const setAppLanguage = (nextLang) => {
  const resolved = nextLang === 'am' ? 'am' : 'en'
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved)
  } catch {
    // Ignore storage quota limits.
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', resolved)
  }
  i18next.changeLanguage(resolved)
  return resolved
}

const initialLanguage = typeof window !== 'undefined' ? getSavedLanguage() : 'en'
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', initialLanguage)
}

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      en: { translation: english },
      am: { translation: amharic },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    debug: false,
    initImmediate: false,
    interpolation: { escapeValue: false },
    parseMissingKeyHandler: (key) =>
      key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[._]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
  })
}

export default i18next
